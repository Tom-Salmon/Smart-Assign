import redis from 'redis';
import { createClient, RedisClientType } from 'redis';


let redisClient: RedisClientType;
const getRedisClient = async (): Promise<RedisClientType> => {
    if (!redisClient || !redisClient.isOpen) {
        redisClient = createClient({
            url: 'redis://localhost:6379',
        });
        redisClient.on('error', (err) => console.error('Redis Client Error', err));
        await redisClient.connect();
        console.log('Connected to Redis');
    }
    return redisClient;
}

const disconnectRedisClient = async (): Promise<void> => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        console.log('Disconnected from Redis');
    }
}

export { getRedisClient, disconnectRedisClient };