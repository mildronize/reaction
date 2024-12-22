import { Hono } from 'hono';
// import { cors } from "hono/cors";
import { getIpAddress, hashed } from './utils';
import { parseEnvToVariables, HonoEnv } from './env';
import { secureHeaders } from 'hono/secure-headers';
import { ODataExpression } from 'ts-odata-client';
import { InferAzureTable } from './libs/azure-table';

const app = new Hono<HonoEnv>().basePath('/api');

app.use(parseEnvToVariables());
// app.use("*", (c, next) => {
//   const corsMiddlewareHandler = cors({ origin: c.var.ORIGINS });
//   return corsMiddlewareHandler(c, next);
// });

app.use('*', secureHeaders());
app.get('/', async c => {
  const ip = getIpAddress(c.req);
  const slug = c.req.query('slug');
  if (!slug || typeof slug !== 'string') {
    return c.json({ msg: 'invalid request' }, 400);
  }
  if (!ip) console.log('IP is unknown');
  const uid = await hashed(ip ?? 'unknown');
  const countsTable = c.var.AZURE_TABLE.counts;
  const countsResult = await countsTable.listAll(
    ODataExpression.forV4<InferAzureTable<typeof countsTable>>()
      .filter(p => p.slug.$equals(slug))
      .build()
  );
  const reactionsTable = c.var.AZURE_TABLE.reactions;
  const reactionsResult = await reactionsTable.listAll(
    ODataExpression.forV4<InferAzureTable<typeof reactionsTable>>()
      .filter(p => p.slug.$equals(slug).and(p.uid.$equals(uid)))
      .build()
  );
  const counts = new Map(countsResult.map((row) => [row.emoji, row.count]));
  const reacted = new Set(reactionsResult.map((row) => row.emoji));

  // const reaction = Object.fromEntries(
  //   valid[slug].map((emoji) => [emoji, [counts.get(emoji) || 0, reacted.has(emoji)]]),
  // );
  const reaction = Object.fromEntries(
    c.var.EMOJIS.map((emoji) => [emoji, [counts.get(emoji) || 0, reacted.has(emoji)]]),
  );

  return c.json(reaction);

  // return c.text(`Hello Azure Functions! ${slug} ${uid} `);
  // return c.json({
  //   '👍': [123, true], // emoji: [count, reacted]
  //   '👀': [456, false],
  // });
});

export default app;
