import express from "express";
import formidable from "express-formidable"; // For handling forms
import {
  addProduct,
  updateProductDetails,
  removeProduct,
  fetchProducts,
  fetchProductById,
  fetchAllProducts,
  addProductReview,
  fetchTopProducts,
  fetchNewProducts,
  filterProducts,
} from "../controllers/productController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";
import checkId from "../middlewares/checkId.js"; // Middleware to validate IDs

const router = express.Router();

// Fetch all products, add new product (admin only)
router
  .route("/")
  .get(fetchProducts) // Public route
  .post(authenticate, authorizeAdmin, formidable(), addProduct); // Admin protected route

// Fetch all products without pagination
router.route("/allproducts").get(fetchAllProducts);

// Add a review to a product
router.route("/:id/reviews").post(authenticate, checkId, addProductReview);

// Fetch top products and new products
router.get("/top", fetchTopProducts);
router.get("/new", fetchNewProducts);

// CRUD routes for a product by ID (admin only for update and delete)
router
  .route("/:id")
  .get(checkId, fetchProductById) // Validate ID first, then fetch product (public route)
  .put(authenticate, authorizeAdmin, formidable(), updateProductDetails) // Admin protected, form handling for updating product details
  .delete(authenticate, authorizeAdmin, removeProduct); // Admin protected

// Route for filtered products by category and price
router.route("/filtered-products").post(filterProducts);

export default router;
