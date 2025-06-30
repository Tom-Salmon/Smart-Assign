import { initKafkaConsumer, initKafkaProducer, disconnectKafka } from "./services/kafkaClient";
import { createNewWorker, sendNewTask } from "./kafka/kafkaProducer";
import { initTopicRouter } from "./kafka/topicRouter";
import { connectToMongoDB, disconnectMongo } from "./services/mongoClient";
import { getRedisClient, disconnectRedisClient } from "./services/redisClient";
import { handleNewTask, deleteTask, getAllTasks, getTaskById, updateTask, finishTask, assignTaskToWorker, unassignTaskFromWorker } from "./services/taskHandler";
import { handleNewWorker, deleteWorker, getAllWorkers, getWorkerById, updateWorker } from "./services/workerHandler";
import { Worker } from "./types/entities";
import { Task } from "./types/entities";
import { TaskModel, WorkerModel } from "./services/mongoClient";


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
        // Clear existing data in MongoDB and Redis
        const redisClient = await getRedisClient();
        console.log("Clearing existing data in MongoDB and Redis...");
        await TaskModel.deleteMany({});
        await WorkerModel.deleteMany({});
        await redisClient.flushDb();
        // Create a new worker
        await createNewWorker();
        console.log("New worker request sent by the producer");
        // Send a new task to Kafka
        await sendNewTask();
        console.log("New task request sent by the producer");
        await sleep(1000);
        // Uncomment the following code to test the worker and task operations//
        /* 
        // Fetch all workers
        const workers = await getAllWorkers();
        console.log("Fetched all workers:", workers);
        // Fetch all tasks
        const tasks = await getAllTasks();
        console.log("Fetched all tasks:", tasks);

        // Fetch a worker by ID
        const workerId = workers.length > 0 ? workers[0].id : "";
        const worker = await getWorkerById(workerId);
        console.log("Fetched worker by ID:", worker);

        // Fetch a task by ID
        const taskId = tasks.length > 0 ? tasks[0].id : "";
        const task = await getTaskById(taskId);
        console.log("Fetched task by ID:", task);

        // Update a worker
        if (worker) {
            const updatedWorker: Worker = {
                ...worker,
                currentLoad: worker.currentLoad + 5,
            };
            await updateWorker(worker.id, updatedWorker);
            console.log("Updated worker:", updatedWorker);
        }

        // Update a task
        if (task) {
            const updatedTask: Task = {
                ...task,
                load: task.load + 5,
            };
            await updateTask(task.id, updatedTask);
            console.log("Updated task:", updatedTask);
        }
        console.log("Trying to assign and unassign tasks...");
        // Assign a task to a worker
        if (worker && task) {
            try {
                await assignTaskToWorker(task.id, worker.id);
                console.log(`Assigned task ${task.id} to worker ${worker.id}`);
                await sleep(1000);
            } catch (error) {
            }

            // Unassign a task from a worker
            if (worker && task) {
                await unassignTaskFromWorker(task.id);
                console.log(`Unassigned task ${task.id} from worker ${worker.id}`);
            }
            // Finish a task
            if (task) {
                await finishTask(task.id);
                console.log(`Finished task ${task.id}`);
            }
            // Delete a worker
            if (worker) {
                await deleteWorker(worker.id);
                console.log(`Deleted worker ${worker.id}`);
            }
            // Delete a task
            if (task) {
                await deleteTask(task.id);
                console.log(`Deleted task ${task.id}`);
            }
            // Wait for a while to ensure all operations are completed
            await sleep(2000);
            console.log("All operations completed successfully");
        } else {
            console.error("No worker or task available for assignment/unassignment");
        }
            */
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