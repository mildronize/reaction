
import { Hono } from 'hono'
const app = new Hono().basePath('/api')

app.get('/', (c) => c.text('Hello Azure Functions! __'))

export default app