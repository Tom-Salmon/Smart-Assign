import { consumer } from "../services/kafkaClient";
import { KafkaEvent } from "../types/kafkaEvents";
import { EachMessagePayload } from "kafkajs";

export async function initTopicRouter() {
    await consumer.subscribe({ topic: `NEW_TASK`, fromBeginning: false });
    await consumer.subscribe({ topic: `WORKER_STATUS_UPDATE`, fromBeginning: false });
    await consumer.subscribe({ topic: `TASK_ASSIGN`, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }: EachMessagePayload) => {
            if (!message.value) {
                console.error("Received message with no value");
                return;
            }
            console.log(`Received message from topic ${topic}`);
            try {
                const rawMessage = message.value.toString();
                const event: KafkaEvent = JSON.parse(rawMessage);
                switch (event.type) {
                    case "NEW_TASK":
                        // Handle new task event
                        console.log("New Task Event Received:", event.payload);
                        break;
                    case "WORKER_STATUS_UPDATE":
                        // Handle worker status update event
                        console.log("Worker Status Update Event Received:", event.payload);
                        break;
                    case "TASK_ASSIGN":
                        // Handle task assignment event
                        console.log("Task Assign Event Received:", event.payload);
                        break;
                    default:
                        console.error("Unknown event type:", (event as any).type);
                }
            } catch (error) {
                console.error("Error processing message:", error);
            }
        }
    });
    console.log("Topic router initialized and listening for events");
}

