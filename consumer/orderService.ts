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

