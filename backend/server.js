import './cron-ping.js';
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
// import multer from "multer";
import path from "path";
// import fs from "fs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import slugify from "slugify";

// IMPORT SCHEMAS (Ensure these exports match your model files)
// If your model files export default models, use them as schemas below
import BlogSchema from './models/Blog.js'; 
import ExpertSessionSchema from './models/ExpertSession.js';
import GeneralInquirySchema from './models/GeneralInquiry.js';
import LeadSchema from './models/WebsiteLead.js';

dotenv.config();

const app = express();
// const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI; 
const JWT_SECRET = process.env.JWT_SECRET || "fallbackSecretKey";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;

// --- CORS ---
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://manage-blogs.onrender.com"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));



// 1. Clean the base URI to ensure we don't have trailing slashes or existing DB names
const BASE_URI = process.env.MONGO_URI.split('?')[0]; // Gets everything before '?'
const URI_PARAMS = process.env.MONGO_URI.includes('?') ? `?${process.env.MONGO_URI.split('?')[1]}` : "";

if (BASE_URI.endsWith('/')) {
  var FINAL_BASE = BASE_URI.slice(0, -1);
} else {
  // If the URI contains a DB name already (like in your old .env), 
  // we need to strip it to get the pure cluster URL
  const parts = BASE_URI.split('/');
  var FINAL_BASE = parts.slice(0, 3).join('/'); // This gets mongodb+srv://cluster.net
}

// 2. Setup Connections with Explicit DB names
const blogConn = mongoose.createConnection(`${FINAL_BASE}/dynamic-website-blogs${URI_PARAMS}`);
const formsConn = mongoose.createConnection(`${FINAL_BASE}/website_forms${URI_PARAMS}`);;

// --- 2. INITIALIZE MODELS ON SPECIFIC CONNECTIONS ---
// We use 'BlogModel' and 'LeadModel' to avoid naming conflicts with imports
const BlogModel = blogConn.model('Blog', BlogSchema, 'dynamic_blogs');

const WebsiteLead = formsConn.model('WebsiteLead', LeadSchema, 'waitlist_leads');
const GeneralInquiry = formsConn.model('GeneralInquiry', GeneralInquirySchema, 'general_inquiries');
const ExpertSession = formsConn.model('ExpertSession', ExpertSessionSchema, 'expert_session_bookings');

// --- AUTH MIDDLEWARE ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err || decoded.username !== ADMIN_USER) {
      return res.status(403).json({ error: "Access denied" });
    }
    req.user = decoded;
    next();
  });
}

// --- HELPER FUNCTIONS ---
// Pass the Model into the helper to prevent "Buffering Timeout"
async function generateUniqueSlug(title, Model) {
  let baseSlug = slugify(title, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await Model.exists({ slug })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

// ----------------- ROUTES -----------------

// Login
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && await bcrypt.compare(password, ADMIN_PASS_HASH)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "12h" });
    return res.json({ success: true, token });
  }
  res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Blogs (Public GET)
app.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await BlogModel.find().sort({ createdAt: -1 });
    res.json({ data: blogs });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Blogs (Protected POST)
app.post("/api/blogs", authenticateToken, async (req, res) => {
  try {
    const data = req.body;
    if (!data.slug) data.slug = await generateUniqueSlug(data.title, BlogModel);
    
    const blog = new BlogModel(data);
    await blog.save();
    res.status(201).json(blog);
  } catch (err) {
    console.error("Blog Error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Leads (Protected GET)
app.get('/api/data/:collectionName', authenticateToken, async (req, res) => {
  const { collectionName } = req.params;
  let Model;
  switch (collectionName) {
    case 'waitlist_leads': Model = WebsiteLead; break;
    case 'general_inquiries': Model = GeneralInquiry; break;
    case 'expert_session_bookings': Model = ExpertSession; break;
    default: return res.status(400).json({ message: 'Invalid collection.' });
  }
  try {
    const leads = await Model.find().sort({ createdAt: -1 }).lean(); 
    res.status(200).json({ success: true, leads });
  } catch (error) { res.status(500).json({ message: error.message }); }
});



// 1. Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Point to the dist folder properly (Go UP one level, then into frontend/dist)
const frontendPath = path.resolve(__dirname, '..', 'frontend', 'dist');

// 3. LOG IT (Crucial for debugging!)
console.log("Looking for static files in:", frontendPath);

// 4. Serve the static files
app.use(express.static(frontendPath));

// 5. Catch-all for React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// --- SERVER START ---
blogConn.on('connected', () => console.log(' Connected to Blog Database'));
formsConn.on('connected', () => console.log(' Connected to Forms Database'));

app.listen(PORT, () => console.log(` Unified Server running on port ${PORT}`));