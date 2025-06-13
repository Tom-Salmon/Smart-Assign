import { getRedisClient } from "./redisClient";
import { Order } from "./mongo";
import { OrderType } from "../common/order.interface";

const getOrderById = async (orderId: string): Promise<OrderType | null> => {
    const redisClient = await getRedisClient();
    try {
        const cachedOrder = await redisClient.get(orderId);
        if (cachedOrder) {//check cached order in Redis
            console.log("Order retrieved from Redis cache:", orderId);
            return JSON.parse(cachedOrder);
        } else {//check MongoDB for order
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

const saveOrder = async (order: OrderType): Promise<void> => {
    const redisClient = await getRedisClient();
    try {
        await Order.updateOne({ orderId: order.orderId }, order, { upsert: true });
        console.log("Order saved to MongoDB:", order);
        await redisClient.set(order.orderId, JSON.stringify(order), {
            EX: 3600, // Cache for 1 hour
        });
        console.log("Order stored in Redis:", order.orderId);
    } catch (error) {
        console.error("Error saving order:", error);
    }
};


const updateOrder = async (orderId: string, updatedData: Partial<OrderType>): Promise<OrderType | null> => {
    const order = await getOrderById(orderId);
    if (!order) {
        console.log("Order not found for update:", orderId);
        return null;
    }
    const updatedOrder = { ...order, ...updatedData };
    try {
        await saveOrder(updatedOrder);
        console.log("Order updated:", updatedOrder);
        return updatedOrder;
    } catch (error) {
        console.error("Error updating order:", error);
        return null;
    }
};
export { getOrderById, saveOrder, updateOrder };