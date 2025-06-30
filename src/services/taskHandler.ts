import { REDIS_CACHE_TTL } from '../config';
import { TaskModel, WorkerModel } from '../services/mongoClient';
import { Task, Worker } from '../types/entities';
import { getRedisClient } from './redisClient';
import { updateWorker, getWorkerById } from './workerHandler';

export async function handleNewTask(taskData: Task): Promise<void> {
    const redisClient = await getRedisClient();
    try {
        const newTask = await TaskModel.create({ taskData });
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

//change updateTask to recieve a task instead of taskId.
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

export async function finishTask(taskId: string): Promise<void> {
    if (!taskId) {
        console.error('Invalid task ID for finishing:', taskId);
        return;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            console.log('Task not found for finishing:', taskId);
            return;
        }
        await updateTask(taskId, { status: 'done', assignedTo: undefined, assignedDate: undefined });//change updateTask to recieve a task instead of taskId.
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
        console.log('Task finished:', taskId);
    } catch (error) {
        console.error('Error finishing task:', error);
    }
}

export async function assignTaskToWorker(taskId: string, workerId: string): Promise<void> {
    if (!taskId || !workerId) {
        console.error('Invalid task ID or worker ID for assignment:', taskId, workerId);
        return;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            console.log('Task not found for assignment:', taskId);
            return;
        }
        if (task.status !== 'todo') {
            console.log('Task is not in todo status for assignment:', taskId);
            return;
        }
        const worker = await getWorkerById(workerId);
        if (!worker) {
            console.log('Worker not found for assignment:', workerId);
            return;
        }
        if (worker.currentLoad + task.load > worker.maxLoad) {
            console.log(`${worker.name} load exceeded for assignment "${task.title}"`);
            throw new Error(`${worker.name} load exceeded for assignment "${task.title}"`);
        }
        const hasRequiredSkills = task.requiredSkills.every(skill => worker.skills.includes(skill));
        if (!hasRequiredSkills) {
            console.log(`${worker.name} does not have required skills for task ${taskId}`);
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
        console.log('Task assigned to worker:', worker.name);
    } catch (error) {
        console.error('Error assigning task to worker:', error);
    }
}

export async function unassignTaskFromWorker(taskId: string): Promise<void> {
    if (!taskId) {
        console.error('Invalid task ID for unassignment:', taskId);
        return;
    }
    try {
        const task = await getTaskById(taskId);
        if (!task) {
            console.log('Task not found for unassignment:', taskId);
            throw new Error(`Task with ID ${taskId} not found`);
        }
        if (task.status !== 'in-progress') {
            console.log('Task is not in-progress for unassignment:', taskId);
            return;
        }
        if (!task.assignedTo) {
            console.log('Task is not assigned to any worker:', taskId);
            return;
        }
        const worker = await getWorkerById(task.assignedTo);
        if (!worker) {
            console.log('Worker not found for unassignment:', task.assignedTo);
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
        console.log('Task unassigned from worker:', worker.name);
    } catch (error) {
        console.error('Error unassigning task from worker:', error);
    }
}