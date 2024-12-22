import { AzureTableEntityBase } from '../libs/azure-table';

/**
 * Counts entity
 * Ported from https://github.com/isunjn/reaction/blob/main/schema.sql
 * 
 * - PartitionKey: {slug}
 * - RowKey: {emoji}
 */
export interface CountsEntity extends AzureTableEntityBase {
  slug: string;
  emoji: string;
  count: number;
}
