import { createClient } from "redis";
const client = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
})
client.on('error', (err) => console.log('redis client err' + err));
(async () => {
    await client.connect()
    console.log('Redis connected');
})()
export default client