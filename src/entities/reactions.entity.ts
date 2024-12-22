import type { AzureTableEntityBase, EntityKeyGenerator } from '../libs/azure-table';
import type { SetOptional } from 'type-fest';
/**
 * Reaction entity
 * Ported from https://github.com/isunjn/reaction/blob/main/schema.sql
 */
export interface IReactionEntity extends AzureTableEntityBase {
  slug: string;
  uid: string;
  emoji: string;
}

/**
 * Reaction entity
 * - PartitionKey: `{slug}`
 * - RowKey: `{uid:30}-{emoji}`
 *
 * Note: `{uid}` padded to 30 characters
 */
export class ReactionEntity implements EntityKeyGenerator{
  public readonly value: IReactionEntity;

  constructor(object: SetOptional<IReactionEntity, 'partitionKey' | 'rowKey'>) {
    this.value = {
      partitionKey: object.partitionKey ?? this.getPartitionKey(object),
      rowKey: object.rowKey ?? this.getRowKey(object),
      ...object,
    };
  }

  getPartitionKey(object?: SetOptional<IReactionEntity, 'partitionKey' | 'rowKey'>) {
    if (!object) object = this.value;
    return object.slug;
  }

  getRowKey(object?: SetOptional<IReactionEntity, 'partitionKey' | 'rowKey'>) {
    if (!object) object = this.value
    return `${object.uid.padStart(30, '0')}-${object.emoji}`
  }


}