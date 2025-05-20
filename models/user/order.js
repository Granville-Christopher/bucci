const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  fullname: {
    type: String,
    required: true,
  },
  items: [
    {
      name: String,
      price: String,
      quantity: Number,
      image: String,
      itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending_delivery", "delivered", ],
    default: "pending_delivery", 
  },
  orderDate: {
    type: Date,
    default: Date.now,
  },
  deliveryDate: {
    type: Date,
  },
  paymentReference: {
    type: String,
  },
  shippingAddress: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DeliveryAddress",
    required: true,
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;