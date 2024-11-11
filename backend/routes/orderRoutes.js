import express from "express";
const router = express.Router();

import {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calculateTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered, // Ensure this is imported correctly
  verifyOrder
} from "../controllers/orderController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";

// Create a new order and get all orders (admin only)
router
  .route("/")
  .post(authenticate, createOrder)  
  .get(authenticate, authorizeAdmin, getAllOrders);

// eSewa success and failure routes for payment verification
router.get("/success", verifyOrder); // Updated: Changed to "/success" for clarity
router.get("/failed", (req, res) => {
  res.status(400).json({ message: 'Payment failed or cancelled' });
});

// Get orders for the authenticated user
router.route("/mine").get(authenticate, getUserOrders);

// Admin routes for total orders and sales
router.route("/total-orders").get(authenticate, authorizeAdmin, countTotalOrders); 
router.route("/total-sales").get(authenticate, authorizeAdmin, calculateTotalSales);  
router.route("/total-sales-by-date").get(authenticate, authorizeAdmin, calculateTotalSalesByDate);  

// Order by ID
router.route("/:id")
  .get(authenticate, findOrderById)  
  .put(authenticate, markOrderAsPaid) // this marks the order as paid
  .put(authenticate, authorizeAdmin, markOrderAsDelivered); // This needs to be for delivery status

// Deliver order route - ensure this handles the request properly
router.put("/:id/deliver", authenticate, authorizeAdmin, async (req, res) => {
  const orderId = req.params.id;

  try {
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.isDelivered = true; // Update the delivery status
    order.deliveredAt = new Date(); // Optionally set a delivered date

    await order.save(); // Save the changes to the database

    res.status(200).json({ message: 'Order delivered', order });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// eSewa payment success handling
router.get('/esewa/success', async (req, res) => {
  const { oid, amt, refId } = req.query; // oid: order id, amt: amount, refId: payment reference id

  try {
    // Find the order by its ID
    const order = await Order.findById(oid).populate('orderItems.product');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if the amount matches the order's total price (optional validation)
    if (order.totalPrice !== parseFloat(amt)) {
      return res.status(400).json({ message: "Payment amount mismatch" });
    }

    // Update the order with payment details (mark as paid)
    order.isPaid = true;
    order.paidAt = new Date();
    order.paymentResult = {
      id: refId,           // eSewa reference ID
      status: "Completed",  // Payment status
      update_time: new Date().toISOString(),
      email_address: "",    // Optionally add the user's email address if available
    };

    // Save the updated order
    await order.save();

    // Update stock for each product in the order
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product._id);

      if (product) {
        // Decrease the product's stock by the quantity ordered
        product.countInStock -= item.qty;

        // Ensure that the stock doesn't go negative (optional safety check)
        if (product.countInStock < 0) {
          product.countInStock = 0;
        }

        await product.save();
      }
    }

    // Redirect user to frontend (React) success page with order ID
    res.redirect(`http://localhost:5173/?oid=${oid}`);
  } catch (error) {
    console.error('Error updating order payment status and product stock:', error);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
