import { createClient, RedisClientType } from 'redis';
import { REDIS_URL } from '../config';
import { logger } from './logger';

// This module provides a Redis client for connecting to a Redis server.
// It exports functions to get the Redis client and disconnect it when needed.

let redisClient: RedisClientType;
const getRedisClient = async (): Promise<RedisClientType> => {
    if (!redisClient || !redisClient.isOpen) {
        redisClient = createClient({
            url: REDIS_URL,
        });
        redisClient.on('error', (err) => logger.error('Redis Client Error', err));
        await redisClient.connect();
        logger.info('Connected to Redis');
    }
    return redisClient;
}

const disconnectRedisClient = async (): Promise<void> => {
    if (redisClient && redisClient.isOpen) {
        await redisClient.quit();
        logger.info('Disconnected from Redis');
    }
}

export { getRedisClient, disconnectRedisClient };