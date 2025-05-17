const express = require("express");
const {
  userRegister,
  userLogin,
  newsletterRegister,
  registerDeliveryAddress,
  postReview,
  createPayment,
  updatePaymentStatus,
  otpAuthUser,
  resetPasswordUser,
  submitMessage,
} = require("../controllers/basicCont");
const AdminMessage = require("../models/admin/replymessages")
const router = express.Router();
const DeliveryAddress = require("../models/user/deliveryaddress");
const Product = require("../models/admin/uploadproduct");
const Review = require("../models/user/review");
const Payment = require("../models/user/paymentstatus");
const Order = require('../models/user/order')
const Text = require("../models/user/myaccountmessage");

// Home route
router.get("/", async (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  try {
    const featuredProducts = await Product.aggregate([
      { $match: { /* optionally filter if needed */ } },
      { $sample: { size: 4 } }
    ]);
    
    res.render("user/index", {
      page: "home",
      loaded: "home",
      message,
      featuredProducts,
      user: req.session.user 
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.render("user/index", {
      page: "home",
      loaded: "home",
      message,
      featuredProducts: [],
      user: req.session.user 
    });
  }
});


router.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
    }).limit(4);
    const reviews = await Review.find({ product: product._id }).populate(
      "user"
    ).sort({createdAt: -1});

    const message = req.session.message || null;
    req.session.message = null;

    res.render("user/pdetails", {
      product,
      page: "home",
      loaded: "home",
      message,
      reviews,
      user: req.session.user, 
      relatedProducts,
    });
    delete req.session.message;
  } catch (err) {
    console.error("Error fetching product:", err);
    res.redirect("/");
  }
});

router.post("/home", newsletterRegister);
router.post("/submit-message", submitMessage );
router.post("/register-address", registerDeliveryAddress);
router.post("/user/review", postReview);

// About page
router.get("/about", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/about", { page: "about", loaded: "about", message });
});

// Contact page
router.get("/search", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/search", { page: "search", loaded: "search", message });
});

// shop
router.get("/shop", async (req, res) => {
  const message = req.session.message;
  req.session.message = null;

  try {
    const shopProducts = await Product.find().sort({ createdAt: -1 });
    res.render("user/shop", {
      page: "shop",
      loaded: "shop",
      message,
      shopProducts,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.render("user/shop", {
      page: "shop",
      loaded: "shop",
      message,
      shopProducts: [],
    });
  }
});
// get delivery address and send to frontend for checkout
router.get("/get-delivery-address", async (req, res) => {
  try {
    if (!req.session.userId) {
      console.log("Session validation failed: User is not logged in.");
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    console.log("Fetching delivery address for user ID:", req.session.userId);

    const deliveryAddress = await DeliveryAddress.findOne({
      userId: req.session.userId,
    });

    if (!deliveryAddress) {
      console.log("Delivery address not found for user ID:", req.session.userId);
      return res.json({ message: "No shipping address uploaded.", address: null });
    }

    console.log("Delivery address found:", deliveryAddress);
    res.json({ address: deliveryAddress });
  } catch (error) {
    console.error("Error fetching delivery address:", error);
    res.status(500).json({ error: "Failed to fetch delivery address." });
  }
});
// logout
router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// account
router.get("/myaccount", async (req, res) => {
  if (!req.session.userId) {
    req.session.message = "Please log in to access your account.";
    return res.redirect("/login");
  }

  const message = req.session.message;
  req.session.message = null;

  try {
    const deliveryAddress = await DeliveryAddress.findOne({ userId: req.session.userId });
    // const messages = await Text.find({ userId: req.session.userId }).sort({ createdAt: 1 });

    const completedPayments = await Payment.find({ userId: req.session.userId, status: "completed" });
    const failedPayments = await Payment.find({ userId: req.session.userId, status: "failed" });

    const pendingDeliveryOrders = await Order.find({ userId: req.session.userId, status: "pending_delivery" });
    const deliveredOrders = await Order.find({ userId: req.session.userId, status: "delivered" });

    res.render("user/myaccount", {
      page: "myaccount",
      loaded: "myaccount",
      message,
      user: req.session.user,
      deliveryAddress,
      completedPayments,
      failedPayments,
      pendingDeliveryOrders,
      deliveredOrders,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    req.session.message = "Something went wrong. Please try again.";
    res.redirect("/myaccount");
  }
});

// login
router.get("/login", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/login", { page: "login", loaded: "login", message });
});

router.post("/login", userLogin);

// signup
router.get("/signup", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/signup", { page: "signup", loaded: "signup", message });
});

router.post("/signup", userRegister);

// wishlist
router.get("/wishlist", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/wishlist", {
    page: "wishlist",
    loaded: "wishlist",
    message,
  });
});

// reciept
router.get("/reciept", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/reciept", { page: "reciept", loaded: "reciept", message });
});

// cart
router.get("/cart", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  if (!req.session.userId) {
    req.session.message = "Please log in to access your cart.";
    return res.redirect("/login");
  }

  res.render("user/cart", { page: "cart", loaded: "cart", message, user: req.session.user });
});


// checkout mail send
router.post('/create-payment', createPayment);
router.put("/update-payment-status/:paymentId", updatePaymentStatus);


router.get('/get-payments', async (req, res) => {
  try {
      // Fetch all payments from the database
      let payments = await Payment.find({ userId: req.session.userId });

      // Filter payments by their status
      let completedPayments = payments.filter(payment => payment.status === 'completed');
      let failedPayments = payments.filter(payment => payment.status === 'failed');

      res.json({
          completed: completedPayments,
          failed: failedPayments
      });
  } catch (error) {
      res.status(500).json({ message: 'Error fetching payments', error });
  }
});

// route to display messages for user
router.get("/user-send-messages", async (req, res) => {
  try {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });

    const userMessages = await Text.find({ userId: req.session.userId }).lean();
    const adminMessages = await AdminMessage.find({ toUserId: req.session.userId }).lean();

    const allMessages = [...userMessages, ...adminMessages];
    allMessages.sort((a, b) => new Date(a.createdAt || a.sentAt) - new Date(b.createdAt || b.sentAt));

    res.json({ messages: allMessages });
  } catch (error) {
    console.error("Error fetching messages for user:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// reset password
router.get("/passwordreset", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("user/passwordreset", { page: "resetpassword", loaded: "resetpassword", message });
});
// get OTP
router.post("/request-otp-user", otpAuthUser);

// reset password
router.post("/reset-password-user", resetPasswordUser);

module.exports = router;
