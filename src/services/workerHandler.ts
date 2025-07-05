import { WorkerModel } from '../models/mongoClient';
import { getRedisClient } from './redisClient';
import { REDIS_CACHE_TTL } from '../config';
import { Worker } from '../types/entities';
import { ValidationError, NotFoundError, DatabaseError } from '../types/errors';
import { logger } from './logger';

// This module handles worker management operations such as creating, updating, deleting, and fetching workers.
// It interacts with MongoDB for persistent storage and Redis for caching.

async function handleNewWorker(workerData: Omit<Worker, 'id'>): Promise<void> {
    if (!workerData.name?.trim()) {
        throw new ValidationError('Name is required', 'name');
    }
    if (!Array.isArray(workerData.skills) || workerData.skills.length === 0) {
        throw new ValidationError('Worker must have at least one skill', 'skills');
    }
    if (workerData.maxLoad < 1) {
        throw new ValidationError('Max load must be at least 1', 'maxLoad');
    }

    try {
        const redisClient = await getRedisClient();
        const newWorker = await WorkerModel.create(workerData);
        const workerWithId = {
            ...workerData,
            id: newWorker._id.toString()
        } as Worker;
        await redisClient.set(`worker:${workerWithId.id}`, JSON.stringify(workerWithId), { EX: REDIS_CACHE_TTL });
        logger.info('Worker saved to MongoDB and Redis:', workerWithId.id);
    } catch (error) {
        logger.error('Error creating new worker:', error);
        throw new DatabaseError('Failed to create worker', error as Error);
    }
};

async function getAllWorkers(): Promise<Worker[]> {
    try {
        const workers = await WorkerModel.find({}).lean();
        return workers.map((worker: any) => ({
            id: worker._id.toString(),
            name: worker.name as string,
            skills: worker.skills as string[],
            currentLoad: worker.currentLoad as number,
            maxLoad: worker.maxLoad as number,
            assignedTasks: (worker.assignedTasks || []).map((taskId: any) => taskId.toString()),
            bio: worker.bio as string,
        }));
    }
    catch (error) {
        logger.error('Error fetching workers:', error);
        return [];
    }
}

async function getWorkerById(id: string): Promise<Worker | null> {
    if (!id?.trim()) {
        throw new ValidationError('Worker ID is required');
    }

    try {
        const redisClient = await getRedisClient();
        const cachedWorker = await redisClient.get(`worker:${id}`);
        if (cachedWorker) {
            logger.info('Worker fetched from Redis:', id);
            return JSON.parse(cachedWorker) as Worker;
        }

        const worker = await WorkerModel.findById(id).lean();
        if (worker) {
            const formattedWorker: Worker = {
                id: worker._id.toString(),
                name: (worker.name as string) || "",
                skills: (worker.skills as string[]) || [],
                assignedTasks: (worker.assignedTasks || []).map((taskId: any) => taskId.toString()),
                currentLoad: (worker.currentLoad as number) || 0,
                maxLoad: (worker.maxLoad as number) || 0,
                bio: (worker.bio as string) || ""
            };
            await redisClient.set(`worker:${id}`, JSON.stringify(formattedWorker), { EX: REDIS_CACHE_TTL });
            logger.info('Worker fetched from MongoDB and stored in Redis:', id);
            return formattedWorker;
        }
        return null;
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        logger.error('Error fetching worker by ID:', error);
        throw new DatabaseError(`Failed to fetch worker ${id}`, error as Error);
    }
}

async function deleteWorker(workerId: string): Promise<void> {
    if (!workerId?.trim()) {
        throw new ValidationError('Worker ID is required');
    }

    try {
        const result = await WorkerModel.findByIdAndDelete(workerId);
        if (!result) {
            throw new NotFoundError('Worker', workerId);
        }
        const redisClient = await getRedisClient();
        await redisClient.del(`worker:${workerId}`);
        logger.info('Worker deleted from MongoDB and Redis:', workerId);
    } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError) {
            throw error;
        }
        logger.error('Error deleting worker:', error);
        throw new DatabaseError(`Failed to delete worker ${workerId}`, error as Error);
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