export interface Task {
    title: string;
    priority: number;
    createdDate: Date;
    timeToComplete: Date;
    requiredSkills: string[];
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    load: number;
}
export interface Assignment {
    taskId: string;
    workerId: string;
    assignedDate: Date;
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