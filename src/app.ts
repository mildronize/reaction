
import { Hono } from 'hono'
import { getIpAddress } from './utils';
const app = new Hono().basePath('/api')

app.get('/', (c) => {
  return c.text(`Hello Azure Functions! ${getIpAddress(c.req)}`);
})

export default app