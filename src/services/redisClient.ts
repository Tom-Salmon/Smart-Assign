import { createClient, RedisClientType } from 'redis';
import { REDIS_URL } from '../config';


let redisClient: RedisClientType;
const getRedisClient = async (): Promise<RedisClientType> => {
    if (!redisClient || !redisClient.isOpen) {
        redisClient = createClient({
            url: REDIS_URL,
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