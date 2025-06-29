import { initKafkaConsumer, initKafkaProducer, disconnectKafka } from "./services/kafkaClient";
import { createNewWorker, sendNewTask } from "./kafka/kafkaProducer";
import { initTopicRouter } from "./kafka/topicRouter";
import { connectToMongoDB, disconnectMongo } from "./services/mongoClient";
import { getRedisClient, disconnectRedisClient } from "./services/redisClient";


async function main() {
    try {
        // Initialize MongoDB connection
        await connectToMongoDB();
        console.log("Connected to MongoDB");
        // Initialize Redis client
        await getRedisClient();
        console.log("Connected to Redis");
        // Initialize Kafka producer
        await initKafkaProducer();
        console.log("Kafka producer initialized");
        // Initialize Kafka consumer
        await initKafkaConsumer();
        console.log("Kafka consumer initialized");
        // Initialize topic router
        await initTopicRouter();
        console.log("Topic router initialized");
        await sleep(1000);
        // Create a new worker
        await createNewWorker();
        console.log("New worker request sent by the producer");
        // Send a new task to Kafka
        await sendNewTask();
        console.log("New task request sent by the producer");
    } catch (error) {
        console.error("Error in main function:", error);
    }
}
main().catch(console.error);
process.on('SIGINT', shutdown);      // Ctrl+C
process.on('SIGTERM', shutdown);     // docker stop / system kill
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    shutdown();
});
process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Promise Rejection:', reason);
    shutdown();
});

async function shutdown() {
    console.log('Shutting down gracefully...');
    // Disconnect Kafka, Redis, MongoDB
    await disconnectKafka();
    console.log('Kafka disconnected');
    await disconnectRedisClient();
    console.log('Redis disconnected');
    await disconnectMongo();
    console.log('MongoDB disconnected');
    process.exit(0);
}


// Exporting functions for testing purposes
export { main, sendNewTask, createNewWorker, initKafkaProducer, initKafkaConsumer, disconnectKafka };
export { connectToMongoDB, disconnectMongo } from "./services/mongoClient";
export { getRedisClient, disconnectRedisClient } from "./services/redisClient";
export { initTopicRouter } from "./kafka/topicRouter";

async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}