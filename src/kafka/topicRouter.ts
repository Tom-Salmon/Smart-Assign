import { consumer } from "../services/kafkaClient";
import { KafkaEvent } from "../types/kafkaEvents";
import { EachMessagePayload } from "kafkajs";
import { handleNewTask } from "../services/taskHandler";
import { handleNewWorker } from "../services/workerHandler";

export async function initTopicRouter() {
    await consumer.subscribe({ topic: `NEW_TASK`, fromBeginning: false });
    await consumer.subscribe({ topic: `NEW_WORKER`, fromBeginning: false });

    await consumer.run({
        eachMessage: async ({ topic, message }: EachMessagePayload) => {
            if (!message.value) {
                console.error("Received message with no value");
                return;
            }

            try {
                console.log(`Received message from topic ${topic} at offset ${message.offset}`);
                const rawMessage = message.value.toString();
                const event: KafkaEvent = JSON.parse(rawMessage);
                console.log("Parsed event:", event);

                switch (event.type) {
                    case "NEW_TASK":
                        await handleNewTask(event.payload);
                        console.log("Handled new task:", event.payload);
                        break;
                    case "NEW_WORKER":
                        await handleNewWorker(event.payload);
                        console.log("Handled new worker:", event.payload);
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
