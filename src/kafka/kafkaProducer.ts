import { producer } from "../services/kafkaClient";
import { logger } from "../services/logger";

async function sendNewTask() {
    try {
        const payload = {
            title: "Complete project report",
            priority: 1,
            createdDate: new Date(),
            requiredSkills: ["writing", "analysis"],
            description: "Detailed report on project progress",
            status: "todo",
            load: 5,
            timeToComplete: 60 * 60 * 2
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
    }
}

async function createNewWorker() {
    try {
        const payload = {
            name: "Alice",
            skills: ["writing", "design"],
            currentLoad: 0,
            maxLoad: 10,
            bio: "Experienced writer and designer",
            assignedTasks: [],
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
    }
}

export { sendNewTask, createNewWorker };