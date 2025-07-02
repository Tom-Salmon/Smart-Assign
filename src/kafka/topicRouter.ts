import { consumer } from "../services/kafkaClient";
import { KafkaEvent } from "./kafkaEvents";
import { EachMessagePayload } from "kafkajs";
import { handleNewTask } from "../services/taskHandler";
import { handleNewWorker } from "../services/workerHandler";
import { logger } from "../services/logger";

// This module initializes the Kafka consumer and subscribes to specific topics.
// It listens for messages and processes them based on their type, handling new tasks and workers.

async function initTopicRouter() {
    await consumer.subscribe({ topic: `NEW_TASK`, fromBeginning: false });
    await consumer.subscribe({ topic: `NEW_WORKER`, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }: EachMessagePayload) => {
            if (!message.value) {
                logger.error("Received message with no value");
                return;
            }

            try {
                logger.info(`Received message from topic ${topic} at offset ${message.offset}`);
                const rawMessage = message.value.toString();
                const event: KafkaEvent = JSON.parse(rawMessage);
                logger.info("Parsed event:", event);

                switch (event.type) {
                    case "NEW_TASK":
                        await handleNewTask(event.payload);
                        logger.info("Handled new task:", event.payload);
                        break;
                    case "NEW_WORKER":
                        await handleNewWorker(event.payload);
                        logger.info("Handled new worker:", event.payload);
                        break;
                    default:
                        logger.error("Unknown event type:", (event as any).type);
                }
            } catch (error) {
                logger.error("Error processing message:", error);
            }
        }
    });

    logger.info("Topic router initialized and listening for events");
}
export { initTopicRouter };