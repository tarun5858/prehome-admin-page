import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to config.json
const CONFIG_PATH = path.join(__dirname, "..", "config.json");


function readConfig() {
  const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
  return JSON.parse(raw);
}

function writeConfig(obj) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2), "utf-8");
}

// OTP store (in-memory). Structure: { "<email>": { otp, expiresAt } }
const otpStore = new Map();

// Helper to generate 6-digit OTP
function generateOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min)));
}

// Ensure config password is hashed on startup (call this once on require)
async function ensureHashedPassword() {
  const cfg = readConfig();
  if (!cfg.password) {
    throw new Error("No password set in config.json");
  }
  // if already bcrypt hash (starts with $2), skip
  if (!cfg.password.startsWith("$2")) {
    const hashed = await bcrypt.hash(cfg.password, 10);
    cfg.password = hashed;
    writeConfig(cfg);
    console.log("Hashed config.json password on startup.");
  }
}
ensureHashedPassword().catch(err => console.error("Error hashing password:", err));

// -------------------- ROUTES --------------------

// Admin login: returns JWT
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const cfg = readConfig();
    if (!email || !password) return res.status(400).json({ message: "Email and password required" });
    if (email !== cfg.superAdminEmail) return res.status(401).json({ message: "Invalid credentials" });
    const ok = await bcrypt.compare(password, cfg.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ 1. Request OTP
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    const cfg = readConfig();

    if (!email) return res.status(400).json({ message: "Email required" });
    if (email !== cfg.superAdminEmail)
      return res.status(400).json({ message: "Email not recognized" });

    const otp = generateOtp(6);
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
    otpStore.set(email, { otp, expiresAt });

    await sendEmail({
      to: email,
      subject: "OTP for Super Admin Password Reset",
      html: `
        <p>Dear Super Admin,</p>
        <p>Your OTP for password reset is:</p>
        <h2>${otp}</h2>
        <p>This OTP is valid for 10 minutes.</p>
      `,
    });

    return res.json({ message: "OTP sent to super admin email" });

  } catch (err) {
    console.error("request-reset error:", err);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
});


// ✅ 2. Verify OTP
router.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP required" });

  const entry = otpStore.get(email);

  if (!entry) return res.status(400).json({ message: "No OTP requested for this email" });

  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ message: "OTP expired" });
  }

  if (entry.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

  const resetToken = jwt.sign(
    { email, purpose: "reset" },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );

  otpStore.delete(email);

  return res.json({ resetToken, message: "OTP verified" });
});


// ✅ 3. Reset Password
router.post("/reset-password", async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword)
      return res.status(400).json({ message: "resetToken & newPassword required" });

    let payload;
    try {
      payload = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: "Invalid/Expired reset token" });
    }

    if (payload.purpose !== "reset")
      return res.status(400).json({ message: "Invalid token purpose" });

    const cfg = readConfig();
    const hashed = await bcrypt.hash(newPassword, 10);
    cfg.password = hashed;
    writeConfig(cfg);

    return res.json({ message: "Password reset successfully" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// Example protected route
router.get("/protected", (req, res) => {
  res.json({ message: "This is protected route example" });
});

export default router;
