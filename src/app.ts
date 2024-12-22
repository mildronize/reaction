import { Hono } from 'hono';
// import { cors } from "hono/cors";
import { getIpAddress, hashed } from './utils';
import { parseEnvToVariables, HonoEnv } from './env';
import { secureHeaders } from 'hono/secure-headers';
import { ODataExpression } from 'ts-odata-client';
import { InferAzureTable } from './libs/azure-table';
import { ReactionEntity } from './entities/reactions.entity';
import { CountsEntity } from './entities/counts.entity';

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
  const counts = new Map(countsResult.map(row => [row.emoji, row.count]));
  const reacted = new Set(reactionsResult.map(row => row.emoji));

  const reaction = Object.fromEntries(c.var.EMOJIS.map(emoji => [emoji, [counts.get(emoji) || 0, reacted.has(emoji)]]));

  return c.json(reaction);
});

// app.post('/aaa', async c => {
//   // return c.text(JSON.stringify(c.req));
//   const body = await c.req.json();
//   return c.json(body);
// });

app.post('/', async c => {
  const ip = getIpAddress(c.req) ?? 'unknown';
  const body = await c.req.json();
  console.log(`body: ${JSON.stringify(body)}`);
  const { slug, target, reacted } = body;
  if (
    !ip ||
    !slug ||
    !target ||
    typeof slug !== 'string' ||
    typeof target !== 'string' ||
    typeof reacted !== 'boolean'
  ) {
    return c.json({ msg: 'invalid request' }, 400);
  }
  const uid = await hashed(ip);
  const reactionsTable = c.var.AZURE_TABLE.reactions;
  const countsTable = c.var.AZURE_TABLE.counts;
  const alreadyReacted = await reactionsTable.count(
    ODataExpression.forV4<InferAzureTable<typeof reactionsTable>>()
      .filter(p => p.slug.$equals(slug).and(p.uid.$equals(uid)).and(p.emoji.$equals(target)))
      .build()
  );

  if (reacted) {
    if (alreadyReacted) {
      return c.json({ msg: 'already reacted' }, 400);
    }

    await reactionsTable.insert(new ReactionEntity({ slug, uid, emoji: target }).value);
    const count = await countsTable.count(
      ODataExpression.forV4<InferAzureTable<typeof countsTable>>()
        // partitionKey: slug, rowKey: emoji
        .filter(p => p.partitionKey.$equals(slug).and(p.rowKey.$equals(target)))
        .build()
    );
    await countsTable.client.upsertEntity(new CountsEntity({ slug, emoji: target, count: count + 1 }).value);
  } else {
    if (!alreadyReacted) {
      return c.json({ msg: 'not reacted' }, 400);
    }
    const targetedReaction = new ReactionEntity({ slug, uid, emoji: target });
    await reactionsTable.client.deleteEntity(targetedReaction.getPartitionKey(), targetedReaction.getRowKey());

    const count = await countsTable.count(
      ODataExpression.forV4<InferAzureTable<typeof countsTable>>()
        // partitionKey: slug, rowKey: emoji
        .filter(p => p.partitionKey.$equals(slug).and(p.rowKey.$equals(target)))
        .build()
    );
    if (count > 1) {
      await countsTable.client.upsertEntity(new CountsEntity({ slug, emoji: target, count: count - 1 }).value);
    } else {
      const targetedReaction = new CountsEntity({ slug, emoji: target, count: 0 });
      await countsTable.client.deleteEntity(targetedReaction.getPartitionKey(), targetedReaction.getRowKey());
    }
  }

  return c.json({
    success: true,
  });
});

export default app;
