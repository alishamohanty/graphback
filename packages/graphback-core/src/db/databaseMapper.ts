import { GraphQLField, GraphQLFieldMap, GraphQLObjectType, GraphQLSchema, isObjectType } from "graphql";
import { parseDbAnnotations } from '../annotations/parser';
import { getUserModels } from '../crud';
import { getModelTypesFromSchema } from '../plugin/getModelTypesFromSchema';
import { DatabaseNameTransformDirection, defaultColumnNameTransform, defaultTableNameTransform } from './defaultNameTransforms';
import { getPrimaryKey } from './getPrimaryKey';

/**
 * Contains mapping information between GraphQL Model type and database table
 * 
 * - typeName: Original GraphQLObjectType name
 * - tableName: Name of datase table
 * - id: Indicates the primary key field
 * - fieldMap: Object of key-value mapping between GraphQL fields and database columns.
 */
export interface ModelTableMapping {
  typeName: string
  tableName: string
  id: string
  fieldMap: any
}

export const getModelTableMappings = (schema: GraphQLSchema): ModelTableMapping[] => {
  const modelTypes = getModelTypesFromSchema(schema);
  const models = getUserModels(modelTypes);

  return mapModelsToTables(models);
}

function mapModelsToTables(models: GraphQLObjectType[]): ModelTableMapping[] {
  return models.map((model: GraphQLObjectType) => {
    return {
      id: getPrimaryKey(model),
      typeName: model.name,
      tableName: getTableOrColumnName(model),
      fieldMap: mapFieldsToColumns(model.getFields())
    }
  });
}

// TODO: Indentify and map nested query data
function mapFieldsToColumns(fieldMap: GraphQLFieldMap<any, any>) {
  return Object.values(fieldMap).reduce((obj: any, field: GraphQLField<any, any>) => {
    obj[field.name] = getTableOrColumnName(field);

    return obj;
  }, {});
}

export function getTableOrColumnName(modelOrField: GraphQLObjectType | GraphQLField<any, any>): string {
  let transformedName = transformTableOrColumnName(modelOrField);

  const dbAnnotations = parseDbAnnotations(modelOrField);

  if (dbAnnotations.name) {
    transformedName = dbAnnotations.name;
  }

  return transformedName;
}

function transformTableOrColumnName(modelOrField: GraphQLObjectType | GraphQLField<any, any>, direction: DatabaseNameTransformDirection = 'to-db'): string {
  if (modelOrField instanceof GraphQLObjectType) {
    return defaultTableNameTransform(modelOrField.name, direction);
  }

  return defaultColumnNameTransform(modelOrField.name, direction);
}