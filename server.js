const express = require("express");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(express.json());
const PORT = 5000; // Backend server will run on this port

const EMAIL_USER = "awaiskhalique844@gmail.com";
const EMAIL_PASS = "vilm ombh jjqu tyil";

// MongoDB URI
const dbURI =
  "mongodb+srv://realahmedali4:nrhdpOBM6jvWapzy@futurebali-cluster.cyora.mongodb.net/futurebali?retryWrites=true&w=majority&appName=futurebali-cluster";

// MongoDB Connection
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Middleware
app.use(cors());
app.use(bodyParser.json());

// User Schema
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    name: String,
    email: String,
    occupation: String,
    firstname: String,
    lastname: String,
    phone: String,
  })
);

// CardDetails Schema
const CardDetails = mongoose.model(
  "CardDetails",
  new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phone: String,
    country: String,
    address: String,
    additionalDetails: String,
  })
);

// Endpoint for sending OTP
app.post("/send-otp", async (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res
      .status(400)
      .json({ success: false, message: "Name and email are required." });
  }

  // Generate a random 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      user = new User({ name, email, occupation: "" });
      await user.save();
      isNewUser = true;
    }

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Hi ${name},\n\nYour OTP code is: ${otp}\n\nThank you!`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      success: true,
      otp,
      user: { name: user.name, occupation: user.occupation, isNewUser },
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, message: "Failed to send OTP." });
  }
});

// Endpoint to check user
app.post("/check-user", async (req, res) => {
  const { name, email } = req.body;

  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      const previousName = existingUser.name;

      if (previousName !== name) {
        existingUser.name = name;
        await existingUser.save();

        return res.status(200).json({
          exists: true,
          updatedName: true,
          message: `Your name has been updated from ${previousName} to ${name}.`,
        });
      } else {
        return res.status(200).json({
          exists: true,
          updatedName: false,
          message: `Welcome back, ${name}!`,
        });
      }
    } else {
      return res.status(200).json({
        exists: false,
        message: "New user registered successfully.",
      });
    }
  } catch (error) {
    console.error("Error checking user:", error);
    res.status(500).json({ success: false, message: "Error checking user" });
  }
});

// Endpoint to update account details
app.post("/update-account-details", async (req, res) => {
  const { email, firstname, lastname, phone } = req.body;

  if (!email || !firstname || !lastname || !phone) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required." });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    user.firstname = firstname;
    user.lastname = lastname;
    user.phone = phone;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Account details updated successfully!",
    });
  } catch (error) {
    console.error("Error updating account details:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update account details." });
  }
});

// Create or Update Card Details
app.post("/card-details", async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    country,
    address,
    additionalDetails,
  } = req.body;

  try {
    const existingCard = await CardDetails.findOne({ email });

    if (existingCard) {
      existingCard.firstName = firstName;
      existingCard.lastName = lastName;
      existingCard.phone = phone;
      existingCard.country = country;
      existingCard.address = address;
      existingCard.additionalDetails = additionalDetails;

      await existingCard.save();
      return res
        .status(200)
        .json({ message: "Card details updated successfully!" });
    } else {
      const newCard = new CardDetails({
        firstName,
        lastName,
        email,
        phone,
        country,
        address,
        additionalDetails,
      });

      await newCard.save();
      return res
        .status(201)
        .json({ message: "Card details added successfully!" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Internal server error", error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
