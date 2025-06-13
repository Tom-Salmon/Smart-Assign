import { getRedisClient } from "./redisClient";
import { Order } from "./mongo";
import { OrderType } from "../common/order.interface";

const processOrder = async (order: OrderType): Promise<void> => {
    const redisClient = await getRedisClient();
    try {
        await Order.create(order);
        console.log("Order saved to MongoDB:", order);
        await redisClient.set(order.orderId, JSON.stringify(order), {
            EX: 3600,
        });
        console.log("Order stored in Redis:", order.orderId);
    } catch (error) {
        console.error("Error processing order:", error);
    }
};

const getOrderById = async (orderId: string): Promise<OrderType | null> => {
    const redisClient = await getRedisClient();
    try {
        const cachedOrder = await redisClient.get(orderId);
        if (cachedOrder) {
            console.log("Order retrieved from Redis cache:", orderId);
            return JSON.parse(cachedOrder);
        } else {
            const order = await Order.findOne({ orderId });
            if (order) {
                console.log("Order retrieved from MongoDB:", orderId);
                redisClient.set(orderId, JSON.stringify(order), {
                    EX: 3600, // Cache for 1 hour
                });
                return order.toObject() as OrderType;
            } else {
                console.log("Order not found:", orderId);
                return null;
            }
        }
    } catch (error) {
        console.error("Error retrieving order:", error);
        return null;
    }
}