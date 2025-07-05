import { initKafkaConsumer, initKafkaProducer, disconnectKafka } from "./services/kafkaClient";
import { createNewWorker, sendNewTask } from "./kafka/kafkaProducer";
import { initTopicRouter } from "./kafka/topicRouter";
import { connectToMongoDB, disconnectMongo } from "./models/mongoClient";
import { getRedisClient, disconnectRedisClient } from "./services/redisClient";
import { TaskModel, WorkerModel } from "./models/mongoClient";
import { logger } from "./services/logger";
import app from "./api/app";

// this is the main entry point for the application
// it initializes the MongoDB connection, Redis client, Kafka producer and consumer, and topic router
// it also starts the Express HTTP server

const PORT = process.env.PORT || 3000;

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

        // Clear existing data in MongoDB and Redis (only in development)
        if (process.env.NODE_ENV !== 'production') {
            const redisClient = await getRedisClient();
            logger.info("Clearing existing data in MongoDB and Redis...");
            await TaskModel.deleteMany({});
            await WorkerModel.deleteMany({});
            await redisClient.flushDb();
            logger.info("Data cleared successfully");
        }

        // Start HTTP server
        const server = app.listen(PORT, () => {
            logger.info(`🚀 HTTP Server running on port ${PORT}`);
            logger.info(`📊 Health check: http://localhost:${PORT}/health`);
            logger.info(`📋 API Endpoints:`);
            logger.info(`   Tasks: http://localhost:${PORT}/api/tasks`);
            logger.info(`   Workers: http://localhost:${PORT}/api/workers`);
        });

        logger.info("✅ Application startup completed successfully");

        // Graceful shutdown handlers
        process.on('SIGTERM', async () => {
            logger.info('🔄 Received SIGTERM signal');
            server.close(async () => {
                await shutdown();
            });
        });

        process.on('SIGINT', async () => {
            logger.info('🔄 Received SIGINT signal (Ctrl+C)');
            server.close(async () => {
                await shutdown();
            });
        });

        // Keep process alive
        process.on('uncaughtException', (err) => {
            logger.error('❌ Uncaught Exception:', err);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

    } catch (error) {
        logger.error("❌ Error in main function:", error);
        process.exit(1);
    }
}
// Start the application
main().catch((error) => {
    logger.error("Fatal error starting application:", error);
    process.exit(1);
});

async function shutdown() {
    logger.info('🔄 Shutting down gracefully...');
    try {
        // Disconnect Kafka, Redis, MongoDB
        await disconnectKafka();
        logger.info('✅ Kafka disconnected');
        await disconnectRedisClient();
        logger.info('✅ Redis disconnected');
        await disconnectMongo();
        logger.info('✅ MongoDB disconnected');
        logger.info('👋 Application shut down successfully');
        process.exit(0);
    } catch (error) {
        logger.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
}

export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}