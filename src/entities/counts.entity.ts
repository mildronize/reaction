import { SetOptional } from 'type-fest';
import { AzureTableEntityBase, EntityKeyGenerator } from '../libs/azure-table';

/**
 * Counts entity
 * Ported from https://github.com/isunjn/reaction/blob/main/schema.sql
 * 
 * - PartitionKey: {slug}
 * - RowKey: {emoji}
 */
export interface ICountsEntity extends AzureTableEntityBase {
  slug: string;
  emoji: string;
  count: number;
}

/**
 * Counts entity
 * Ported from https://github.com/isunjn/reaction/blob/main/schema.sql
 * 
 * - PartitionKey: {slug}
 * - RowKey: {emoji}
 */
export class CountsEntity  implements EntityKeyGenerator {
  public readonly value: ICountsEntity;

  constructor(object: SetOptional<ICountsEntity, 'partitionKey' | 'rowKey'>) {
    this.value = {
      partitionKey: object.partitionKey ?? this.getPartitionKey(object),
      rowKey: object.rowKey ?? this.getRowKey(object),
      ...object,
    };
  }

  getPartitionKey(object?: SetOptional<ICountsEntity, 'partitionKey' | 'rowKey'>) {
    if(!object) object = this.value;
    return object.slug;
  }

  getRowKey(object?: SetOptional<ICountsEntity, 'partitionKey' | 'rowKey'>) {
    if(!object) object = this.value;
    return object.emoji;
  }
}