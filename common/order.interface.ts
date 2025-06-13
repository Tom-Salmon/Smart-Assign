export interface OrderType {
    orderId: string;
    customerName: string;
    restaurantName: string;
    size: string;
    toppings: string[];
    timestamp: number;
}