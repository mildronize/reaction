import { createMiddleware } from 'hono/factory';
import type { MiddlewareHandler } from "hono/types";
import { z } from 'zod';
import 'dotenv/config';

function validateStringArray(name: string, value: unknown): string[] {
  if (typeof value !== 'string') throw new Error(`${name} is required`);
  const result =  z.array(z.string()).parse(JSON.parse(value as string));
  return result;
}

export const environmentSchema = z.object({
  ORIGINS: z.preprocess((value: unknown) => validateStringArray('ORIGINS',value), z.array(z.string())),
  EMOJIS: z.preprocess((value: unknown) => validateStringArray('EMOJIS',value), z.array(z.string())),
});

export type HonoEnv = {
  Variables: z.infer<typeof environmentSchema>;
};

const env = environmentSchema.parse(process.env);

export const parseEnvToVariables = (): MiddlewareHandler => {
  return createMiddleware<HonoEnv>(async (c, next) => {
    c.set('ORIGINS', env.ORIGINS);
    c.set('EMOJIS', env.EMOJIS);
    await next();
  });
}
