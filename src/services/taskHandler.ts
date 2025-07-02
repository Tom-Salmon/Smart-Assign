import { REDIS_CACHE_TTL } from '../config';
import { TaskModel } from '../models/mongoClient';
import { Task, Worker } from '../types/entities';
import { getRedisClient } from './redisClient';
import { updateWorker, getWorkerById } from './workerHandler';
import { logger } from './logger';

//this module handles task management operations such as creating, updating, deleting, and fetching tasks.
// It interacts with MongoDB for persistent storage and Redis for caching.

async function handleNewTask(taskData: Task): Promise<void> {
    const redisClient = await getRedisClient();
    try {
        const newTask = await TaskModel.create({ taskData });
        await redisClient.set(`task:${newTask._id}`, JSON.stringify({ ...taskData, id: newTask._id.toString() }), { EX: REDIS_CACHE_TTL });
        logger.info('Task saved to MongoDB and Redis:', newTask._id);
    } catch (error) {
        logger.error('Error creating new task:', error);
    }
}

async function deleteTask(taskId: string) {
    try {
        const redisClient = await getRedisClient();
        await redisClient.del(`task:${taskId}`);
        await TaskModel.deleteOne({ _id: taskId });
        logger.info(`task ID: ${taskId} removed successfully from Redis and MongoDB.`);
    } catch (error) {
        logger.error(`Failed to remove ${taskId}:`, error);
    }
}

async function getAllTasks(): Promise<Task[]> {
    try {
        const docs = await TaskModel.find({}).lean();
        return docs.map((doc: any) => ({ ...doc, id: doc._id.toString() })) as Task[];
    } catch (error) {
        logger.error('Error fetching tasks:', error);
        return [];
    }
}

async function getTaskById(taskId: string): Promise<Task | null> {
    if (!taskId) {
        logger.error('Invalid task ID:', taskId);
        return null;
    }
    try {
        const redisClient = await getRedisClient();
        const requiredTask = await redisClient.get(`task:${taskId}`);
        if (requiredTask) {
            logger.info('Task fetched from Redis:', taskId);
            return JSON.parse(requiredTask) as Task;
        }
        else {
            const task = await TaskModel.findById(taskId).lean();
            if (task) {
                await redisClient.set(`task:${taskId}`, JSON.stringify({ ...task, id: task._id.toString() }), { EX: REDIS_CACHE_TTL });
                logger.info('Task fetched from MongoDB and stored in Redis:', taskId);
                return { ...task, id: task._id.toString() } as Task;
            }
        }
    } catch (error) {
        logger.error('Error fetching task by ID:', error);
    }
    return null;
}

async function updateTask(taskId: string, updatedData: Partial<Task>): Promise<Task | null> {
    if (!taskId) {
        logger.error('Invalid task ID for update:', taskId);
        return null;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            logger.warn('Task not found for update:', taskId);
            return null;
        }
        const updatedTask = { ...task, ...updatedData };
        await TaskModel.updateOne({ _id: taskId }, { $set: updatedData });
        const redisClient = await getRedisClient();
        if (updatedData.status === 'done') {
            await redisClient.del(`task:${taskId}`);
        }
        else {
            await redisClient.set(`task:${taskId}`, JSON.stringify({ ...updatedTask, id: taskId }), { EX: REDIS_CACHE_TTL });
        }
        logger.info('Task updated in MongoDB and Redis:', taskId);
        return updatedTask as Task;
    } catch (error) {
        logger.error('Error updating task:', error);
        return null;
    }
}

async function finishTask(taskId: string): Promise<void> {
    if (!taskId) {
        logger.error('Invalid task ID for finishing:', taskId);
        return;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            logger.warn('Task not found for finishing:', taskId);
            return;
        }
        await updateTask(taskId, { status: 'done', assignedTo: undefined, assignedDate: undefined });
        let worker: Worker | null = null;
        if (task.assignedTo) {
            worker = await getWorkerById(task.assignedTo);
        }
        if (worker) {
            await updateWorker(worker.id, {
                currentLoad: worker.currentLoad - task.load,
                assignedTasks: worker.assignedTasks.filter((id) => id !== taskId) ?? [],
            });
        }
        logger.info('Task finished:', taskId);
    } catch (error) {
        logger.error('Error finishing task:', error);
    }
}

async function assignTaskToWorker(taskId: string, workerId: string): Promise<void> {
    if (!taskId || !workerId) {
        logger.error('Invalid task ID or worker ID for assignment:', taskId, workerId);
        return;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            logger.warn('Task not found for assignment:', taskId);
            return;
        }
        if (task.status !== 'todo') {
            logger.warn('Task is not in todo status for assignment:', taskId);
            return;
        }
        const worker = await getWorkerById(workerId);
        if (!worker) {
            logger.warn('Worker not found for assignment:', workerId);
            return;
        }
        if (worker.currentLoad + task.load > worker.maxLoad) {
            logger.warn(`${worker.name} load exceeded for assignment "${task.title}"`);
            throw new Error(`${worker.name} load exceeded for assignment "${task.title}"`);
        }
        const hasRequiredSkills = task.requiredSkills.every(skill => worker.skills.includes(skill));
        if (!hasRequiredSkills) {
            logger.warn(`${worker.name} does not have required skills for task ${taskId}`);
            throw new Error(`${worker.name} does not have required skills for task ${taskId}`);
        }
        await updateTask(taskId, {
            assignedTo: worker.id,
            assignedDate: new Date(),
            status: 'in-progress'
        });
        await updateWorker(worker.id, {
            currentLoad: worker.currentLoad + task.load,
            assignedTasks: [...worker.assignedTasks, taskId],
        });
        logger.info('Task assigned to worker:', worker.name);
    } catch (error) {
        logger.error('Error assigning task to worker:', error);
    }
}

async function unassignTaskFromWorker(taskId: string): Promise<void> {
    if (!taskId) {
        logger.error('Invalid task ID for unassignment:', taskId);
        return;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            logger.warn('Task not found for unassignment:', taskId);
            throw new Error(`Task with ID ${taskId} not found`);
        }
        if (task.status !== 'in-progress') {
            logger.warn('Task is not in-progress for unassignment:', taskId);
            return;
        }
        if (!task.assignedTo) {
            logger.warn('Task is not assigned to any worker:', taskId);
            return;
        }
        const worker = await getWorkerById(task.assignedTo);
        if (!worker) {
            logger.warn('Worker not found for unassignment:', task.assignedTo);
            throw new Error(`Worker with ID ${task.assignedTo} not found`);
        }
        const assignedTime = new Date(task.assignedDate ?? 0).getTime();
        const elapsedSeconds = (Date.now() - assignedTime) / 1000;
        const updatedTimeToComplete = Math.max(task.timeToComplete - elapsedSeconds, 0);
        await updateTask(taskId, {
            assignedTo: undefined,
            assignedDate: undefined,
            status: 'todo',
            timeToComplete: updatedTimeToComplete,
        });
        await updateWorker(worker.id, {
            currentLoad: worker.currentLoad - task.load,
            assignedTasks: worker.assignedTasks.filter((id) => id !== taskId),
        });
        logger.info('Task unassigned from worker:', worker.name);
    } catch (error) {
        logger.error('Error unassigning task from worker:', error);
    }
}

export {
    handleNewTask,
    deleteTask,
    getAllTasks,
    getTaskById,
    updateTask,
    finishTask,
    assignTaskToWorker,
    unassignTaskFromWorker,
};