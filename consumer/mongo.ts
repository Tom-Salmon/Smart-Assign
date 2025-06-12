import mongoose from "mongoose";


async function connectToMongoDB() {
    try {
        await mongoose.connect("mongodb://localhost:27017/pizza-orders");
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

const orderSchema = new mongoose.Schema({
    orderId: String,
    customerName: String,
    restaurantName: String,
    size: String,
    toppings: [String],
    timestamp: Number,
});

const Order = mongoose.model("Order", orderSchema);


export { connectToMongoDB, Order };