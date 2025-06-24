import { REDIS_CACHE_TTL } from '../config';
import { TaskModel, WorkerModel } from '../services/mongoClient';
import { Task, Worker } from '../types/entities';
import { getRedisClient } from './redisClient';
import { v4 as uuidv4 } from 'uuid';

export async function handleNewTask(taskData: Task): Promise<void> {
    const redisClient = await getRedisClient();
    try {
        const newTask = await TaskModel.create({ _id: uuidv4(), ...taskData });
        await redisClient.set(`task:${newTask._id}`, JSON.stringify({ ...taskData, id: newTask._id.toString() }), { EX: REDIS_CACHE_TTL });
        console.log('Task saved to MongoDB and Redis:', newTask._id);
    } catch (error) {
        console.error('Error creating new task:', error);
    }
}

export async function deleteTask(taskId: string) {
    try {
        const redisClient = await getRedisClient();
        await redisClient.del(`task:${taskId}`);
        await TaskModel.deleteOne({ _id: taskId });
        console.log(`task ID: ${taskId} removed succesfully from Redis and MongoDB.`);
    } catch (error) {
        console.error(`Failed to remove ${taskId}:`, error);
    }
}

export async function getAllTasks(): Promise<Task[]> {
    try {
        const docs = await TaskModel.find({}).lean();
        return docs.map((doc: any) => ({ ...doc, id: doc._id.toString() })) as Task[];
    } catch (error) {
        console.error('Error fetching tasks:', error);
        return [];
    }
}

export async function getTaskById(taskId: string): Promise<Task | null> {
    if (!taskId) {
        console.error('Invalid task ID:', taskId);
        return null;
    }
    try {
        const redisClient = await getRedisClient();
        const requiredTask = await redisClient.get(`task:${taskId}`);
        if (requiredTask) {
            console.log('Task fetched from Redis:', taskId);
            return JSON.parse(requiredTask) as Task;
        }
        else {
            const task = await TaskModel.findById(taskId).lean();
            if (task) {
                await redisClient.set(`task:${taskId}`, JSON.stringify({ ...task, id: task._id.toString() }), { EX: REDIS_CACHE_TTL });
                console.log('Task fetched from MongoDB and stored in Redis:', taskId);
                return { ...task, id: task._id.toString() } as Task;
            }
        }
    } catch (error) {
        console.error('Error fetching task by ID:', error);
    }
    return null;
}

export async function updateTask(taskId: string, updatedData: Partial<Task>): Promise<Task | null> {
    if (!taskId) {
        console.error('Invalid task ID for update:', taskId);
        return null;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            console.log('Task not found for update:', taskId);
            return null;
        }
        const updatedTask = { ...task, ...updatedData };
        await TaskModel.updateOne({ _id: taskId }, { $set: updatedData });
        const redisClient = await getRedisClient();
        await redisClient.set(`task:${taskId}`, JSON.stringify({ ...updatedTask, id: taskId }), { EX: REDIS_CACHE_TTL });
        console.log('Task updated in MongoDB and Redis:', taskId);
        return updatedTask as Task;
    } catch (error) {
        console.error('Error updating task:', error);
        return null;
    }
}
