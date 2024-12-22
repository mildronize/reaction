import { AzureTableEntityBase } from '../libs/azure-table';


/**
 * Reaction entity
 * Ported from https://github.com/isunjn/reaction/blob/main/schema.sql
 * 
 * - PartitionKey: `{slug}`
 * - RowKey: `{uid:12}-{emoji}`
 * 
 * Note: `{uid}` padded to 12 characters
 */
export interface ReactionEntity extends AzureTableEntityBase {
  slug: string;
  uid: string;
  emoji: string;
}
