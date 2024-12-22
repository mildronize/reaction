import { Hono } from "hono";
import { cors } from "hono/cors";
import { getIpAddress } from "./utils";
import { parseEnvToVariables, HonoEnv } from "./env";
import { secureHeaders } from 'hono/secure-headers';

const app = new Hono<HonoEnv>().basePath("/api");

app.use(parseEnvToVariables());
app.use("*", (c, next) => {
  const corsMiddlewareHandler = cors({ origin: c.var.ORIGINS });
  return corsMiddlewareHandler(c, next);
});
app.use("*", secureHeaders());
app.get("/", (c) => {
  const origins = c.var.ORIGINS;
  return c.text(`Hello Azure Functions! ${getIpAddress(c.req)} - s=> ${origins.join(", ")}`);
});

export default app;
