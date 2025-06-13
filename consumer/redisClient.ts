import redis from 'redis';
import { createClient, RedisClientType } from 'redis';


let redisClient: RedisClientType;
export const getRedisClient = async (): Promise<RedisClientType> => {
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