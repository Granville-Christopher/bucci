const express = require("express");
const router = express.Router();
// const otpStore = {};

const Product = require("../models/admin/uploadproduct");
const Review = require("../models/user/review");
const Admin = require("../models/admin/register");
const upload = require("../middlewares/upload");
const AdminMessage = require("../models/admin/replymessages");
const Text = require("../models/user/myaccountmessage");
// const Order = require("../models/user/order")
// const nodemailer = require("nodemailer");

const {
  adminRegister,
  adminLogin,
  uploadProduct,
  deleteProduct,
  updateProfile,
  changePassword,
  otpAuth,
  updateOrderStatus,
  resetPasswordAdmin,
  getOrderDetails,
  markMessageAsRead,
  getDashboardStats,
  getMessages,
  getAverageRating,
  totalIncome,
} = require("../controllers/admincont");
const Users = require("../models/user/signupmodel");
const Payment = require("../models/user/paymentstatus")
const Order = require("../models/user/order");
// const DeliveryAddress = require("../models/user/deliveryaddress");

// Dummy admin dashboard
router.get("/", async (req, res) => {
  if (!req.session.adminId) {
    req.session.message = "Please log in to access your account.";
    return res.redirect("admin/signin");
  }

  const message = req.session.message;
  req.session.message = null;
  const admin = req.session.admin;

  try {
    const reviews = await Review.find()
      .populate("user")
      .populate("product")
      .sort({ date: -1 });

    const users = await Users.find().sort({ createdAt: -1 });
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const totalOrders = await Order.countDocuments({ userId: user._id });
        const completedOrders = await Order.countDocuments({ userId: user._id, status: "delivered" });
        const pendingOrders = await Order.countDocuments({ userId: user._id, status: "pending_delivery" });
    
        return {
          ...user.toObject(),
          totalOrders,
          completedOrders,
          pendingOrders
        };
      })
    );
    const products = await Product.find().sort({ createdAt: -1 });

    const pendingDeliveryOrders = await Order.find({
      status: "pending_delivery",
    });
    const deliveredOrders = await Order.find({
      userId: req.session.userId,
      status: "delivered",
    });
    const failedOrders = await Payment.find({status: "failed"});
    await Text.updateMany({}, { $set: { unread: false } }); 
    // const usermessages = await Text.find().sort({ createdAt: 1 });
    res.render("admin/admin", { message, admin, users: usersWithOrders, reviews, products, pendingDeliveryOrders, deliveredOrders, failedOrders });
  } catch (err) {
    console.error("Error fetching data:", err);
    res.render("admin/admin", {
      message,
      admin,
      products: [],
      users: usersWithOrders,
      reviews: [],
      pendingDeliveryOrders: [],
      deliveredOrders: [],
      failedOrders: [],
      // usermessages: [],
    });
  }
});
router.get('/dashboard-stats', getDashboardStats);
router.get("/get-messages", getMessages);
router.get('/get-sidebar-messages', async (req, res) => {
  try {
    const usermessages = await Text.aggregate([
      {
        $sort: { createdAt: -1 } // Sort by latest messages first
      },
      {
        $group: {
          _id: "$userId",
          userId: { $first: "$userId" }, // Explicit userId for frontend
          text: { $first: "$text" },
          fullname: { $first: "$fullname" },
          unread: { $first: "$unread" },
          createdAt: { $first: "$createdAt" },
          allMessages: { $push: "$$ROOT" }
        }
      },
      {
        $sort: { createdAt: -1 } // Sort users by latest message
      }
    ]);

    res.json(usermessages);
  } catch (err) {
    console.error("Failed to get messages:", err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
router.post('/mark-messages-read', async (req, res) => {
  try {
    const { userId } = req.body;
    await Text.updateMany({ userId, unread: true }, { $set: { unread: false } });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Failed to mark messages as read:", error);
    res.status(500).json({ error: 'Server error' });
  }
});

// view product
router.get('/product/:id', async (req, res) => {
  try {
    // 1. Auth check
    if (!req.session.adminId) {
      req.session.message = "Please log in to access your account.";
      return res.redirect("/admin/signin"); // ✅ FIXED: should have slash
    }

    // 2. Handle flash message
    const message = req.session.message || null;
    req.session.message = null;

    // 3. Fetch product and admin
    const productId = req.params.id;
    const product = await Product.findById(productId);
    const admin = req.session.admin;

    if (!product) {
      return res.status(404).render('admin/404', { message, admin });
    }

    // 4. Render the product details page
    res.render('admin/productDetails', { product, admin, message });

  } catch (err) {
    console.error("Error fetching product:", err);
    const admin = req.session.Admin || { fullname: "Admin" }; // fallback to avoid crash
    const message = "Server error.";
    res.status(500).render('admin/500', { message, admin });
  }
});

// delete product
router.post('/delete-product/:id', async (req, res) => {
  try {
    if (!req.session.adminId) {
      req.session.message = "Please log in to perform this action.";
      return res.redirect("/admin/signin");
    }

    const productId = req.params.id;

    await Product.findByIdAndDelete(productId);

    req.session.message = "Product deleted successfully.";
    res.redirect('/admin');
  } catch (err) {
    console.error("Failed to delete product:", err);
    req.session.message = "Failed to delete the product.";
    res.redirect('/admin');
  }
});

// admin reply route
router.post("/admin-reply-message", async (req, res) => {
  const { userId, text } = req.body;

  try {
    const user = await Users.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await AdminMessage.create({
      toUserId: userId,
      text
    });

    res.status(200).json({ message: "Admin message sent" });
  } catch (err) {
    console.error("❌ Error in admin-reply-message:", err);
    res.status(500).json({ error: "Server error" });
  }
});


router.put("/mark-read/:userId", markMessageAsRead);
router.get('/average-rating', getAverageRating);
router.get('/total-income', totalIncome);

router.get("/register", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("admin/register", { message });
});
router.get("/resetpassword", (req, res) => {
  const message = req.session.message;
  req.session.message = null;
  res.render("admin/passwreset", { message });
});
router.post("/register", adminRegister);
router.post(
  "/upload-product",
  upload.array("product_images[]", 4),
  uploadProduct
);

router.get("/signin", (req, res) => {
  const message = req.session.message;
  req.session.message = null;

  const logoutSuccess =
    req.query.logout === "successfully logged out, please sign in";

  res.render("admin/signin", {
    message,
    logoutSuccess,
  });
});

router.post("/signin", adminLogin);
// Edit a product
router.put("/products/:id", (req, res) => {
  res.send(`Admin: Product ${req.params.id} updated`);
});

// Delete a product
router.post("/delete-product/:id", deleteProduct);

router.post("/profile", updateProfile);
router.post("/change-password", changePassword);
router.put("/update-order-status/:order_Id", updateOrderStatus);
router.get("/get-order/:order_Id", getOrderDetails);
// get OTP
router.post("/request-otp", otpAuth);

// reset password
router.post("/reset-password", resetPasswordAdmin);

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/admin");
    }

    res.clearCookie("connect.sid");
    res.redirect("/admin/signin?logout=success");
  });
});



module.exports = router;
