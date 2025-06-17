import { Kafka } from "kafkajs";
import { KAFKA_BROKER, KAFKA_CLIENT_ID } from "../config";
import { v4 as uuidv4 } from "uuid";
import { KafkaEvent } from "../types/kafkaEvents";
import { subscribe } from "diagnostics_channel";

const kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: [KAFKA_BROKER]
});
export const producer = kafka.producer();

export async function initKafkaProducer() {
    try {
        await producer.connect();
        console.log("Kafka producer connected");
    } catch (error) {
        console.error("Error connecting Kafka producer:", error);
    }
}

export const consumer = kafka.consumer({ groupId: `${KAFKA_CLIENT_ID}-group` });

export async function initKafkaConsumer() {
    try {
        await consumer.connect();
        console.log("Kafka consumer connected");
    } catch (error) {
        console.error("Error connecting Kafka consumer:", error);
    }
}

export async function disconnectKafka() {
    try {
        await producer.disconnect();
        await consumer.disconnect();
        console.log("Kafka producer and consumer disconnected");
    } catch (error) {
        console.error("Error disconnecting Kafka producer and consumer:", error);
    }
}