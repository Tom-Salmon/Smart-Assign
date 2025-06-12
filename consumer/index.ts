import { Kafka } from "kafkajs";
import { connectToMongoDB, Order } from "./mongo";

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
                        const order = JSON.parse(message.value.toString());
                        await Order.create(order);
                        console.log("Order saved to MongoDB:", order);
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
