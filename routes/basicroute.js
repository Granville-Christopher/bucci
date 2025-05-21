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

// In-memory cache and helper function
const productCache = new Map();

function setCacheWithExpiry(key, value, ttl = 300000) {
  productCache.set(key, value);
  setTimeout(() => {
    productCache.delete(key);
  }, ttl);
}


// SEARCH endpoint
router.get('/api/search', async (req, res) => {
  const query = req.query.q?.toLowerCase() || "";

  try {
    if (!query) {
      return res.json({ suggestions: [], products: [] });
    }

    const products = await Product.find({
      product_name: { $regex: query, $options: 'i' }
    }).limit(20);

    const suggestions = products
      .map(p => p.product_name)
      .filter((name, index, self) => self.indexOf(name) === index)
      .slice(0, 10);

    res.json({ suggestions, products });
  } catch (err) {
    console.error("❌ Error in /api/search:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


// Home route
router.get("/", async (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  try {
    const featuredProducts = await Product.aggregate([
      { $match: { brand: "Bucci" } },
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
router.get("/index-filter-category", async (req, res) => {
  try {
    const brand = req.query.brand || "Bucci";
    const category = req.query.category;

    let filter = { brand };
    if (category && category !== "all") {
      filter.category = category;
    }

    const filteredProducts = await Product.find(filter);

    res.render("user/partials/brand-filter", {
      shopProducts: filteredProducts
    });
  } catch (err) {
    console.error("Error filtering category:", err);
    res.send("An error occurred while filtering.");
  }
});


router.get("/api/filter-products", async (req, res) => {
  const category = req.query.category;
  
  if (productCache.has(category)) {
    return res.json(productCache.get(category));
  }
  
  try {
    let products;
    
    if (category === "all") {
      products = await Product.aggregate([{ $sample: { size: 8 } }]);
    } else {
      products = await Product.aggregate([
        { $match: { category: category } },
        { $sample: { size: 8 } },
      ]);
    }
    
    productCache.set(category, products); // Store result in cache
    res.json(products);
  } catch (err) {
    console.error("Error filtering products:", err);
    res.status(500).json([]);
  }
});
router.get("/filter-brand", async (req, res) => {
  let { brand } = req.query;

  // Log the received brand value
  console.log("Received brand query:", brand);

  // Capitalize properly
  brand = brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase();
  console.log("After capitalization:", brand);

  try {
    const productsByBrand = await Product.find({ brand });
    console.log("Matching products:", productsByBrand.length); // Debug product count

    res.render("user/partials/brand-filter", { shopProducts: productsByBrand });
  } catch (err) {
    console.error("Error fetching brand products:", err);
    res.render("user/partials/brand-filter", { shopProducts: [] });
  }
});

router.get("/product/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    // If product not found, handle it (e.g., redirect to 404 or home)
    if (!product) {
      req.session.message = "Product not found.";
      return res.redirect("/shop");
    }

    const reviews = await Review.find({ product: product._id })
      .populate("user") 
      .sort({ createdAt: 1 }); 

   
    let totalRating = 0;
    if (reviews.length > 0) {
      reviews.forEach((review) => {
        totalRating += review.rating; 
      });
    }

    const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : "0.0";

    const relatedProducts = await Product.aggregate([
      { $match: { category: product.category, _id: { $ne: product._id } } },
      { $sample: { size: 4 } },
    ]);

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
      averageRating,
    });
   
  } catch (err) {
    console.error("Error fetching product:", err);
    req.session.message = "Could not load product details."; // Set a message for the redirect
    res.redirect("/"); // Redirect to home or an error page
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

  const page = parseInt(req.query.page) || 1;
  const limit = 8; // products per page
  const skip = (page - 1) * limit;

  try {
    // Get total products count
    const totalProducts = await Product.countDocuments();

    const shopProducts = await Product.find({})
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalProducts / limit);

    res.render("user/shop", {
      page: "shop",
      loaded: "shop",
      message,
      shopProducts,
      currentPage: page,
      totalPages,
    });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.render("user/shop", {
      page: "shop",
      loaded: "shop",
      message,
      shopProducts: [],
      currentPage: 1,
      totalPages: 1,
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
