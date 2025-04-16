import asyncHandler from "../middlewares/asyncHandler.js";
import Product from "../models/productModel.js";
import mongoose from "mongoose";

// Add a product
const addProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, quantity, brand } = req.fields;

  // Validation
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!brand) return res.status(400).json({ error: "Brand is required" });
  if (!description)
    return res.status(400).json({ error: "Description is required" });
  if (!price) return res.status(400).json({ error: "Price is required" });
  if (!category) return res.status(400).json({ error: "Category is required" });

  // Validate if category is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  if (!quantity) return res.status(400).json({ error: "Quantity is required" });

  try {
    const product = new Product({ ...req.fields });
    await product.save();
    res.status(201).json(product); // Send 201 Created for successful POST
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Update product details
const updateProductDetails = asyncHandler(async (req, res) => {
  const { name, description, price, category, quantity, brand } = req.fields;

  // Validation
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!brand) return res.status(400).json({ error: "Brand is required" });
  if (!description)
    return res.status(400).json({ error: "Description is required" });
  if (!price) return res.status(400).json({ error: "Price is required" });
  if (!category) return res.status(400).json({ error: "Category is required" });

  // Validate if category is a valid ObjectId
  if (!mongoose.Types.ObjectId.isValid(category)) {
    return res.status(400).json({ error: "Invalid category ID" });
  }

  if (!quantity) return res.status(400).json({ error: "Quantity is required" });

  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.fields },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a product
const removeProduct = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  // Validate the ObjectId format
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Product.findByIdAndDelete(productId);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Fetch products (Pagination)
const fetchProducts = asyncHandler(async (req, res) => {
  const pageSize = 6;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        name: {
          $regex: req.query.keyword,
          $options: "i",
        },
      }
    : {};

  try {
    const count = await Product.countDocuments({ ...keyword });
    const products = await Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      hasMore: page < Math.ceil(count / pageSize),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error", error: error.message });
  }
});

// Fetch a product by ID
const fetchProductById = asyncHandler(async (req, res) => {
  const productId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Fetch all products (with optional limit and sorting)
const fetchAllProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({})
      .populate("category")
      .limit(12)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

// Add a product review
const addProductReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).json({ error: "Invalid product ID" });
  }

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ error: "Product already reviewed" });
    }

    const review = {
      name: req.user.username,
      rating: Number(rating),
      comment,
      user: req.user._id,
    };

    product.reviews.push(review);
    product.numReviews = product.reviews.length;
    product.rating =
      product.reviews.reduce((acc, item) => item.rating + acc, 0) /
      product.reviews.length;

    await product.save();
    res.status(201).json({ message: "Review added" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch top-rated products
const fetchTopProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find({}).sort({ rating: -1 }).limit(4);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch new products (latest 5)
const fetchNewProducts = asyncHandler(async (req, res) => {
  try {
    const products = await Product.find().sort({ _id: -1 }).limit(5);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Filter products by category and price range
const filterProducts = asyncHandler(async (req, res) => {
  const { checked, radio } = req.body;

  let args = {};
  if (checked.length > 0) args.category = checked;
  if (radio.length) args.price = { $gte: radio[0], $lte: radio[1] };

  try {
    const products = await Product.find(args);
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server Error" });
  }
});

export {
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
};
