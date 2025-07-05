import mongoose, { Types } from 'mongoose';
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
        title: { type: String, required: true, trim: true, maxlength: 200 },
        priority: { type: Number, required: true, min: 1, max: 10 },
        createdDate: { type: Date, default: Date.now },
        timeToComplete: { type: Number, required: true, min: 0 },
        requiredSkills: [{ type: String, trim: true }],
        description: { type: String, required: true, trim: true, maxlength: 1000 },
        status: {
            type: String,
            enum: ['todo', 'in-progress', 'done'],
            default: 'todo',
        },
        load: { type: Number, required: true, min: 1 },
        assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
        assignedDate: Date,
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

taskSchema.index({ status: 1 });
taskSchema.index({ assignedTo: 1 });
taskSchema.index({ priority: -1, createdDate: -1 });
taskSchema.index({ requiredSkills: 1 });

const workerSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, maxlength: 100 },
        skills: [{ type: String, required: true, trim: true }],
        currentLoad: { type: Number, default: 0, min: 0 },
        maxLoad: { type: Number, required: true, min: 1 },
        assignedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
        bio: { type: String, trim: true, maxlength: 500 },
    },
    {
        timestamps: true,
        toJSON: {
            transform: function (doc, ret) {
                ret.id = ret._id.toString();
                delete ret._id;
                delete ret.__v;
                return ret;
            }
        }
    }
);

workerSchema.index({ skills: 1 });
workerSchema.index({ currentLoad: 1, maxLoad: 1 });

const TaskModel = mongoose.model('Task', taskSchema);
const WorkerModel = mongoose.model('Worker', workerSchema);

// Exporting the models and connection functions
export {
    TaskModel,
    WorkerModel,
    connectToMongoDB,
    disconnectMongo
};