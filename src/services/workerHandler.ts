import { WorkerModel } from './mongoClient';
import { getRedisClient } from './redisClient';
import { REDIS_CACHE_TTL } from '../config';
import { Worker } from '../types/entities';

export async function handleNewWorker(workerData: Worker): Promise<void> {
    const redisClient = await getRedisClient();
    try {
        const newWorker = await WorkerModel.create({ workerData });
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

export async function getWorkerById(id: string): Promise<Worker | null> {
    if (!id) {
        console.error('Invalid worker ID:', id);
        return null;
    }
    try {
        const redisClient = await getRedisClient();
        const requiredWorker = await redisClient.get(`worker:${id}`);
        if (requiredWorker) {
            console.log('Worker fetched from Redis:', id);
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
            console.log('Worker fetched from MongoDB and stored in Redis:', id);
            return formattedWorker;
        }

    } catch (error) {
        console.error('Error fetching worker by ID:', error);
    }
    return null;
}

export async function updateWorker(workerId: string, updatedData: Partial<Worker>): Promise<Worker | null> {
    if (!workerId) {
        console.error('Invalid worker ID for update:', workerId);
        return null;
    }
    try {
        const existingWorker = await getWorkerById(workerId);
        if (!existingWorker) {
            console.log('Worker not found for update:', workerId);
            return null;
        }
        const updatedWorker = { ...existingWorker, ...updatedData };
        await WorkerModel.updateOne({ _id: workerId }, { $set: updatedData });
        const redisClient = await getRedisClient();
        await redisClient.set(`worker:${workerId}`, JSON.stringify(updatedWorker), { EX: REDIS_CACHE_TTL });
        console.log('Worker updated in MongoDB and Redis:', workerId);
        return updatedWorker as Worker;
    } catch (error) {
        console.error('Error updating worker:', error);
        return null;
    }
}