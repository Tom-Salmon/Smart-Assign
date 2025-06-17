export interface Task {
    id: string;
    title: string;
    priority: number;
    createdDate: Date;
    dueDate: Date;
    requiredSkills: string[];
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    load: number; // Estimated load in hours
}
export interface Assignment {
    taskId: string; // Task ID
    workerId: string; // User ID
    assignedDate: Date;
}

export interface Worker {
    id: string;
    name: string;
    skills: string[];
    currentLoad: number;
    maxLoad: number;
    assignedTasks: string[]; // Array of Task IDs
    bio: string;
}