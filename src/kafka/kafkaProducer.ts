import { producer } from "../services/kafkaClient";
import { logger } from "../services/logger";
import { Task, Worker } from '../types/entities';

async function sendNewTask(taskData: Omit<Task, 'id'>): Promise<void> {
    try {
        const payload = {
            ...taskData,
            createdDate: taskData.createdDate || new Date(),
            status: taskData.status || "todo" as const
        };
        await producer.send({
            topic: "NEW_TASK",
            messages: [
                {
                    value: JSON.stringify({
                        type: "NEW_TASK",
                        payload: payload
                    })
                }
            ]
        });
        logger.info("Sent NEW_TASK to Kafka:", payload);
    } catch (error) {
        logger.error("Error sending new task to Kafka:", error);
        throw error;
    }
}

async function createNewWorker(workerData: Omit<Worker, 'id'>): Promise<void> {
    try {
        const payload = {
            ...workerData,
            currentLoad: workerData.currentLoad || 0,
            assignedTasks: workerData.assignedTasks || [],
        };
        await producer.send({
            topic: "NEW_WORKER",
            messages: [
                {
                    value: JSON.stringify({
                        type: "NEW_WORKER",
                        payload: payload
                    })
                }
            ]
        });
        logger.info("Sent NEW_WORKER to Kafka:", payload);
    } catch (error) {
        logger.error("Error sending new worker to Kafka:", error);
        throw error;
    }
}

export { sendNewTask, createNewWorker };