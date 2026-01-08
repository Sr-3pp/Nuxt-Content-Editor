import { collections } from '#content/preview';

export type SchemaNode = {
  type?: string | string[];
  enum?: unknown[];
  items?: SchemaNode;
  properties?: Record<string, SchemaNode>;
  anyOf?: SchemaNode[];
  oneOf?: SchemaNode[];
  allOf?: SchemaNode[];
  $ref?: string;
};

type CollectionSchema = {
  definitions?: Record<string, SchemaNode>;
};

const resolveRef = (root: CollectionSchema | null, node: SchemaNode | null): SchemaNode | null => {
  if (!root?.definitions || !node?.$ref) {
    return node;
  }
  const key = node.$ref.replace('#/definitions/', '');
  return root.definitions[key] || node;
};

const mergeSchemas = (base: SchemaNode | null, next: SchemaNode | null): SchemaNode | null => {
  if (!base) {
    return next;
  }
  if (!next) {
    return base;
  }
  return {
    ...base,
    ...next,
    properties: {
      ...(base.properties || {}),
      ...(next.properties || {})
    }
  };
};

const normalizeNode = (root: CollectionSchema | null, node: SchemaNode | null): SchemaNode | null => {
  if (!node) {
    return null;
  }

  const resolved = resolveRef(root, node);
  let current: SchemaNode = { ...resolved };

  if (current.anyOf?.length) {
    const withoutNull = current.anyOf.find((entry) => entry.type !== 'null');
    return normalizeNode(root, withoutNull || current.anyOf[0] || null);
  }

  if (current.oneOf?.length) {
    const withoutNull = current.oneOf.find((entry) => entry.type !== 'null');
    return normalizeNode(root, withoutNull || current.oneOf[0] || null);
  }

  if (current.allOf?.length) {
    return current.allOf
      .map((entry) => normalizeNode(root, entry))
      .reduce((acc, entry) => mergeSchemas(acc, entry), null);
  }

  if (Array.isArray(current.type)) {
    current.type = current.type.find((type) => type !== 'null') || current.type[0];
  }

  if (current.properties) {
    current.properties = Object.entries(current.properties).reduce<Record<string, SchemaNode>>(
      (acc, [key, value]) => {
        const normalized = normalizeNode(root, value);
        if (normalized) {
          acc[key] = normalized;
        }
        return acc;
      },
      {}
    );
  }

  if (current.items) {
    current.items = normalizeNode(root, current.items) || undefined;
  }

  return current;
};

export const createSchemaResolver = (collectionName = 'content') => {
  const collection = collections?.[collectionName as keyof typeof collections];
  const schemaRoot = (collection as { schema?: CollectionSchema } | undefined)?.schema || null;
  const definitions = schemaRoot?.definitions || null;
  const definitionName =
    collection?.name && definitions?.[collection.name]
      ? collection.name
      : Object.keys(definitions || {})[0];
  const rootDefinition = definitions?.[definitionName] || null;

  const normalize = (node?: SchemaNode | null) => normalizeNode(schemaRoot, node || null);

  const getComponentSchema = (componentName: string): SchemaNode | null => {
    if (!rootDefinition?.properties) {
      return null;
    }
    return normalize(rootDefinition.properties[componentName] || null);
  };

  const getPropSchema = (componentName: string | number, propKey: string | number): SchemaNode | null => {
    if (!schemaRoot || !definitions) {
      return null;
    }
    const componentSchema = getComponentSchema(String(componentName));
    if (!componentSchema?.properties) {
      return null;
    }
    const key = typeof propKey === 'string' && propKey.startsWith(':') ? propKey.slice(1) : String(propKey);
    return normalize(componentSchema.properties[key] || null);
  };

  return {
    getPropSchema,
    normalize
  };
};
