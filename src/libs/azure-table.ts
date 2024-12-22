import { ListTableEntitiesOptions, TableClient, TableServiceClientOptions, TableTransaction } from '@azure/data-tables';
import chunk from 'lodash.chunk';
export interface AzureTableEntityBase {
  partitionKey: string;
  rowKey: string;
}

export type InferAzureTable<T> = T extends AzureTable<infer U> ? U : never;

/**
 * Generic Azure Table class
 */
export class AzureTable<TEntity extends AzureTableEntityBase> {
  /**
   * The transaction can include at most 100 entities.
   * @see https://learn.microsoft.com/en-us/rest/api/storageservices/performing-entity-group-transactions#requirements-for-entity-group-transactions
   */
  public readonly maxBatchChange: number = 100;

  constructor(public readonly client: TableClient) {}

  async createTable() {
    return this.client.createTable();
  }

  /**
   * Query entities
   * TODO: may fix type safety later
   *
   * select prop type may incorrect
   */
  list(
    queryOptions?: ListTableEntitiesOptions['queryOptions'],
    listTableEntitiesOptions?: Omit<ListTableEntitiesOptions, 'queryOptions'>
  ) {
    return this.client.listEntities<TEntity>({
      ...listTableEntitiesOptions,
      queryOptions,
    });
  }

  async listAll(
    queryOptions?: ListTableEntitiesOptions['queryOptions'],
    listTableEntitiesOptions?: Omit<ListTableEntitiesOptions, 'queryOptions'>
  ) {
    const entities = this.client.listEntities<TEntity>({
      ...listTableEntitiesOptions,
      queryOptions,
    });

    const result = [];
    // List all the entities in the table
    for await (const entity of entities) {
      result.push(entity);
    }
    return result;
  }

  async insert(entity: TEntity) {
    return this.client.createEntity<TEntity>(entity);
  }

  /**
   * All operations in a transaction must target the same partitionKey
   */

  async insertBatch(rawEntities: TEntity[]) {
    const groupByPartitionKey = this.groupPartitionKey(rawEntities);
    for (const entities of Object.values(groupByPartitionKey)) {
      const entityChunks = chunk(entities, this.maxBatchChange);
      for (const entityChunk of entityChunks) {
        const transaction = new TableTransaction();
        entityChunk.forEach(entity => transaction.createEntity(entity));
        await this.client.submitTransaction(transaction.actions);
      }
    }
  }

  /**
   * All operations in a transaction must target the same partitionKey
   */
  async upsertBatch(rawEntities: TEntity[]) {
    const groupByPartitionKey = this.groupPartitionKey(rawEntities);
    for (const entities of Object.values(groupByPartitionKey)) {
      const entityChunks = chunk(entities, this.maxBatchChange);
      for (const entityChunk of entityChunks) {
        const transaction = new TableTransaction();
        entityChunk.forEach(entity => transaction.upsertEntity(entity));
        await this.client.submitTransaction(transaction.actions);
      }
    }
  }

  async deleteBatch(rawEntities: TEntity[]) {
    const groupByPartitionKey = this.groupPartitionKey(rawEntities);
    for (const entities of Object.values(groupByPartitionKey)) {
      const entityChunks = chunk(entities, this.maxBatchChange);
      for (const entityChunk of entityChunks) {
        const transaction = new TableTransaction();
        entityChunk.forEach(entity => {
          const { partitionKey, rowKey } = entity;
          transaction.deleteEntity(partitionKey, rowKey);
        });
        await this.client.submitTransaction(transaction.actions);
      }
    }
  }

  /**
   * Group entities by partitionKey
   * Becasue all operations in a transaction must target the same partitionKey
   *
   * @param entities
   * @returns
   */
  groupPartitionKey(entities: TEntity[]) {
    return entities.reduce((acc, cur) => {
      if (!acc[cur.partitionKey]) {
        acc[cur.partitionKey] = [];
      }
      acc[cur.partitionKey].push(cur);
      return acc;
    }, {} as Record<string, TEntity[]>);
  }
}
