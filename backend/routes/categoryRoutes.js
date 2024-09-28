import express from "express";
const router = express.Router();
import {
  createCategory,
  updateCategory,
  removeCategory,
  listCategory,
  readCategory,
} from "../controllers/categoryController.js";

import { authenticate, authorizeAdmin } from "../middlewares/authMiddleware.js";

// Create a category
router.route("/").post(authenticate, authorizeAdmin, createCategory);

// Update and delete a category by ID
router
  .route("/:categoryId")
  .put(authenticate, authorizeAdmin, updateCategory)
  .delete(authenticate, authorizeAdmin, removeCategory);

// List all categories
router.route("/categories").get(listCategory);

// Get a category by ID
router.route("/:id").get(readCategory);

export default router;
