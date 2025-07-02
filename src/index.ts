import { initKafkaConsumer, initKafkaProducer, disconnectKafka } from "./services/kafkaClient";
import { createNewWorker, sendNewTask } from "./kafka/kafkaProducer";
import { initTopicRouter } from "./kafka/topicRouter";
import { connectToMongoDB, disconnectMongo } from "./models/mongoClient";
import { getRedisClient, disconnectRedisClient } from "./services/redisClient";
import { handleNewTask, deleteTask, getAllTasks, getTaskById, updateTask, finishTask, assignTaskToWorker, unassignTaskFromWorker } from "./services/taskHandler";
import { handleNewWorker, deleteWorker, getAllWorkers, getWorkerById, updateWorker } from "./services/workerHandler";
import { Worker } from "./types/entities";
import { Task } from "./types/entities";
import { TaskModel, WorkerModel } from "./models/mongoClient";
import { logger } from "./services/logger";

// this is the main entry point for the application
// it initializes the MongoDB connection, Redis client, Kafka producer and consumer, and topic router
// it also clears existing data in MongoDB and Redis

async function main() {
    try {
        // Initialize MongoDB connection
        await connectToMongoDB();
        logger.info("Connected to MongoDB");
        // Initialize Redis client
        await getRedisClient();
        logger.info("Connected to Redis");
        // Initialize Kafka producer
        await initKafkaProducer();
        logger.info("Kafka producer initialized");
        // Initialize Kafka consumer
        await initKafkaConsumer();
        logger.info("Kafka consumer initialized");
        // Initialize topic router
        await initTopicRouter();
        logger.info("Topic router initialized");
        await sleep(1000);
        // Clear existing data in MongoDB and Redis
        const redisClient = await getRedisClient();
        logger.info("Clearing existing data in MongoDB and Redis...");
        await TaskModel.deleteMany({});
        await WorkerModel.deleteMany({});
        await redisClient.flushDb();

    } catch (error) {
        logger.error("Error in main function:", error);
    }
}
main().catch(logger.error);
process.on('SIGINT', shutdown);      // Ctrl+C
process.on('SIGTERM', shutdown);     // docker stop / system kill
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    shutdown();
});
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
    shutdown();
});

async function shutdown() {
    logger.info('Shutting down gracefully...');
    // Disconnect Kafka, Redis, MongoDB
    await disconnectKafka();
    logger.info('Kafka disconnected');
    await disconnectRedisClient();
    logger.info('Redis disconnected');
    await disconnectMongo();
    logger.info('MongoDB disconnected');
    process.exit(0);
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}