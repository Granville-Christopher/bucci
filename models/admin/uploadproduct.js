const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  colors: {
    type: [String],
    required: true,
  },
  sizes: {
    type: [String],
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  brand: {
    type: String,
    enum: ["Bucci", "Others"],
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "tshirt",
      "shorts",
      "denim",
      "sweatshirt",
      "sweatpant",
      "tracksuit",
      "2piece",
      "joggers",
      "casual-trousers",
      "polo",
      "jersey",
      "jacket",
    ],
  },
  flashsale: {
    type: Boolean,
    default: false,
  },
  flashsale_price: { 
    type: Number,
    default: null,
  },
  product_images: {
    type: [String],
    validate: [arrayLimit, "{PATH} must have exactly 4 images"],
    required: true,
  },
  date_uploaded: {
    type: Date,
    default: Date.now,
  },
});

function arrayLimit(val) {
  return val.length === 4;
}

module.exports = mongoose.model("Product", productSchema);
