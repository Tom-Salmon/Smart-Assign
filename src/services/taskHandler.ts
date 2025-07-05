import { REDIS_CACHE_TTL } from '../config';
import { TaskModel } from '../models/mongoClient';
import { Task, Worker } from '../types/entities';
import { ValidationError, NotFoundError, BusinessLogicError, DatabaseError } from '../types/errors';
import { getRedisClient } from './redisClient';
import { updateWorker, getWorkerById } from './workerHandler';
import { logger } from './logger';

//this module handles task management operations such as creating, updating, deleting, and fetching tasks.
// It interacts with MongoDB for persistent storage and Redis for caching.

async function handleNewTask(taskData: Omit<Task, 'id'>): Promise<void> {
    if (!taskData.title?.trim()) {
        throw new ValidationError('Title is required', 'title');
    }
    if (!taskData.description?.trim()) {
        throw new ValidationError('Description is required', 'description');
    }
    if (taskData.priority < 1 || taskData.priority > 10) {
        throw new ValidationError('Priority must be between 1 and 10', 'priority');
    }
    if (taskData.load < 1) {
        throw new ValidationError('Load must be at least 1', 'load');
    }

    try {
        const redisClient = await getRedisClient();
        const newTask = await TaskModel.create(taskData);
        const taskWithId = {
            ...taskData,
            id: newTask._id.toString()
        } as Task;
        await redisClient.set(`task:${taskWithId.id}`, JSON.stringify(taskWithId), { EX: REDIS_CACHE_TTL });
        logger.info('Task saved to MongoDB and Redis:', taskWithId.id);
    } catch (error) {
        logger.error('Error creating new task:', error);
        throw new DatabaseError('Failed to create task', error as Error);
    }
}

async function deleteTask(taskId: string): Promise<void> {
    if (!taskId?.trim()) {
        throw new ValidationError('Task ID is required');
    }

    try {
        const redisClient = await getRedisClient();
        await redisClient.del(`task:${taskId}`);
        const result = await TaskModel.findByIdAndDelete(taskId);
        if (!result) {
            throw new NotFoundError('Task', taskId);
        }
        logger.info(`Task ID: ${taskId} removed successfully from Redis and MongoDB.`);
    } catch (error) {
        if (error instanceof NotFoundError) {
            throw error;
        }
        logger.error(`Failed to remove task ${taskId}:`, error);
        throw new DatabaseError(`Failed to delete task ${taskId}`, error as Error);
    }
}

async function getAllTasks(): Promise<Task[]> {
    try {
        const tasks = await TaskModel.find({}).lean();
        return tasks.map((task: any) => ({
            id: task._id.toString(),
            title: task.title as string,
            priority: task.priority as number,
            createdDate: task.createdDate as Date,
            timeToComplete: task.timeToComplete as number,
            requiredSkills: task.requiredSkills as string[],
            description: task.description as string,
            status: task.status as 'todo' | 'in-progress' | 'done',
            load: task.load as number,
            assignedTo: task.assignedTo?.toString(),
            assignedDate: task.assignedDate as Date | undefined,
        }));
    } catch (error) {
        logger.error('Error fetching tasks:', error);
        return [];
    }
}

async function getTaskById(taskId: string): Promise<Task | null> {
    if (!taskId?.trim()) {
        throw new ValidationError('Task ID is required');
    }

    try {
        const redisClient = await getRedisClient();
        const cachedTask = await redisClient.get(`task:${taskId}`);
        if (cachedTask) {
            logger.info('Task fetched from Redis:', taskId);
            return JSON.parse(cachedTask) as Task;
        }

        const task = await TaskModel.findById(taskId).lean();
        if (task) {
            const formattedTask = {
                id: task._id.toString(),
                title: task.title as string,
                priority: task.priority as number,
                createdDate: task.createdDate as Date,
                timeToComplete: task.timeToComplete as number,
                requiredSkills: task.requiredSkills as string[],
                description: task.description as string,
                status: task.status as 'todo' | 'in-progress' | 'done',
                load: task.load as number,
                assignedTo: task.assignedTo?.toString(),
                assignedDate: task.assignedDate as Date | undefined,
            };
            await redisClient.set(`task:${taskId}`, JSON.stringify(formattedTask), { EX: REDIS_CACHE_TTL });
            logger.info('Task fetched from MongoDB and stored in Redis:', taskId);
            return formattedTask;
        }
        return null;
    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        logger.error('Error fetching task by ID:', error);
        throw new DatabaseError(`Failed to fetch task ${taskId}`, error as Error);
    }
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
    if (!taskId?.trim()) {
        throw new ValidationError('Task ID is required');
    }
    if (!workerId?.trim()) {
        throw new ValidationError('Worker ID is required');
    }

    try {
        const task = await getTaskById(taskId);
        if (!task) {
            throw new NotFoundError('Task', taskId);
        }
        if (task.status !== 'todo') {
            throw new BusinessLogicError(`Task ${taskId} is not available for assignment (status: ${task.status})`);
        }

        const worker = await getWorkerById(workerId);
        if (!worker) {
            throw new NotFoundError('Worker', workerId);
        }

        if (worker.currentLoad + task.load > worker.maxLoad) {
            throw new BusinessLogicError(`Worker ${worker.name} load would exceed maximum capacity (${worker.currentLoad + task.load}/${worker.maxLoad})`);
        }

        const hasRequiredSkills = task.requiredSkills.every(skill => worker.skills.includes(skill));
        if (!hasRequiredSkills) {
            const missingSkills = task.requiredSkills.filter(skill => !worker.skills.includes(skill));
            throw new BusinessLogicError(`Worker ${worker.name} lacks required skills: ${missingSkills.join(', ')}`);
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

        logger.info(`Task ${taskId} assigned to worker ${worker.name}`);
    } catch (error) {
        if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof BusinessLogicError) {
            throw error;
        }
        logger.error('Error assigning task to worker:', error);
        throw new DatabaseError('Failed to assign task to worker', error as Error);
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