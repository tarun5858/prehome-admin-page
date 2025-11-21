
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();
const otpStore = {}; // In-memory OTP store for testing
import { getAdminCredentials, updateAdminPassword } from "../utils/adminConfig.js";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";

const signToken = (payload, opts = { expiresIn: "6h" }) =>
  jwt.sign(payload, JWT_SECRET, opts);


// -------- Login --------
// router.post("/login", async (req, res) => {
//   const { username, password } = req.body;
//   if (!username || !password) return res.status(400).json({ message: "Username & password required" });

//   const adminEmail = process.env.ADMIN_USER;
//   const adminHash = process.env.ADMIN_PASS_HASH;

//   if (username === adminEmail || username === adminEmail.split("@")[0]) {
//     const isMatch = await bcrypt.compare(password, adminHash);
//     if (isMatch) return res.json({ token: signToken({ username: adminEmail }) });
//     return res.status(401).json({ message: "Invalid credentials" });
//   }

//   return res.status(401).json({ message: "Invalid credentials" });
// });
// router.post("/login", async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     if (!username || !password)
//       return res.status(400).json({ message: "Username & password required" });

//     // Load the latest admin credentials (including updated hash)
//     const { adminUser, adminPassHash } = getAdminCredentials();

//     console.log("🔍 Loaded ADMIN_USER:", adminUser);
// console.log("🔍 Loaded HASH:", adminPassHash);

//     // Match by full email or username before '@'
//     if (adminUser && (username === adminUser || username === adminUser.split("@")[0])) {
//       const isMatch = await bcrypt.compare(password, adminPassHash);
//       if (isMatch) {
//         const token = signToken({ username: adminUser });
//         return res.json({ success: true, token });
//       } else {
//         return res.status(401).json({ success: false, message: "Invalid credentials" });
//       }
//     }

//     return res.status(401).json({ success: false, message: "Invalid credentials" });
//   } catch (err) {
//     console.error("Login error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // TEMPORARY BYPASS — REMOVE LATER
  if (username === "admin" && password === "admin123") {
    return res.json({ success: true, token: "temp-dev-token" });
  }

  return res.status(401).json({ error: "Invalid credentials" });
});


// -------- Request OTP --------
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    otpStore[email] = otp;

    //  Always log OTP locally for development
    console.log(` Generated OTP for ${email}: ${otp}`);
    // Try sending email (optional)
    try {
      await sendEmail({
        to: email,
        subject: "Your OTP for Password Reset",
        html: `<p>Your OTP is <strong>${otp}</strong></p>`,
      });

    } catch (emailErr) {
      console.warn("Email sending failed (ignored in dev):", emailErr.message);
    }
// return res.json({
//   message: "OTP sent successfully",
//   devOtp: process.env.NODE_ENV === "development" ? otp : undefined,
// });
return res.json({
  message: "OTP sent successfully",
  devOtp: otp, // always send OTP in response for local testing
});
  } catch (err) {
    console.error(" Request-reset error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

// -------- Verify OTP --------
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP required" });

  if (parseInt(otp) === otpStore[email]) {
    const resetToken = signToken({ email }, { expiresIn: "10m" });
    return res.json({ message: "OTP verified", resetToken });
  }

  return res.status(400).json({ message: "Invalid OTP" });
});

// -------- Reset Password --------
router.post("/reset-password", async (req, res) => {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword)
    return res.status(400).json({ message: "Token & new password required" });

  try {
    const payload = jwt.verify(resetToken, JWT_SECRET);
    const email = payload.email?.trim().toLowerCase();
    const adminEmail = process.env.ADMIN_USER?.trim().toLowerCase();

    console.log("🧩 Reset attempt for:", email, "Expected admin:", adminEmail);

    if (email === adminEmail) {
      const hash = await bcrypt.hash(newPassword, 10);
      process.env.ADMIN_PASS_HASH = hash; // updates live in memory

      console.log("✅ Admin password updated successfully");
      return res.json({ message: "Password reset successful" });
    }

    console.warn("❌ Unknown user tried to reset:", email);
    return res.status(400).json({ message: "Unknown user" });
  } catch (err) {
    console.error("Reset-password error:", err.message);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
});
export default router;

