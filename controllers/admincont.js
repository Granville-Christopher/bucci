const Admin = require("../models/admin/register");
const bcrypt = require("bcryptjs");
const Product = require("../models/admin/uploadproduct");
const nodemailer = require("nodemailer");
const Order = require("../models/user/order");
const Payment = require("../models/user/paymentstatus");
const otpStore = {};
const User = require("../models/user/signupmodel");
const Text = require("../models/user/myaccountmessage");
const mongoose = require("mongoose");
const Review = require("../models/user/review");
const AdminMessage = require("../models/admin/replymessages");

const adminRegister = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !phone || !password) {
      req.session.message = "All fields required";
      return res.status(400).redirect("/admin/register");
    }

    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      req.session.message = "Admin already exists";
      return res.status(400).redirect("/admin/register");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new Admin({
      fullname,
      email,
      phone,
      password: hashedPassword,
    });

    await newAdmin.save();
    res.status(201).redirect("/admin/signin");
  } catch (err) {
    console.error("Error saving admin:", err);
    req.session.message = "No internet connection";
    res.status(500).redirect("/admin/register"); // 🔁 Changed here
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.message = "Email and password are required";
      return res.redirect("/admin/signin");
    }

    const admin = await Admin.findOne({ email });

    if (!admin) {
      req.session.message = "Invalid email or password";
      return res.redirect("/admin/signin");
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      req.session.message = "Invalid email or password";
      return res.redirect("/admin/signin");
    }

    // ✅ Store only required fields in session
    req.session.adminId = admin._id;
    req.session.admin = {
      fullname: admin.fullname,
      email: admin.email,
    };

    req.session.message = "Login successful";
    res.redirect("/admin");
  } catch (error) {
    console.error("Login error:", error);
    req.session.message = "No internet connection";
    res.redirect("/admin/signin");
  }
};

const uploadProduct = async (req, res) => {
  try {
    const {
      product_name,
      quantity,
      colors,
      sizes,
      price,
      brand,
      category,
      flashsale,
      flashsale_price,
    } = req.body;

    // Validate number of uploaded images
    if (!req.files || req.files.length !== 4) {
      req.session.message = "You must upload exactly 4 images.";
      return res.redirect("/admin"); // Adjust path as needed
    }

    // Map the image filenames
    const product_images = req.files.map(
      (file) => `/uploadedimages/${file.filename}`
    );

    // Create and save new product
    const newProduct = new Product({
      product_name,
      quantity,
      colors: Array.isArray(colors) ? colors : [colors],
      sizes: Array.isArray(sizes) ? sizes : [sizes],
      price,
      brand,
      category,
      product_images,
      flashsale: flashsale === "on" ? true : false,
      flashsale_price: flashsale === "on" && flashsale_price ? flashsale_price : null,
    });

    await newProduct.save();

    req.session.message = "Product uploaded successfully!";
    res.redirect("/admin");
  } catch (err) {
    console.error("Upload Error:", err);
    req.session.message = "An error occurred while uploading the product.";
    res.redirect("/admin");
  }
};


const deleteProduct = async (req, res) => {
  try {
    const message = req.session.message;
    req.session.message = null;

    const productId = req.params.id;
    await Product.findByIdAndDelete(productId);
    req.session.message = "product deleted";
    res.redirect("/admin");
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).send("Server error");
  }
};

// edit admin profile
const updateProfile = async (req, res) => {
  try {
    // Get the admin ID from the session (assuming you're saving admin info in session)
    const adminId = req.session.adminId; // Make sure you are storing this when the admin logs in
    if (!adminId) {
      req.session.message = "Please log in first.";
      return res.redirect("/admin/signin");
    }

    // Extract new name and email from request body
    const { fullname, email } = req.body;

    if (!fullname || !email) {
      req.session.message = "Name and email cannot be empty.";
      return res.redirect("/admin"); // Or redirect back to the profile page
    }

    // Check if the email is already taken by another admin
    const conflict = await Admin.findOne({ email, _id: { $ne: adminId } });
    if (conflict) {
      req.session.message = "That email is already in use by another admin.";
      return res.redirect("/admin");
    }

    // Perform the profile update
    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { fullname, email }, // Fields to update
      { new: true } // Return the updated admin
    );

    // Update session values if you're storing admin details in session
    req.session.admin.fullname = updatedAdmin.fullname;
    req.session.admin.email = updatedAdmin.email;

    req.session.message = "Profile updated successfully!";
    res.redirect("/admin"); // Or wherever you want to redirect after the update
  } catch (err) {
    console.error("Error updating profile:", err);
    req.session.message = "Something went wrong. Please try again.";
    res.redirect("/admin");
  }
};

const changePassword = async (req, res) => {
  try {
    const adminId = req.session.adminId; // Get the admin ID from session
    if (!adminId) {
      req.session.message = "Please log in first.";
      return res.redirect("/admin/signin");
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      req.session.message = "All fields are required.";
      return res.redirect("/admin"); // Redirect to admin page or wherever you want
    }

    if (newPassword !== confirmPassword) {
      req.session.message = "New passwords don't match.";
      return res.redirect("/admin");
    }

    // Find the admin
    const admin = await Admin.findById(adminId);
    if (!admin) {
      req.session.message = "Admin not found.";
      return res.redirect("/admin");
    }

    // Compare current password with stored password
    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isPasswordCorrect) {
      req.session.message = "Current password is incorrect.";
      return res.redirect("/admin");
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    admin.password = hashedPassword;
    await admin.save();

    req.session.message = "Password changed successfully!";
    res.redirect("/admin"); // Or wherever you want to redirect after successful change
  } catch (err) {
    console.error("Error changing password:", err);
    req.session.message = "Something went wrong. Please try again.";
    res.redirect("/admin");
  }
};

// otp auth
const otpAuth = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    req.session.message = "Email not found in admin database.";
    return res.redirect("back");
  }

  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP and expiry to database
  admin.otp = generatedOTP;
  admin.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  await admin.save();

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "christophergranville2@gmail.com",
      pass: "kjopewaeanpgfuxv",
    },
  });

  await transporter.sendMail({
    from: "BUCCI ADMIN <christophergranville2@gmail.com>",
    to: email,
    subject: "Your OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;"> 
          <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; text-align: center;">
          <div>
            <img style="height: 30px;" src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" >
          </div>
            <h2 style="color: #333;">Hello!</h2>
            <p style="font-size: 16px; color: #666;">Your OTP code is:</p>
            <a href="https://yourwebsite.com" style="display: inline-block; margin-top: 20px; padding: 12px 25px; background-color: #cc9933; color: white; text-decoration: none; font-size: 16px; border-radius: 5px;">${generatedOTP}</a>
            <p style="font-size: 12px; color: #aaa; margin-top: 30px;">This code is valid for only <strong>10 minutes</strong>.</p>
            <p style="font-size: 12px; color: #aaa; margin-top: 30px;">If you didn't request this, please ignore this email..</p>
          </div>
        </div>
    `,
  });

  req.session.message = "OTP sent to your email. It is valid for 10 minutes.";
  res.redirect("back");
};

// reset password auth
const resetPasswordAdmin = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;
  const admin = await Admin.findOne({ email });

  if (!admin) {
    req.session.message = "Admin not found.";
    return res.redirect("back");
  }

  // Check if the OTP is valid and hasn't expired
  if (admin.otp !== otp) {
    req.session.message = "Invalid OTP.";
    return res.redirect("back");
  }

  if (Date.now() > admin.otpExpiresAt) {
    req.session.message = "OTP has expired.";
    return res.redirect("back");
  }

  // OTP is valid, proceed with password reset
  if (newPassword !== confirmPassword) {
    req.session.message = "Passwords do not match.";
    return res.redirect("back");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  admin.password = hashedPassword;
  await admin.save();

  // Clear OTP from the database after successful reset
  admin.otp = null;
  admin.otpExpiresAt = null;
  await admin.save();

  req.session.message = "Password reset successfully.";
  return res.redirect("/admin/signin");
};

const updateOrderStatus = async (req, res) => {
  try {
    const { order_Id } = req.params;
    const { status } = req.body;

    console.log(
      "Received update request for Order ID:",
      order_Id,
      "with status:",
      status
    );

    if (!order_Id) {
      console.error("Missing order ID in request!");
      return res.status(400).json({ message: "Missing order ID" });
    }

    const order = await Order.findById(order_Id).populate("userId"); // so we can get user's email & name
    console.log("Fetched order from DB:", order);

    if (!order) {
      console.error("Order not found:", order_Id);
      return res.status(404).json({ message: "Order not found" });
    }

    order.status = status;

    if (status === "delivered") {
      order.deliveryDate = new Date();
    }

    await order.save();

    // ✅ Send delivery email if order is delivered
    if (status === "delivered") {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "christophergranville2@gmail.com",
          pass: "kjopewaeanpgfuxv",
        },
      });

      const mailOptions = {
        from: "BUCCI STORE <christophergranville2@gmail.com>",
        to: order.userId.email,
        subject: "📦 Your Bucci Order Has Been Delivered!",
        html: `
          <style>
            .header-logo {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .header-logo img {
                  height: 60px;
                }
          </style>
          <div style="font-family: Arial, sans-serif;">
            <div class="header-logo">
              <img src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" alt="Bucci Logo">
            </div>
            <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 5px rgba(0,0,0,0.1);">
              <h2 style="color: #cc9933;">Hi ${order.userId.fullname},</h2>
              <p>Your order <strong>${
                order.paymentReference
              }</strong> has been <span style="color: green;">delivered</span>.</p>
              <p><strong>Delivery Date:</strong> ${order.deliveryDate.toDateString()}</p>
              <p>We hope you love your items! Thank you for choosing <strong>Bucci</strong>.</p>
              <a href="https://yourwebsite.com/order-details/${
                order._id
              }" style="display:inline-block; margin-top:20px; padding:12px 20px; background:#cc9933; color:white; text-decoration:none; border-radius:6px;">View Order Details</a>
              <p style="margin-top:30px; font-size:12px; color:#888;">If you have any questions, reach out to support.</p>
            </div>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Delivery email sent to", order.userId.email);
    }

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating Order status:", error);
    res.status(500).json({ message: "Error updating Order status" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { order_Id } = req.params;
    console.log("Received request for order:", order_Id); // Debugging log

    const order = await Order.findById(order_Id);
    console.log("Fetched order from database:", order); // Debugging log

    if (!order) {
      console.error("Order not found:", order_Id);
      return res.status(404).json({ message: "Order not found" });
    }

    console.log("Sending order details to frontend.");
    res.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({ message: "Error retrieving order details" });
  }
};
//  get messages

const getMessages = async (req, res) => {
  const { userId } = req.query;
  try {
    const userMessages = await Text.find({ userId }).lean();
    const adminMessages = await AdminMessage.find({ toUserId: userId }).lean();

    res.json({ userMessages, adminMessages });
  } catch (err) {
    console.error("❌ Error fetching messages:", err);
    res.status(500).json({ error: "Failed to load messages" });
  }
};

const markMessageAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const updatedMessages = await Text.updateMany(
      { userId, unread: true }, // Find only unread messages
      { $set: { unread: false } } // Mark them as read
    );

    if (!updatedMessages.modifiedCount) {
      return res.status(404).json({ message: "No unread messages found." });
    }

    res.json({ message: "Messages marked as read." });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ message: "Error updating read status." });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const totalOrders = await Payment.countDocuments();

    const totalSales = await Payment.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]);

    const successfulOrders = await Payment.countDocuments({
      status: "completed",
    });
    const failedPayments = await Payment.countDocuments({ status: "failed" });

    res.json({
      totalPayments: totalOrders,
      totalSales: totalSales[0]?.total || 0,
      successfulPayments: successfulOrders,
      failedPayments,
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
};

const getAverageRating = async (req, res) => {
  try {
    const result = await Review.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
        },
      },
    ]);

    const averageRating = result.length > 0 ? result[0].averageRating : 0;

    res.json({ averageRating: averageRating.toFixed(1) });
  } catch (error) {
    console.error("Error fetching average rating:", error);
    res.status(500).json({ error: "Failed to fetch average rating" });
  }
};

const totalIncome = async (req, res) => {
  try {
    const payments = await Payment.aggregate([
      {
        $match: {
          status: "completed",
          month: { $exists: true, $ne: null },
        },
      },
      {
        $group: {
          _id: "$month",
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    console.log(payments);
    const incomeData = {
      jan: 0,
      feb: 0,
      mar: 0,
      apr: 0,
      may: 0,
      jun: 0,
      jul: 0,
      aug: 0,
      sep: 0,
      oct: 0,
      nov: 0,
      dec: 0,
    };

    payments.forEach((p) => {
      const key = p._id.toLowerCase();
      if (incomeData.hasOwnProperty(key)) {
        incomeData[key] = p.total;
      }
    });

    res.json(incomeData);
  } catch (err) {
    console.error("❌ Error fetching income data:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  adminRegister,
  adminLogin,
  uploadProduct,
  deleteProduct,
  updateProfile,
  changePassword,
  otpAuth,
  resetPasswordAdmin,
  updateOrderStatus,
  getOrderDetails,
  getMessages,
  markMessageAsRead,
  getDashboardStats,
  getAverageRating,
  totalIncome,
};
