import type { SchemaNode } from './schema';

export const isNumericString = (val: any) =>
  typeof val === 'string' && val.trim() !== '' && !Number.isNaN(Number(val));

export const isNumericValue = (val: any) =>
  typeof val === 'number' || isNumericString(val);

const schemaType = (schema?: SchemaNode | null): string | undefined => {
  if (!schema) {
    return undefined;
  }
  if (Array.isArray(schema.type)) {
    return schema.type.find((type) => type !== 'null') || schema.type[0];
  }
  return schema.type;
};

const isNumberSchema = (schema?: SchemaNode | null) => {
  const type = schemaType(schema);
  return type === 'number' || type === 'integer';
};

export const inputTypeFor = (val: any, schema?: SchemaNode | null): 'number' | 'text' => {
  if (isNumberSchema(schema)) {
    return 'number';
  }
  return isNumericValue(val) ? 'number' : 'text';
};

export const normalizeInputValue = (raw: string, current: any, schema?: SchemaNode | null): string | number => {
  if (isNumberSchema(schema) || isNumericValue(current)) {
    return raw === '' ? '' : Number(raw);
  }
  return raw;
};
