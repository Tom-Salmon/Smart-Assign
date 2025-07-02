import { WorkerModel } from '../models/mongoClient';
import { getRedisClient } from './redisClient';
import { REDIS_CACHE_TTL } from '../config';
import { Worker } from '../types/entities';
import { logger } from './logger';

// This module handles worker management operations such as creating, updating, deleting, and fetching workers.
// It interacts with MongoDB for persistent storage and Redis for caching.

async function handleNewWorker(workerData: Worker): Promise<void> {
    const redisClient = await getRedisClient();
    try {
        const newWorker = await WorkerModel.create({ workerData });
        await redisClient.set(`worker:${newWorker._id}`, JSON.stringify({ ...workerData, id: newWorker._id.toString() }), { EX: REDIS_CACHE_TTL });
        logger.info('Worker saved to MongoDB and Redis:', newWorker._id);
    } catch (error) {
        logger.error('Error creating new worker:', error);
    }
};

async function getAllWorkers(): Promise<Worker[]> {
    try {
        const docs = await WorkerModel.find({}).lean();
        return docs.map((doc: any) => ({ ...doc, id: doc._id.toString() })) as Worker[];
    }
    catch (error) {
        logger.error('Error fetching workers:', error);
        return [];
    }
}

async function getWorkerById(id: string): Promise<Worker | null> {
    if (!id) {
        logger.error('Invalid worker ID:', id);
        return null;
    }
    try {
        const redisClient = await getRedisClient();
        const requiredWorker = await redisClient.get(`worker:${id}`);
        if (requiredWorker) {
            logger.info('Worker fetched from Redis:', id);
            return JSON.parse(requiredWorker) as Worker;
        }

        const worker = await WorkerModel.findById(id).lean();
        if (worker) {
            const formattedWorker: Worker = {
                ...worker,
                name: worker.name ?? "",
                id: worker._id.toString(),
                assignedTasks: worker.assignedTasks?.map((taskId: any) => taskId.toString()) ?? [],
                currentLoad: typeof worker.currentLoad === "number" ? worker.currentLoad : 0,
                maxLoad: typeof worker.maxLoad === "number" ? worker.maxLoad : 0,
                bio: worker.bio ?? ""
            };
            await redisClient.set(`worker:${id}`, JSON.stringify(formattedWorker), { EX: REDIS_CACHE_TTL });
            logger.info('Worker fetched from MongoDB and stored in Redis:', id);
            return formattedWorker;
        }

    } catch (error) {
        logger.error('Error fetching worker by ID:', error);
    }
    return null;
}

async function deleteWorker(workerId: string): Promise<void> {
    if (!workerId) {
        logger.error('Invalid worker ID for deletion:', workerId);
        return;
    }
    try {
        await WorkerModel.deleteOne({ _id: workerId });
        const redisClient = await getRedisClient();
        await redisClient.del(`worker:${workerId}`);
        logger.info('Worker deleted from MongoDB and Redis:', workerId);
    } catch (error) {
        logger.error('Error deleting worker:', error);
    }
}

async function updateWorker(workerId: string, updatedData: Partial<Worker>): Promise<Worker | null> {
    if (!workerId) {
        logger.error('Invalid worker ID for update:', workerId);
        return null;
    }
    try {
        const existingWorker = await getWorkerById(workerId);
        if (!existingWorker) {
            logger.warn('Worker not found for update:', workerId);
            return null;
        }
        const updatedWorker = { ...existingWorker, ...updatedData };
        await WorkerModel.updateOne({ _id: workerId }, { $set: updatedData });
        const redisClient = await getRedisClient();
        await redisClient.set(`worker:${workerId}`, JSON.stringify(updatedWorker), { EX: REDIS_CACHE_TTL });
        logger.info('Worker updated in MongoDB and Redis:', workerId);
        return updatedWorker as Worker;
    } catch (error) {
        logger.error('Error updating worker:', error);
        return null;
    }
}

export {
    handleNewWorker,
    getAllWorkers,
    getWorkerById,
    deleteWorker,
    updateWorker
};