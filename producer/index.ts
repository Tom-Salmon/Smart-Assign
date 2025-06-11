import { Kafka } from "kafkajs";
import { v4 as uuidv4 } from "uuid";

const kafka = new Kafka({
    clientId: "pizza-notifier",
    brokers: ["localhost:9092"],
});

const producer = kafka.producer();
async function sendPizzaNotification() {
    await producer.connect();
    console.log("Producer connected");

    const order = {
        orderId: uuidv4(),
        customerName: "Tom Salmon",
        restaurantName: "Domino's Pizza",
        size: "Large",
        toppings: ["Pepperoni", "Mushrooms"],
        timestamp: Date.now()
    };
    try {
        await producer.send({
            topic: "pizza-orders",
            messages: [
                {
                    key: order.orderId,
                    value: JSON.stringify(order),
                },
            ],
        })
        console.log("Message sent:", order);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}
sendPizzaNotification().catch(console.error);