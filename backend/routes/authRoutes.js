// import express from "express";
// import path from "path";
// import { fileURLToPath } from "url";
// import fs from "fs";
// import jwt from "jsonwebtoken";
// import bcrypt from "bcrypt";
// import { sendEmail } from "../utils/sendEmail.js";

// const router = express.Router();

// // Fix __dirname in ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Path to config.json
// const CONFIG_PATH = path.join(__dirname, "..", "config.json");


// function readConfig() {
//   const raw = fs.readFileSync(CONFIG_PATH, "utf-8");
//   return JSON.parse(raw);
// }

// function writeConfig(obj) {
//   fs.writeFileSync(CONFIG_PATH, JSON.stringify(obj, null, 2), "utf-8");
// }

// // OTP store (in-memory). Structure: { "<email>": { otp, expiresAt } }
// const otpStore = new Map();

// // Helper to generate 6-digit OTP
// function generateOtp(length = 6) {
//   const min = Math.pow(10, length - 1);
//   const max = Math.pow(10, length) - 1;
//   return String(Math.floor(min + Math.random() * (max - min)));
// }

// // Ensure config password is hashed on startup (call this once on require)
// async function ensureHashedPassword() {
//   const cfg = readConfig();
//   if (!cfg.password) {
//     throw new Error("No password set in config.json");
//   }
//   // if already bcrypt hash (starts with $2), skip
//   if (!cfg.password.startsWith("$2")) {
//     const hashed = await bcrypt.hash(cfg.password, 10);
//     cfg.password = hashed;
//     writeConfig(cfg);
//     console.log("Hashed config.json password on startup.");
//   }
// }
// ensureHashedPassword().catch(err => console.error("Error hashing password:", err));

// // -------------------- ROUTES --------------------

// // Admin login: returns JWT
// router.post("/login", async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     const cfg = readConfig();
//     if (!email || !password) return res.status(400).json({ message: "Email and password required" });
//     if (email !== cfg.superAdminEmail) return res.status(401).json({ message: "Invalid credentials" });
//     const ok = await bcrypt.compare(password, cfg.password);
//     if (!ok) return res.status(401).json({ message: "Invalid credentials" });

//     const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });
//     res.json({ token });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// });

// // ✅ 1. Request OTP
// router.post("/request-reset", async (req, res) => {
//   try {
//     const { email } = req.body;
//     const cfg = readConfig();

//     if (!email) return res.status(400).json({ message: "Email required" });
//     if (email !== cfg.superAdminEmail)
//       return res.status(400).json({ message: "Email not recognized" });

//     const otp = generateOtp(6);
//     const expiresAt = Date.now() + 10 * 60 * 1000; // 10 min
//     otpStore.set(email, { otp, expiresAt });

//     await sendEmail({
//       to: email,
//       subject: "OTP for Super Admin Password Reset",
//       html: `
//         <p>Dear Super Admin,</p>
//         <p>Your OTP for password reset is:</p>
//         <h2>${otp}</h2>
//         <p>This OTP is valid for 10 minutes.</p>
//       `,
//     });

//     return res.json({ message: "OTP sent to super admin email" });

//   } catch (err) {
//     console.error("request-reset error:", err);
//     return res.status(500).json({ message: "Failed to send OTP" });
//   }
// });


// // ✅ 2. Verify OTP
// router.post("/verify-otp", (req, res) => {
//   const { email, otp } = req.body;

//   if (!email || !otp)
//     return res.status(400).json({ message: "Email and OTP required" });

//   const entry = otpStore.get(email);

//   if (!entry) return res.status(400).json({ message: "No OTP requested for this email" });

//   if (Date.now() > entry.expiresAt) {
//     otpStore.delete(email);
//     return res.status(400).json({ message: "OTP expired" });
//   }

//   if (entry.otp !== otp) return res.status(400).json({ message: "Invalid OTP" });

//   const resetToken = jwt.sign(
//     { email, purpose: "reset" },
//     process.env.JWT_SECRET,
//     { expiresIn: "10m" }
//   );

//   otpStore.delete(email);

//   return res.json({ resetToken, message: "OTP verified" });
// });


// // ✅ 3. Reset Password
// router.post("/reset-password", async (req, res) => {
//   try {
//     const { resetToken, newPassword } = req.body;

//     if (!resetToken || !newPassword)
//       return res.status(400).json({ message: "resetToken & newPassword required" });

//     let payload;
//     try {
//       payload = jwt.verify(resetToken, process.env.JWT_SECRET);
//     } catch (err) {
//       return res.status(400).json({ message: "Invalid/Expired reset token" });
//     }

//     if (payload.purpose !== "reset")
//       return res.status(400).json({ message: "Invalid token purpose" });

//     const cfg = readConfig();
//     const hashed = await bcrypt.hash(newPassword, 10);
//     cfg.password = hashed;
//     writeConfig(cfg);

//     return res.json({ message: "Password reset successfully" });

//   } catch (err) {
//     return res.status(500).json({ message: err.message });
//   }
// });

// // Example protected route
// router.get("/protected", (req, res) => {
//   res.json({ message: "This is protected route example" });
// });

// export default router;



// backend/routes/authRoutes.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises"; // promise-based fs
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// safe __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: load admin config safely (no throw on import)
const loadAdminConfig = async () => {
  // Priority: environment variables
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;

  if (ADMIN_USER && ADMIN_PASS_HASH) {
    return { adminEmail: ADMIN_USER, passwordHash: ADMIN_PASS_HASH };
  }

  // Fallback: try config.json if present (but don't crash if missing)
  try {
    const cfgPath = path.join(__dirname, "..", "config.json");
    const raw = await fs.readFile(cfgPath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      adminEmail: parsed.superAdminEmail || parsed.adminEmail || null,
      passwordHash: parsed.password || parsed.passwordHash || null,
    };
  } catch (err) {
    // silent fallback
    return { adminEmail: null, passwordHash: null };
  }
};

// Helper: generate JWT
const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_THIS_SECRET";
const signToken = (payload, opts = { expiresIn: "6h" }) =>
  jwt.sign(payload, JWT_SECRET, opts);

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, message: "Username and password required" });

    // Attempt to find admin/user from config/env
    const cfg = await loadAdminConfig();
    const adminEmail = cfg.adminEmail;
    const adminHash = cfg.passwordHash;

    // If admin credentials present in config/env, check them
    if (adminEmail && adminHash && (username === adminEmail || username === adminEmail.split('@')[0])) {
      const isMatch = await bcrypt.compare(password, adminHash);
      if (isMatch) {
        const token = signToken({ username: adminEmail });
        return res.json({ success: true, token });
      } else {
        return res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    }

    // If you have a DB-based User model, you can implement lookup here.
    // Example (uncomment & adjust if you have User model available):
    // const user = await User.findOne({ username });
    // if (user && await bcrypt.compare(password, user.password)) { ... }

    return res.status(401).json({ success: false, message: "Invalid credentials" });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/auth/request-reset
// Body: { email }  -> creates a short token and (optionally) triggers email
router.post("/request-reset", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    // Create a short-lived reset token (do not include sensitive info)
    const resetToken = signToken({ email }, { expiresIn: "15m" });

    // Attempt to send email (sendEmail might be a no-op in your current setup)
    try {
      await sendEmail({
        to: email,
        subject: "Password reset",
        html: `Use this token to reset your password: ${resetToken} (expires in 15 minutes)`,
      });
    } catch (emailErr) {
      // don't fail the request if sendEmail is not configured
      console.warn("sendEmail failed (ignored):", emailErr?.message || emailErr);
    }

    return res.json({ success: true, message: "Reset token generated", resetToken });
  } catch (err) {
    console.error("request-reset error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;

