import mongoose from 'mongoose';
import { MONGO_URI } from '../config';
import { logger } from '../services/logger';

// This module provides a MongoDB client for connecting to a MongoDB server.
// It exports functions to connect to MongoDB, disconnect it, and models for tasks and workers.
// It uses Mongoose for schema definition and interaction with MongoDB.

async function connectToMongoDB() {
    if (mongoose.connection.readyState) {
        logger.info('Already connected to MongoDB');
        return;
    }
    try {
        await mongoose.connect(MONGO_URI);
        logger.info('Connected to MongoDB');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
    }
}

async function disconnectMongo() {
    try {
        await mongoose.disconnect();
        logger.info('MongoDB disconnected');
    } catch (error) {
        logger.error('Error disconnecting MongoDB:', error);
    }
}

const taskSchema = new mongoose.Schema(
    {
        id: String,
        title: String,
        priority: Number,
        createdDate: Date,
        timeToComplete: Number,
        requiredSkills: [String],
        description: String,
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'done'],
            default: 'todo',
        },
        load: Number,
        assignedTo: String,
        assignedDate: Date,
    },
    { timestamps: true }
);

const workerSchema = new mongoose.Schema(
    {
        id: String,
        name: String,
        skills: [String],
        currentLoad: Number,
        maxLoad: Number,
        assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
        bio: String,
    },
    { timestamps: true }
);

const TaskModel = mongoose.model('Task', taskSchema);
const WorkerModel = mongoose.model('Worker', workerSchema);

// Exporting the models and connection functions
export {
    TaskModel,
    WorkerModel,
    connectToMongoDB,
    disconnectMongo
};