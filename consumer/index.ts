import { Kafka } from "kafkajs";
import { connectToMongoDB, Order } from "./mongo";
import { OrderType } from "../common/order.interface";
import { getOrderById, saveOrder, updateOrder } from "./orderService";

const consumer = new Kafka({
    clientId: "pizza-notifier",
    brokers: ["localhost:9092"],
});
const kafkaConsumer = consumer.consumer({ groupId: "pizza-orders-group" });


(async () => {
    try {
        await connectToMongoDB();
        await kafkaConsumer.connect();
        await kafkaConsumer.subscribe({ topic: "pizza-orders", fromBeginning: true });
        console.log("Consumer connected and subscribed to topic");
        kafkaConsumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                if (!message.value) {
                    console.error("Received message with no value");
                } else {
                    try {
                        await saveOrder(JSON.parse(message.value.toString()) as OrderType);
                    } catch (error) {
                        console.error("Error processing message:", error);
                    }
                }
            }
        });
    } catch (error) {
        console.error("Error in consumer:", error);
    }
})();
