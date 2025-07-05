import { Task, Worker } from './entities';
import { ValidationError } from './errors';

export function validateTask(task: Partial<Task>): void {
    if (!task.title || task.title.trim().length === 0) {
        throw new ValidationError('Title is required', 'title');
    }
    if (task.title.length > 200) {
        throw new ValidationError('Title must be 200 characters or less', 'title');
    }
    if (!task.description || task.description.trim().length === 0) {
        throw new ValidationError('Description is required', 'description');
    }
    if (task.description.length > 1000) {
        throw new ValidationError('Description must be 1000 characters or less', 'description');
    }
    if (task.priority === undefined || task.priority < 1 || task.priority > 10) {
        throw new ValidationError('Priority must be between 1 and 10', 'priority');
    }
    if (task.load === undefined || task.load < 1) {
        throw new ValidationError('Load must be at least 1', 'load');
    }
    if (task.timeToComplete === undefined || task.timeToComplete < 0) {
        throw new ValidationError('Time to complete must be non-negative', 'timeToComplete');
    }
    if (!Array.isArray(task.requiredSkills)) {
        throw new ValidationError('Required skills must be an array', 'requiredSkills');
    }
    if (task.status && !['todo', 'in-progress', 'done'].includes(task.status)) {
        throw new ValidationError('Status must be todo, in-progress, or done', 'status');
    }
}

export function validateWorker(worker: Partial<Worker>): void {
    if (!worker.name || worker.name.trim().length === 0) {
        throw new ValidationError('Name is required', 'name');
    }
    if (worker.name.length > 100) {
        throw new ValidationError('Name must be 100 characters or less', 'name');
    }
    if (!Array.isArray(worker.skills)) {
        throw new ValidationError('Skills must be an array', 'skills');
    }
    if (worker.skills.length === 0) {
        throw new ValidationError('Worker must have at least one skill', 'skills');
    }
    if (worker.maxLoad === undefined || worker.maxLoad < 1) {
        throw new ValidationError('Max load must be at least 1', 'maxLoad');
    }
    if (worker.currentLoad !== undefined && worker.currentLoad < 0) {
        throw new ValidationError('Current load cannot be negative', 'currentLoad');
    }
    if (worker.currentLoad !== undefined && worker.maxLoad !== undefined && worker.currentLoad > worker.maxLoad) {
        throw new ValidationError('Current load cannot exceed max load', 'currentLoad');
    }
    if (worker.bio && worker.bio.length > 500) {
        throw new ValidationError('Bio must be 500 characters or less', 'bio');
    }
}

export function validateObjectId(id: string, fieldName: string = 'id'): void {
    if (!id || typeof id !== 'string') {
        throw new ValidationError(`${fieldName} is required and must be a string`, fieldName);
    }
    // MongoDB ObjectId validation (24 hex characters)
    if (!/^[0-9a-fA-F]{24}$/.test(id)) {
        throw new ValidationError(`${fieldName} must be a valid ObjectId`, fieldName);
    }
}
