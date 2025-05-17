const mongoose = require("mongoose");

const deliveryAddressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  houseNumber: {
    type: String,
    required: true,
  },
  street: {
    type: String,
    required: true,
  },
  town: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  postalCode: {
    type: String,
    required: true,
  },
  landmark: {
    type: String,
  },
});

const DeliveryAddress = mongoose.model("DeliveryAddress", deliveryAddressSchema);

module.exports = DeliveryAddress;