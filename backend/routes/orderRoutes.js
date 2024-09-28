import express from "express";
const router = express.Router();

import {
  createOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
  verifyOrder
} from "../controllers/orderController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

// Create a new order and get all orders (admin only)
router
  .route("/")
  .post(authenticate, createOrder)  
  .get(authenticate, authorizeAdmin, getAllOrders);

// eSewa success and failure routes for payment verification
router.get("/orders/success", verifyOrder);
router.get("/orders/failed", (req, res) => {
  res.status(400).json({ message: 'Payment failed or cancelled' });
});

// Get orders for the authenticated user
router.route("/mine").get(authenticate, getUserOrders);

// Admin routes for total orders and sales
router.route("/total-orders").get(authenticate, authorizeAdmin, countTotalOrders); 
router.route("/total-sales").get(authenticate, authorizeAdmin, calculateTotalSales);  
router.route("/total-sales-by-date").get(authenticate, authorizeAdmin, calcualteTotalSalesByDate);  

// Order by ID
router.route("/:id")
  .get(authenticate, findOrderById)  
  .put(authenticate, markOrderAsPaid)  
  .put(authenticate, authorizeAdmin, markOrderAsDelivered);

export default router;
