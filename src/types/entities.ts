export interface Task {
    title: string;
    priority: number;
    createdDate: Date;
    timeToComplete: number;
    requiredSkills: string[];
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    load: number;
    assignedTo?: string;
    assignedDate?: Date;
}

export interface Worker {
    id: string;
    name: string;
    skills: string[];
    currentLoad: number;
    maxLoad: number;
    assignedTasks: string[];
    bio: string;
}