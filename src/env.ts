import { createMiddleware } from 'hono/factory';
import type { MiddlewareHandler } from 'hono/types';
import { z } from 'zod';
import 'dotenv/config';
import { AzureTable } from './libs/azure-table';
import { TableClient } from '@azure/data-tables';
import { ICountsEntity } from './entities/counts.entity';
import { IReactionEntity } from './entities/reactions.entity';

function validateStringArray(name: string, value: unknown): string[] {
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  const result = z.array(z.string()).parse(JSON.parse(value as string));
  return result;
}

export const environmentSchema = z.object({
  ORIGINS: z.preprocess((value: unknown) => validateStringArray('ORIGINS', value), z.array(z.string())),
  EMOJIS: z.preprocess((value: unknown) => validateStringArray('EMOJIS', value), z.array(z.string())),
  AZURE_TABLE_CONNECTION_STRING: z.string(),
  /**
   * Use for share multiple app in one Azure Storage Account
   */
  AZURE_TABLE_PREFIX: z.string().default('Reaction'),
});

const env = environmentSchema.parse(process.env);

export const azureTableClient = {
  counts: new AzureTable<ICountsEntity>(
    TableClient.fromConnectionString(env.AZURE_TABLE_CONNECTION_STRING, `${env.AZURE_TABLE_PREFIX}Counts`)
  ),
  reactions: new AzureTable<IReactionEntity>(
    TableClient.fromConnectionString(env.AZURE_TABLE_CONNECTION_STRING, `${env.AZURE_TABLE_PREFIX}Reactions`)
  ),
};

export type HonoEnv = {
  Variables: z.infer<typeof environmentSchema> & {
    AZURE_TABLE: typeof azureTableClient;
  }
};

export const parseEnvToVariables = (): MiddlewareHandler => {
  return createMiddleware<HonoEnv>(async (c, next) => {
    c.set('ORIGINS', env.ORIGINS);
    c.set('EMOJIS', env.EMOJIS);
    c.set('AZURE_TABLE_CONNECTION_STRING', env.AZURE_TABLE_CONNECTION_STRING);
    c.set('AZURE_TABLE_PREFIX', env.AZURE_TABLE_PREFIX);
    c.set('AZURE_TABLE', azureTableClient);
    await azureTableClient.counts.createTable();
    await azureTableClient.reactions.createTable();
    await next();
  });
};
