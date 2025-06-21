import { WorkerModel } from './mongoClient';
import { getRedisClient } from './redisClient';
import { REDIS_CACHE_TTL } from '../config';
import { Worker } from '../types/entities';
import { v4 as uuidv4 } from 'uuid';
import { isValidObjectId, mongo } from 'mongoose';

export async function handleNewWorker(workerData: Worker): Promise<void> {
    const redisClient = await getRedisClient();
    try {
        const newWorker = await WorkerModel.create({ _id: uuidv4(), ...workerData });
        await redisClient.set(`worker:${newWorker._id}`, JSON.stringify({ ...workerData, id: newWorker._id.toString() }), { EX: REDIS_CACHE_TTL });
        console.log('Worker saved to MongoDB and Redis:', newWorker._id);
    } catch (error) {
        console.error('Error creating new worker:', error);
    }
};


export async function getAllWorkers(): Promise<Worker[]> {
    try {
        const docs = await WorkerModel.find({}).lean();
        return docs.map((doc: any) => ({ ...doc, id: doc._id.toString() })) as Worker[];
    }
    catch (error) {
        console.error('Error fetching workers:', error);
        return [];
    }
}
