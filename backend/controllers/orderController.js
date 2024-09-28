import Order from "../models/orderModel.js";
import Product from "../models/productModel.js";
import axios from "axios";

// Utility Function to calculate prices
function calcPrices(orderItems) {
  const itemsPrice = orderItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const shippingPrice = itemsPrice > 100 ? 0 : 10; // Free shipping for orders over 100
  const taxRate = 0.15; // Tax rate
  const taxPrice = (itemsPrice * taxRate).toFixed(2); // Calculate tax

  const totalPrice = (
    parseFloat(itemsPrice) +
    parseFloat(shippingPrice) +
    parseFloat(taxPrice)
  ).toFixed(2); // Total price calculation

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice,
    totalPrice,
  };
}

// eSewa URLs and Merchant Code
const ESEWA_URL = "https://uat.esewa.com.np/epay/main";
const VERIFY_URL = "https://uat.esewa.com.np/epay/transrec";
const MERCHANT_CODE = "EPAYTEST"; // eSewa merchant code for testing

// Create Order Controller
const createOrder = async (req, res) => {
  try {
    const { orderItems, shippingAddress, paymentMethod } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    // Fetch the product details from the database
    const itemsFromDB = await Product.find({
      _id: { $in: orderItems.map((x) => x.product) },
    });

    // Match order items with DB items and calculate prices
    const dbOrderItems = orderItems.map((itemFromClient) => {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB._id.toString() === itemFromClient.product
      );

      if (!matchingItemFromDB) {
        return null; // Return null if product not found
      }

      return {
        ...itemFromClient,
        price: matchingItemFromDB.price,
        _id: undefined, // Remove _id to avoid confusion
      };
    });

    // Filter out null values from dbOrderItems
    const dbOrderItemsFiltered = dbOrderItems.filter(item => item !== null);

    if (dbOrderItemsFiltered.length !== orderItems.length) {
      return res.status(404).json({ message: "One or more products not found." });
    }

    const { itemsPrice, taxPrice, shippingPrice, totalPrice } = calcPrices(dbOrderItemsFiltered);

    // Create a new order in the database
    const order = new Order({
      orderItems: dbOrderItemsFiltered,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
    });

    const createdOrder = await order.save();

    // If payment method is eSewa, generate payment URL
    if (paymentMethod === "esewa") {
      const paymentPayload = {
        amt: totalPrice,
        psc: 0,
        pdc: 0,
        txAmt: 0,
        tAmt: totalPrice,
        pid: createdOrder._id.toString(),
        scd: MERCHANT_CODE,
        su: "http://localhost:5000/api/orders/success", // Success URL
        fu: "http://localhost:5000/api/orders/failed",   // Failure URL
      };

      const esewaUrl = `${ESEWA_URL}?amt=${paymentPayload.amt}&psc=${paymentPayload.psc}&pdc=${paymentPayload.pdc}&txAmt=${paymentPayload.txAmt}&tAmt=${paymentPayload.tAmt}&pid=${paymentPayload.pid}&scd=${paymentPayload.scd}&su=${paymentPayload.su}&fu=${paymentPayload.fu}`;

      return res.status(201).json({
        message: "Order created. Redirecting to eSewa.",
        esewaUrl,  // Send eSewa URL to the frontend for redirection
        order: createdOrder,
      });
    } else {
      // If payment is not via eSewa, return the created order
      return res.status(201).json(createdOrder);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Verify Order with eSewa
const verifyOrder = async (req, res) => {
  const { oid, amt, refId } = req.query; // Use appropriate query parameters

  try {
    // Verify payment with eSewa
    const response = await axios.post(VERIFY_URL, null, {
      params: {
        amt,
        scd: MERCHANT_CODE,
        rid: refId,
        pid: oid,
      },
    });

    // Check the response from eSewa for success
    if (response.data.includes('<response_code>Success</response_code>')) {
      // Update order status to "PAID"
      const order = await Order.findById(oid);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      order.isPaid = true;
      order.paidAt = Date.now();
      const updatedOrder = await order.save();

      return res.json({ message: "Payment Successful", order: updatedOrder });
    } else {
      return res.status(400).json({ message: "Payment verification failed" });
    }
  } catch (error) {
    return res.status(500).json({ message: "Error verifying payment", error });
  }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "id username");
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get user-specific orders
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    return res.json(orders);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Count total orders (Admin)
const countTotalOrders = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    return res.json({ totalOrders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Calculate total sales (Admin)
const calculateTotalSales = async (req, res) => {
  try {
    const orders = await Order.find();
    const totalSales = orders.reduce((sum, order) => sum + parseFloat(order.totalPrice), 0);
    return res.json({ totalSales });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Calculate total sales by date (Admin)
const calcualteTotalSalesByDate = async (req, res) => {
  try {
    const salesByDate = await Order.aggregate([
      {
        $match: {
          isPaid: true,
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          totalSales: { $sum: "$totalPrice" },
        },
      },
    ]);

    return res.json(salesByDate);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Find order by ID
const findOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "user",
      "username email"
    );

    if (order) {
      return res.json(order);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Mark order as paid (not eSewa specific)
const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.payer.email_address,
      };

      const updatedOrder = await order.save();
      return res.status(200).json(updatedOrder);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Mark order as delivered
const markOrderAsDelivered = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isDelivered = true;
      order.deliveredAt = Date.now();

      const updatedOrder = await order.save();
      return res.status(200).json(updatedOrder);
    } else {
      return res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Export the controller functions
export {
  createOrder,
  verifyOrder,
  getAllOrders,
  getUserOrders,
  countTotalOrders,
  calculateTotalSales,
  calcualteTotalSalesByDate,
  findOrderById,
  markOrderAsPaid,
  markOrderAsDelivered,
};
