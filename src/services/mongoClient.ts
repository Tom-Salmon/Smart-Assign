import mongoose from 'mongoose';
import { MONGO_URI } from '../config';

export async function connectToMongoDB() {
    if (mongoose.connection.readyState) {
        console.log('Already connected to MongoDB');
        return;
    }
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
    } catch (error) {
        console.error('MongoDB connection error:', error);
    }
}

export async function disconnectMongo() {
    try {
        await mongoose.disconnect();
        console.log('MongoDB disconnected');
    } catch (error) {
        console.error('Error disconnecting MongoDB:', error);
    }
}

const taskSchema = new mongoose.Schema(
    {
        title: String,
        priority: Number,
        createdDate: Date,
        timeToComplete: Date,
        requiredSkills: [String],
        description: String,
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'done'],
            default: 'todo',
        },
        load: Number,
    },
    { timestamps: true }
);

const workerSchema = new mongoose.Schema(
    {
        name: String,
        skills: [String],
        currentLoad: Number,
        maxLoad: Number,
        assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
        bio: String,
    },
    { timestamps: true }
);

const assignmentSchema = new mongoose.Schema(
    {
        taskId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task',
            required: true,
        },
        workerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Worker',
            required: true,
        },
        assignedDate: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const TaskModel = mongoose.model('Task', taskSchema);
const WorkerModel = mongoose.model('Worker', workerSchema);
const AssignmentModel = mongoose.model('Assignment', assignmentSchema);

export { TaskModel, WorkerModel, AssignmentModel };
