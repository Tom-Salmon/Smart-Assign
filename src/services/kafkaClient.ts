import { Kafka } from "kafkajs";
import { KAFKA_CLIENT_ID } from "../config";
import { logger } from "./logger";

// This module provides a Kafka client for connecting to a Kafka server.
// It exports functions to initialize a Kafka producer and consumer, and to disconnect them when needed.


const kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: ['host.docker.internal:9092']
});
const producer = kafka.producer();

async function initKafkaProducer() {
    try {
        await producer.connect();
        logger.info("Kafka producer connected");
    } catch (error) {
        logger.error("Error connecting Kafka producer:", error);
    }
}

const consumer = kafka.consumer({ groupId: `${KAFKA_CLIENT_ID}-group` });

async function initKafkaConsumer() {
    try {
        await consumer.connect();
        logger.info("Kafka consumer connected");
    } catch (error) {
        logger.error("Error connecting Kafka consumer:", error);
    }
}

async function disconnectKafka() {
    try {
        await producer.disconnect();
        await consumer.disconnect();
        logger.info("Kafka producer and consumer disconnected");
    } catch (error) {
        logger.error("Error disconnecting Kafka producer and consumer:", error);
    }
}

export {
    initKafkaProducer,
    initKafkaConsumer,
    disconnectKafka,
    producer,
    consumer
};