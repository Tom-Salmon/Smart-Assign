// /src/config/index.ts

import dotenv from 'dotenv';
dotenv.config();

export const KAFKA_BROKER = process.env.KAFKA_BROKER || 'localhost:9092';
export const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'smartassign-core';

export const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartassign';
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const REDIS_CACHE_TTL = parseInt(process.env.REDIS_CACHE_TTL || '3600', 10);