import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import asyncHandler from "./asyncHandler.js";

// Middleware to authenticate a user via JWT stored in cookies
const authenticate = asyncHandler(async (req, res, next) => {
  let token;

  // Read JWT from cookies
  token = req.cookies.jwt;

  if (token) {
    try {
      // Decode JWT using secret
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");

      // Proceed to the next middleware
      next();
    } catch (error) {
      res.status(401); // Unauthorized
      throw new Error("Not authorized, token failed.");
    }
  } else {
    res.status(401); // Unauthorized
    throw new Error("Not authorized, no token.");
  }
});

// Middleware to authorize admin users
const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next(); // If user is admin, proceed
  } else {
    res.status(401).send("Not authorized as an admin.");
  }
};

export { authenticate, authorizeAdmin };
