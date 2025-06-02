const User = require("../models/user/signupmodel");
const Newsletter = require("../models/user/newsletter");
const bcrypt = require("bcryptjs");
const Text = require("../models/user/myaccountmessage");
const DeliveryAddress = require("../models/user/deliveryaddress");
const Review = require("../models/user/review");
const nodemailer = require("nodemailer");
const Payment = require("../models/user/paymentstatus");
const Order = require("../models/user/order");
const Product = require("../models/admin/uploadproduct");
const mongoose = require("mongoose");

const userRegister = async (req, res) => {
  try {
    const { fullname, email, phone, password } = req.body;

    if (!fullname || !email || !phone || !password) {
      req.session.message = "All fields required";
      return res.status(400).redirect("/signup");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.session.message = "User already exists";
      return res.status(400).redirect("/signup");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullname,
      email,
      phone,
      password: hashedPassword,
    });

    await newUser.save();

    // ✉️ Send welcome email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "christophergranville2@gmail.com",
        pass: "kjopewaeanpgfuxv",
      },
    });

    await transporter.sendMail({
      from: "BUCCI STORE <christophergranville2@gmail.com>", // Change to your verified sender email
      to: email,
      subject: "Welcome to Bucci Store!",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;"> 
          <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 10px; text-align: center;">
          <div>
            <img style="height: 30px;" src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" >
          </div>
            <h2 style="color: #333;">Welcome to Bucci, ${fullname}!</h2>
            <p style="font-size: 16px; color: #666;">Your account has been created successfully.</p>
            <a href="https://yourwebsite.com" style="display: inline-block; margin-top: 20px; padding: 12px 25px; background-color: #cc9933; color: white; text-decoration: none; font-size: 16px; border-radius: 5px;">Start Shopping</a>
            <p style="font-size: 12px; color: #aaa; margin-top: 30px;">If you did not create this account, please ignore this email.</p>
          </div>
        </div>
      `,
    });

    res.status(201).redirect("/login");
  } catch (err) {
    console.error("Error saving user:", err);
    req.session.message = "No internet connection";
    res.status(500).redirect("/signup");
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.session.message = "Email and password are required";
      return res.redirect("/login");
    }

    const user = await User.findOne({ email });

    if (!user) {
      req.session.message = "Invalid email or password";
      return res.redirect("/login");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.session.message = "Invalid email or password";
      return res.redirect("/login");
    }

    user.password = "";

    // ✅ **Store user session**
    req.session.userId = user._id;
    req.session.user = user;
    req.session.message = "Login successful";
    res.redirect("/shop");
  } catch (error) {
    console.error("Login error:", error);
    req.session.message = "No internet connection";
    res.redirect("/login");
  }
};

const newsletterRegister = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the email already exists in the database
    const existingEmail = await Newsletter.findOne({ email });

    if (existingEmail) {
      req.session.message = "You are already subscribed!";
      return res.redirect("/");
    }

    // If email doesn't exist, save it
    const newNewsletter = new Newsletter({ email });

    await newNewsletter.save();
    req.session.message = "Subscription successful!";
    res.status(201).redirect("/");
  } catch (error) {
    console.error(error);
    req.session.message = "Something went wrong. Please try again.";
    res.status(500).redirect("/");
  }
};

const submitMessage = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).send("Unauthorized");
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).send("Message cannot be empty");
    }

    const user = await User.findById(req.session.userId);
    if (!user) {
      return res.status(404).send("User not found");
    }

    await Text.create({
      userId: user._id,
      fullname: user.fullname,
      email: user.email,
      text,
    });
    // Empty response to avoid page reload
    return res.status(200).send("message sent");
  } catch (error) {
    console.error("Error submitting message:", error);
    return res.status(500).end(); // Empty end on server error
  }
};

// Controller for registering a delivery address

const registerDeliveryAddress = async (req, res) => {
  try {
    const { houseNumber, street, town, city, state, postalCode, landmark } =
      req.body;

    // Validate required fields
    if (!houseNumber || !street || !town || !city || !state || !postalCode) {
      req.session.message = "All required fields must be filled.";
      return res.redirect("/myaccount");
    }

    // Fetch user data from session
    const user = req.session.user;
    if (!user || !user.email) {
      req.session.message = "User is not logged in.";
      return res.redirect("/login");
    }

    const { email, fullname } = user;

    // Remove existing addresses and save the new address
    await DeliveryAddress.deleteMany({ userId: req.session.userId });

    const newAddress = new DeliveryAddress({
      userId: req.session.userId,
      houseNumber: houseNumber.trim(),
      street: street.trim(),
      town: town.trim(),
      city: city.trim(),
      state: state.trim(),
      postalCode: postalCode.trim(),
      landmark: landmark ? landmark.trim() : null,
    });

    const savedAddress = await newAddress.save();
    console.log("Saved address:", savedAddress);

    // Update payments with new shipping address
    const updatedShippingAddress = `${houseNumber}, ${street}, ${town}, ${city}, ${state}, ${postalCode}`;
    await Payment.updateMany(
      {
        userId: req.session.userId,
        shippingAddress: "No shipping address uploaded.",
      },
      { $set: { shippingAddress: updatedShippingAddress } }
    );

    // Send confirmation email
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "christophergranville2@gmail.com", // Replace with your Gmail address
        pass: "kjopewaeanpgfuxv", // Use Gmail App Password for secure authentication
      },
      debug: true,
      logger: true,
    });
    const mailOptions = {
      from: "BUCCI STORE <christophergranville2@gmail.com>",
      to: email,
      subject: "Shipping Address Updated Successfully",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: Arial, sans-serif;
                background-color: #f9f9f9;
                margin: 0;
                padding: 0;
              }
              .email-container {
                max-width: 600px;
                margin: auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
              }
              .header-logo img {
                height: 50px;
              }
              .action-button {
                display: inline-block;
                margin-top: 20px;
                padding: 12px 25px;
                background-color: #cc9933;
                color: white;
                text-decoration: none;
                font-size: 16px;
                border-radius: 5px;
              }
              .footer {
                font-size: 12px;
                color: #aaa;
                margin-top: 30px;
              }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="header-logo">
                <img src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" alt="Bucci Logo">
              </div>
              <h2>Hello, ${fullname}!</h2>
              <p>Your shipping address has been updated successfully:</p>
              <p>${updatedShippingAddress}</p>
              <br>
              <a href="https://yourwebsite.com" class="action-button">Shop Now</a>
              <p class="footer">If you didn’t make this change, please contact our support team immediately.</p>
            </div>
          </body>
        </html>
      `,
    };

    const emailResult = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", emailResult);

    req.session.message =
      "Address added/updated successfully, and confirmation email sent!";
    res.status(201).redirect("/myaccount");
  } catch (error) {
    console.error(
      "Error while saving/updating address or sending email:",
      error
    );
    req.session.message = "Something went wrong. Please try again.";
    res.status(500).redirect("/myaccount");
  }
};

// post review
const postReview = async (req, res) => {
  const user = req.session.user;
  if (!user) {
    req.session.message = "You must be logged in to post a review.";
    return res.redirect("back");
  }

  const { productId, rating, text } = req.body;

  try {
    const newReview = new Review({
      product: productId,
      rating: parseInt(rating),
      text,
      user: user._id,
    });

    await newReview.save();

    req.session.message = "Review posted successfully!";
    res.redirect(`/product/${productId}#reviews`);
  } catch (err) {
    console.error("Error saving review:", err);
    req.session.message = "Something went wrong. Please try again.";
    res.redirect(`/product/${productId}`);
  }
};

const Logout = async (req, res) => {
  const user = req.session.user;

  if (user) {
    session.destroy();
    return res.redirect("/");
  }
};

function getCurrentMonthAbbreviation() {
  const monthNames = [
    "jan",
    "feb",
    "mar",
    "apr",
    "may",
    "jun",
    "jul",
    "aug",
    "sep",
    "oct",
    "nov",
    "dec",
  ];
  const currentDate = new Date();
  const monthIndex = currentDate.getMonth();
  return monthNames[monthIndex];
}


const createPayment = async (req, res) => {
  try {
    // Ensure the user is logged in
    if (!req.session.userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized. Please log in to create an order." });
    }

    const { items, totalAmount, shippingAddress: deliveryAddressId } = req.body; 

    const user = req.session.user;

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!deliveryAddressId || !mongoose.Types.ObjectId.isValid(deliveryAddressId)) {
      return res.status(400).json({ error: "Invalid or missing shipping address ID." });
    }

    const deliveryAddress = await DeliveryAddress.findOne({ _id: deliveryAddressId, userId: req.session.userId });
    if (!deliveryAddress) {
        return res.status(404).json({ error: "Selected delivery address not found or does not belong to user." });
    }

    // Create a new payment
    const newPayment = await Payment.create({
      userId: req.session.userId,
      fullname: user.fullname,
      items: items,
      totalAmount: totalAmount,
      month: getCurrentMonthAbbreviation(),
      shippingAddress: deliveryAddressId,
      status: "pending",
    });

    console.log("Payment created successfully:", newPayment);

    res.json({
      paymentId: newPayment._id,
      email: user?.email || null,
    });
  } catch (err) {
    console.error("Error creating payment:", err);
    res.status(500).json({ error: "Failed to create payment. Please check server logs for details." });
  }
};


// Update Payment Status
const updatePaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, paymentReference } = req.body;

    console.log(
      "Received update request for Payment ID:",
      paymentId,
      "with status:",
      status
    );

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Update payment status
    payment.status = status;
    if (paymentReference) {
      payment.paymentReference = paymentReference;
    }
    await payment.save();

    console.log("Payment updated successfully:", payment);
    if (status === "failed") {
      const user = await User.findById(payment.userId);
      if (user) {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "christophergranville2@gmail.com",
            pass: "kjopewaeanpgfuxv",
          },
        });
    
        const mailOptions = {
          from: "BUCCI STORE <christophergranville2@gmail.com>",
          to: user.email,
          subject: "⚠️ Payment Failed - Bucci Store",
          html: `
            <!DOCTYPE html>
              <html>
                <head>
                  <style>
                    body {
                      font-family: Georgia, serif;
                      background-color: #f4f4f4;
                      margin: 0;
                      padding: 0;
                    }
                    .email-container {
                      max-width: 650px;
                      margin: 30px auto;
                      background: #ffffff;
                      border-radius: 12px;
                      box-shadow: 0 0 15px rgba(0,0,0,0.1);
                      padding: 40px 50px;
                      color: #333;
                    }
                    .header-logo {
                      text-align: center;
                      margin-bottom: 30px;
                    }
                    .header-logo img {
                      height: 60px;
                    }
                    h2 {
                      color: #a87e1a;
                      margin-bottom: 25px;
                      font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
                    }
                    p {
                      font-size: 16px;
                      line-height: 1.7;
                      color: #555;
                    }
                    .highlight {
                      font-weight: bold;
                      color: #a87e1a;
                    }
                    table {
                      width: 100%;
                      border-collapse: collapse;
                      margin-top: 30px;
                      margin-bottom: 30px;
                      font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
                    }
                    th, td {
                      padding: 14px 15px;
                      border: 1px solid #ddd;
                      text-align: left;
                    }
                    th {
                      background-color: #f0e6b5;
                      color: #8c7b00;
                      font-weight: 600;
                    }
                    tr:nth-child(even) {
                      background-color: #fcf9e6;
                    }
                    .footer {
                      font-size: 13px;
                      color: #999;
                      text-align: center;
                      margin-top: 50px;
                      font-style: italic;
                    }
                    .button {
                      display: inline-block;
                      background-color: #a87e1a;
                      color: white !important;
                      padding: 12px 30px;
                      border-radius: 6px;
                      text-decoration: none;
                      font-weight: 700;
                      font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;
                      margin-top: 25px;
                      box-shadow: 0 4px 8px rgba(168, 126, 26, 0.4);
                    }
                    .button:hover {
                      background-color: #d4b94f;
                      box-shadow: 0 6px 12px rgba(212, 185, 79, 0.6);
                    }
                  </style>
                </head>
                <body>
                  <div class="email-container">
                    <div class="header-logo">
                      <img src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" alt="Bucci Logo" />
                    </div>
                    <h2>Failed Payment Notification</h2>
                    <p>Hello <span class="highlight">${user.fullname}</span>,</p>
                    <p>We noticed that your payment attempt for <span class="highlight">₦${payment.totalAmount}</span> has <strong style="color: #d9534f;">failed</strong>.</p>
                    <p>Please review the items below from your attempted purchase:</p>

                    <table>
                      <thead>
                        <tr>
                          <th>Cloth Name</th>
                          <th>Amount (₦)</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${payment.items.map(item => `
                          <tr>
                            <td>${item.name || 'Item Name'}</td>
                            <td>${item.price || '0'}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                        
                    <p>If you’d like, please try your payment again or get in touch with our support team for help.</p>
                    <p><strong>Payment Reference:</strong> <span class="highlight">${paymentReference}</span></p>
                    <a href="https://yourwebsite.com/support" class="button">Contact Support</a>
                    <p class="footer">Thank you for shopping with Bucci. We appreciate your business!</p>
                  </div>
                </body>
              </html>                     
          `,
        };
    
        await transporter.sendMail(mailOptions);
        console.log("❌ Payment failure email sent to", user.email);
      }
    }
    
    // Create new order ONLY if payment is completed
    if (status === "completed") {
      console.log("Creating order for payment:", payment._id);

      const user = await User.findById(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found." });
      }

      const newOrder = new Order({
        userId: payment.userId,
        fullname: user.fullname,
        shippingAddress: payment.shippingAddress,
        items: payment.items,
        totalAmount: payment.totalAmount,
        paymentId: payment._id,
        deliveryDate: null,
        status: "pending_delivery",
        paymentReference: paymentReference,
      });

      await newOrder.save();
      console.log("Order saved successfully:", newOrder);
      const userEmail = user.email;
      const paymentDate = new Date().toDateString();
      const estimatedDelivery = "2 - 5 business days";
      const orderId = newOrder._id;

      let productDetailsHTML = "";
      for (const item of payment.items) {
        const product = await Product.findById(item.itemId);
        if (product) {
          productDetailsHTML += `
          <tr>
            <td>${product.product_name}</td>
            <td>${item.quantity}</td>
            <td>₦${product.price}</td>
          </tr>`;
        }
      }

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "christophergranville2@gmail.com",
          pass: "kjopewaeanpgfuxv",
        },
        debug: true,
        logger: true,
      });

      const mailOptions = {
        from: "BUCCI STORE <christophergranville2@gmail.com>",
        to: userEmail,
        subject: "🧾 Your Bucci Store Payment Receipt",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  background-color: #f4f4f4;
                  margin: 0;
                  padding: 0;
                }
                .email-container {
                  max-width: 650px;
                  margin: 30px auto;
                  background: #ffffff;
                  border-radius: 12px;
                  box-shadow: 0 0 10px rgba(0,0,0,0.08);
                  padding: 40px;
                }
                .header-logo {
                  text-align: center;
                  margin-bottom: 20px;
                }
                .header-logo img {
                  height: 60px;
                }
                h2 {
                  color: #333;
                }
                p {
                  font-size: 15px;
                  color: #444;
                }
                table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-top: 25px;
                  margin-bottom: 25px;
                }
                th, td {
                  padding: 12px;
                  border: 1px solid #ddd;
                  text-align: left;
                }
                th {
                  background-color: #f8f8f8;
                }
                .info {
                  margin: 20px 0;
                }
                .track-button {
                  display: inline-block;
                  padding: 12px 25px;
                  background-color: #cc9933;
                  color: white;
                  text-decoration: none;
                  font-size: 16px;
                  border-radius: 5px;
                }
                .footer {
                  font-size: 12px;
                  color: #999;
                  text-align: center;
                  margin-top: 40px;
                }
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="header-logo">
                  <img src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" alt="Bucci Logo">
                </div>
                <h2>Hello, ${user.fullname}!</h2>
                <p>Thank you for shopping with Bucci. Below is your payment receipt:</p>

                <div class="info">
                  <p><strong>Order ID:</strong> ${orderId}</p>
                  <p><strong>Payment Reference:</strong> ${payment.paymentReference}</p>
                  <p><strong>Payment Date:</strong> ${paymentDate}</p>
                  <p><strong>Total Amount Paid:</strong> ₦${payment.totalAmount}</p>
                  <p><strong>Delivery Address:</strong> ${payment.shippingAddress}</p>
                  <p><strong>Estimated Delivery:</strong> ${estimatedDelivery}</p>
                </div>

                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Price (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${productDetailsHTML}
                  </tbody>
                </table>

                <a href="https://yourwebsite.com/track-order/${orderId}" class="track-button">Track My Order</a>

                <p class="footer">If you have any questions, please reach out to our support team.<br>Thank you for choosing Bucci!</p>
              </div>
            </body>
          </html>
          `,
      };

      await transporter.sendMail(mailOptions);
      console.log("✅ Payment receipt email sent to", userEmail);

      // 🔽 Deduct product quantity and delete if less than 1
      for (const item of payment.items) {
        const product = await Product.findById(item.itemId);
        if (product) {
          const quantityToDeduct = item.quantity || 1;
          product.quantity = product.quantity - quantityToDeduct;

          if (product.quantity < 1) {
            await Product.findByIdAndDelete(product._id);
            console.log(
              `Product ${product.product_name} deleted as quantity dropped below 1.`
            );
          } else {
            await product.save();
            console.log(
              `Product ${product.product_name} quantity reduced by ${quantityToDeduct}. New quantity: ${product.quantity}`
            );
          }
        } else {
          console.warn(
            `Product with ID ${item.itemId} not found for deduction.`
          );
        }
      }
    }

    res.json({ message: "Payment status updated successfully", payment });
  } catch (error) {
    console.error("Error updating Payment status:", error);
    res.status(500).json({ message: "Error updating Payment status" });
  }
};

const otpAuthUser = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.session.message = "User not found";
    return res.redirect("back");
  }

  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP and expiry to database
  user.otp = generatedOTP;
  user.otpExpiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

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
const resetPasswordUser = async (req, res) => {
  const { email, otp, newPassword, confirmPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.session.message = "User not found.";
    return res.redirect("back");
  }

  // Check if the OTP is valid and hasn't expired
  if (user.otp !== otp) {
    req.session.message = "Invalid OTP.";
    return res.redirect("back");
  }

  if (Date.now() > user.otpExpiresAt) {
    req.session.message = "OTP has expired.";
    return res.redirect("back");
  }

  // OTP is valid, proceed with password reset
  if (newPassword !== confirmPassword) {
    req.session.message = "Passwords do not match.";
    return res.redirect("back");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;

  // Clear OTP
  user.otp = null;
  user.otpExpiresAt = null;

  await user.save();

  // ✉️ Send password change confirmation email
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "christophergranville2@gmail.com",
      pass: "kjopewaeanpgfuxv",
    },
  });

  const mailOptions = {
    from: "BUCCI STORE <christophergranville2@gmail.com>",
    to: user.email,
    subject: "🔐 Your Bucci Account Password Was Changed",
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: white; border-radius: 8px; padding: 30px; text-align: center;">
          <img src="https://res.cloudinary.com/dqz5ahhin/image/upload/v1745713676/Screenshot_2025-04-26_171243_kwninf.png" style="height: 50px; margin-bottom: 20px;">
          <h2 style="color: #cc9933;">Password Changed Successfully</h2>
          <p style="color: #333;">Hi ${user.fullname || ""}, your Bucci Store account password has been updated.</p>
          <p style="font-size: 14px; color: #777;">If this wasn't you, please reset your password immediately or contact support.</p>
          <a href="https://yourwebsite.com/login" style="display:inline-block; margin-top:20px; padding:12px 20px; background:#cc9933; color:white; text-decoration:none; border-radius:6px;">Login Now</a>
          <p style="margin-top:30px; font-size:12px; color:#aaa;">Thank you for choosing Bucci Store.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Password change email sent.");
  } catch (err) {
    console.error("Failed to send password change email:", err.message);
  }

  req.session.message = "Password reset successfully.";
  return res.redirect("/login");
};
module.exports = {
  userRegister,
  userLogin,
  newsletterRegister,
  submitMessage,
  registerDeliveryAddress,
  postReview,
  Logout,
  createPayment,
  updatePaymentStatus,
  otpAuthUser,
  resetPasswordUser,
};
