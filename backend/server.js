// server.js (ESM)
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import jwt from "jsonwebtoken";

import Blog from "./models/Blog.js";

const app = express();

// ---------- Config / env ----------
const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// CORS origins: env var CORS_ORIGIN optionally comma-separated, otherwise sensible defaults
// const allowedOrigins = process.env.CORS_ORIGIN
//   ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
//   : [
//       "http://localhost:5173",
//       "http://localhost:4173",
//       "https://manage-blogs.onrender.com",      // admin UI (example)
//       "https://dynamic-website.vercel.app",    // public site (example)
//       "https://your-frontend-domain.com"       // replace or add as needed
//     ];
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : [];

if (!MONGO_URI) {
  console.error("MONGO_URI not set. Configure .env or environment variables.");
  process.exit(1);
}



// robust CORS config (allows curl/postman when no origin)
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.log("❌ CORS blocked for origin:", origin);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// respond to preflight globally
app.options("*", cors());

// ---------- Upload (CSV) setup ----------
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });

// ---------- Helpers ----------
function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function reconstructNestedObject(flatObj) {
  const result = {};
  for (const key in flatObj) {
    if (!Object.prototype.hasOwnProperty.call(flatObj, key)) continue;
    const value = flatObj[key];
    const match = key.match(/([\w]+)\[(\d+)\](?:\.([\w]+))?(?:\[(\d+)\])?/);
    if (match) {
      const [_, arrName, arrIdxStr, prop, subIdxStr] = match;
      const arrIdx = parseInt(arrIdxStr, 10);
      const subIdx = subIdxStr ? parseInt(subIdxStr, 10) : null;
      result[arrName] = result[arrName] || [];
      while (result[arrName].length <= arrIdx) result[arrName].push({});
      if (prop && subIdx !== null) {
        result[arrName][arrIdx][prop] = result[arrName][arrIdx][prop] || [];
        while (result[arrName][arrIdx][prop].length <= subIdx)
          result[arrName][arrIdx][prop].push(null);
        result[arrName][arrIdx][prop][subIdx] = value;
      } else if (prop) {
        result[arrName][arrIdx][prop] = value;
      } else {
        result[arrName][arrIdx] = value;
      }
    } else {
      result[key] = value;
    }
  }
  return result;
}

function cleanIds(obj) {
  if (Array.isArray(obj)) obj.forEach(cleanIds);
  else if (obj && typeof obj === "object") {
    for (const key of Object.keys(obj)) {
      if (key === "_id" && (!obj[key] || obj[key] === "")) delete obj[key];
      else cleanIds(obj[key]);
    }
  }
}

// ---------- Auth ----------
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Missing token" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
}

// ---------- Middleware ----------
app.use(express.json({ limit: "8mb" }));

// ---------- DB connect & server start (start only after DB connected) ----------
// mongoose
//   .connect(MONGO_URI, {
//     dbName: process.env.DB_NAME || "dynamic-website-blogs",
//   })
//   .then(() => {
//     console.log("✅ MongoDB connected");

//     // Start app only after DB is ready
//     app.listen(PORT, () => {
//       console.log(` Server running on port ${PORT}`);
//       console.log(" Allowed CORS origins:", allowedOrigins);
//     });
//   })
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err.message || err);
//     process.exit(1);
//   });

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ---------- Routes ----------

// health
app.get("/", (req, res) => res.json({ ok: true, message: "Dynamic Blog Server is running" }));

// Public: list blogs (pagination & optional tag)
app.get("/api/blogs", async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.tag) filter.blogTags = req.query.tag;

    const [blogs, total] = await Promise.all([
      Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Blog.countDocuments(filter),
    ]);
    res.json({ data: blogs, page, limit, total });
  } catch (err) {
    console.error("GET /api/blogs error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Public: get single by id or slug
app.get("/api/blogs/:id", async (req, res) => {
  try {
    const idOrSlug = req.params.identifier;
    let blog = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) blog = await Blog.findById(idOrSlug);
    if (!blog) blog = await Blog.findOne({ slug: idOrSlug });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json(blog);
  } catch (err) {
    console.error("GET /api/blogs/:id error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Public manual form endpoint (keeps existing frontend working)
app.post("/api/blogs/manual", async (req, res) => {
  try {
    const blog = new Blog(req.body);
    if (!blog.slug && blog.title) blog.slug = slugify(blog.title);
    await blog.save();
    res.status(201).json({ message: "Blog created (manual)", blog });
  } catch (err) {
    console.error("POST /api/blogs/manual error:", err);
    res.status(400).json({ message: err.message || "Bad request" });
  }
});

// Protected create (recommended)
app.post("/api/blogs", authenticateToken, async (req, res) => {
  try {
    const blogData = req.body;
    cleanIds(blogData);
    if (!blogData.slug && blogData.title) blogData.slug = slugify(blogData.title);
    const newBlog = new Blog(blogData);
    await newBlog.save();
    res.status(201).json({ message: "Blog created", blog: newBlog });
  } catch (err) {
    console.error("POST /api/blogs (protected) error:", err);
    res.status(400).json({ error: err.message || "Bad request" });
  }
});

// Update blog (protected)
app.put("/api/blogs/:id", authenticateToken, async (req, res) => {
  try {
    const idOrSlug = req.params.identifier;
    const update = req.body;
    cleanIds(update);
    if (update.title && !update.slug) update.slug = slugify(update.title);

    let blog = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      blog = await Blog.findByIdAndUpdate(idOrSlug, update, { new: true });
    }
    if (!blog) blog = await Blog.findOneAndUpdate({ slug: idOrSlug }, update, { new: true });
    if (!blog) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog updated", blog });
  } catch (err) {
    console.error("PUT /api/blogs/:id error:", err);
    res.status(400).json({ error: err.message || "Bad request" });
  }
});

// Delete blog (protected)
app.delete("/api/blogs/:id", authenticateToken, async (req, res) => {
  try {
    const idOrSlug = req.params.identifier;
    let result = null;
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) result = await Blog.findByIdAndDelete(idOrSlug);
    if (!result) result = await Blog.findOneAndDelete({ slug: idOrSlug });
    if (!result) return res.status(404).json({ message: "Blog not found" });
    res.json({ message: "Blog deleted" });
  } catch (err) {
    console.error("DELETE /api/blogs/:id error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// CSV upload (protected)
app.post("/api/upload", authenticateToken, upload.single("csv"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });

  const results = [];
  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on("data", (data) => {
      const reconstructed = reconstructNestedObject(data);
      cleanIds(reconstructed);
      if (!reconstructed.slug && reconstructed.title) reconstructed.slug = slugify(reconstructed.title);
      results.push(reconstructed);
    })
    .on("end", async () => {
      try {
        await Blog.insertMany(results, { ordered: false });
        // remove uploaded file
        fs.unlink(req.file.path, (err) => {
          if (err) console.warn("Failed to delete CSV upload:", err);
        });
        res.json({ message: "CSV data saved to MongoDB successfully", inserted: results.length });
      } catch (err) {
        console.error("CSV insert error:", err);
        fs.unlink(req.file.path, () => {});
        res.status(500).json({ message: "Error inserting CSV data (see server logs)", error: err.message || err });
      }
    });
});

// Login endpoint (admin)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });

  if (username === ADMIN_USER && password === ADMIN_PASS) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "6h" });
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: "Invalid credentials" });
});

// Protected test endpoint
app.get("/api/secure-blogs", authenticateToken, (req, res) => {
  res.json({ message: "Protected data", user: req.user });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));





















// server.js
// import dotenv from "dotenv";
// import express from "express";
// import cors from "cors";
// import mongoose from "mongoose";
// import multer from "multer";
// import path from "path";
// import fs from "fs";
// import csv from "csv-parser";
// import jwt from "jsonwebtoken";

// import Blog from "./models/Blog.js"; // make sure models/Blog.js exists

// dotenv.config();
// const app = express();


// const allowedOrigins = [
//   "http://localhost:5173",
//   "https://manage-blogs.onrender.com",
// ];

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       // Allow requests with no origin (like mobile apps, Postman, etc.)
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         console.log("❌ CORS blocked for origin:", origin);
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );


// app.use(express.json({ limit: "5mb" })); // increase if needed

// // env
// const PORT = process.env.PORT || 4000;
// const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://prehome_website_user:1ywa7PfsUW3pPWvt@lead-tracking.jysawuj.mongodb.net/dynamic-website-blogs?retryWrites=true&w=majority&appName=lead-tracking";
// const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey";
// const ADMIN_USER = process.env.ADMIN_USER || "admin";
// const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";

// // const PORT = process.env.PORT || 4000;
// // const MONGO_URI = process.env.MONGO_URI;
// // const JWT_SECRET = process.env.JWT_SECRET;
// // const ADMIN_USER = process.env.ADMIN_USER;
// // const ADMIN_PASS = process.env.ADMIN_PASS;


// // Ensure uploads folder exists (for CSV)
// const uploadDir = path.join(process.cwd(), "uploads");
// if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// // Connect to MongoDB
// mongoose
//   .connect(MONGO_URI, {
//     dbName: process.env.DB_NAME || "dynamic-website-blogs",
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("✅ MongoDB connected"))
//   .catch((err) => {
//     console.error("❌ MongoDB connection error:", err.message);
//     process.exit(1);
//   });

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => cb(null, uploadDir),
//   filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`)
// });
// const upload = multer({ storage });

// // ----------------- Helpers -----------------
// function slugify(text = "") {
//   return String(text)
//     .toLowerCase()
//     .trim()
//     .replace(/[^\w\s-]/g, "")
//     .replace(/\s+/g, "-");
// }

// // Reconstruct nested keys like "subttileHead[0].name[1]" from CSV flattened keys
// function reconstructNestedObject(flatObj) {
//   const result = {};
//   for (const key in flatObj) {
//     if (!Object.prototype.hasOwnProperty.call(flatObj, key)) continue;
//     const value = flatObj[key];
//     const match = key.match(/([\w]+)\[(\d+)\](?:\.([\w]+))?(?:\[(\d+)\])?/);
//     if (match) {
//       const [_, arrName, arrIdxStr, prop, subIdxStr] = match;
//       const arrIdx = parseInt(arrIdxStr, 10);
//       const subIdx = subIdxStr ? parseInt(subIdxStr, 10) : null;
//       result[arrName] = result[arrName] || [];
//       while (result[arrName].length <= arrIdx) result[arrName].push({});
//       if (prop && subIdx !== null) {
//         result[arrName][arrIdx][prop] = result[arrName][arrIdx][prop] || [];
//         while (result[arrName][arrIdx][prop].length <= subIdx) result[arrName][arrIdx][prop].push(null);
//         result[arrName][arrIdx][prop][subIdx] = value;
//       } else if (prop) {
//         result[arrName][arrIdx][prop] = value;
//       } else {
//         result[arrName][arrIdx] = value;
//       }
//     } else {
//       result[key] = value;
//     }
//   }
//   return result;
// }

// function cleanIds(obj) {
//   if (Array.isArray(obj)) obj.forEach(cleanIds);
//   else if (obj && typeof obj === "object") {
//     for (const key of Object.keys(obj)) {
//       if (key === "_id" && (!obj[key] || obj[key] === "")) delete obj[key];
//       else cleanIds(obj[key]);
//     }
//   }
// }

// // JWT middleware
// function authenticateToken(req, res, next) {
//   const authHeader = req.headers["authorization"];
//   const token = authHeader && authHeader.split(" ")[1];
//   if (!token) return res.sendStatus(401);

//   jwt.verify(token, JWT_SECRET, (err, user) => {
//     if (err) return res.sendStatus(403);
//     req.user = user;
//     next();
//   });
// }

// // ----------------- Routes -----------------

// app.get("/", (req, res) => res.send("🚀 Dynamic Blog Server is running"));

// // ----- Public APIs -----
// // GET list (with optional pagination & tag)
// app.get("/api/blogs", async (req, res) => {
//   try {
//     const page = Math.max(1, parseInt(req.query.page || "1", 10));
//     const limit = Math.max(1, parseInt(req.query.limit || "20", 10));
//     const skip = (page - 1) * limit;

//     const filter = {};
//     if (req.query.tag) filter.blogTags = req.query.tag;

//     const [blogs, total] = await Promise.all([
//       Blog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
//       Blog.countDocuments(filter),
//     ]);
//     res.json({ data: blogs, page, limit, total });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });


// app.post("/api/blogs/manual", async (req, res) => {
//   try {
//     const blog = new Blog(req.body);
//     await blog.save();
//     res.status(201).json({ message: "Blog created successfully (manual form)", blog });
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// });

// // GET single blog by id OR slug (flexible)
// app.get("/api/blogs/:identifier", async (req, res) => {
//   try {
//     const idOrSlug = req.params.identifier;
//     let blog = null;

//     // Try as ObjectId
//     if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
//       blog = await Blog.findById(idOrSlug);
//     }

//     // If not found by id, try slug field (if model has it)
//     if (!blog) {
//       blog = await Blog.findOne({ slug: idOrSlug });
//     }

//     if (!blog) return res.status(404).json({ message: "Blog not found" });
//     res.json(blog);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // ----- Protected Admin APIs -----
// // Create new blog (manual form) - protected
// app.post("/api/blogs", authenticateToken, async (req, res) => {
//   try {
//     const blogData = req.body;
//     cleanIds(blogData);

//     // generate slug if possible
//     if (!blogData.slug && blogData.title) blogData.slug = slugify(blogData.title);

//     const newBlog = new Blog(blogData);
//     await newBlog.save();
//     res.status(201).json({ message: "Blog created", blog: newBlog });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ error: err.message });
//   }
// });

// // Update a blog by id (or slug)
// app.put("/api/blogs/:identifier", authenticateToken, async (req, res) => {
//   try {
//     const idOrSlug = req.params.identifier;
//     const update = req.body;
//     cleanIds(update);

//     // if title changed and no slug provided, update slug
//     if (update.title && !update.slug) update.slug = slugify(update.title);

//     let blog = null;
//     if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
//       blog = await Blog.findByIdAndUpdate(idOrSlug, update, { new: true });
//     }
//     if (!blog) {
//       blog = await Blog.findOneAndUpdate({ slug: idOrSlug }, update, { new: true });
//     }
//     if (!blog) return res.status(404).json({ message: "Blog not found" });
//     res.json({ message: "Blog updated", blog });
//   } catch (err) {
//     console.error(err);
//     res.status(400).json({ error: err.message });
//   }
// });

// // Delete blog
// app.delete("/api/blogs/:identifier", authenticateToken, async (req, res) => {
//   try {
//     const idOrSlug = req.params.identifier;
//     let result = null;
//     if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
//       result = await Blog.findByIdAndDelete(idOrSlug);
//     }
//     if (!result) result = await Blog.findOneAndDelete({ slug: idOrSlug });
//     if (!result) return res.status(404).json({ message: "Blog not found" });
//     res.json({ message: "Blog deleted" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: err.message });
//   }
// });

// // CSV Upload (admin) -> /api/upload (multipart/form-data with field 'csv')
// app.post("/api/upload", authenticateToken, upload.single("csv"), (req, res) => {
//   if (!req.file) return res.status(400).json({ message: "No file uploaded" });

//   const results = [];
//   fs.createReadStream(req.file.path)
//     .pipe(csv())
//     .on("data", (data) => {
//       const reconstructed = reconstructNestedObject(data);
//       cleanIds(reconstructed);

//       // ensure slug for each entry if possible
//       if (!reconstructed.slug && reconstructed.title) reconstructed.slug = slugify(reconstructed.title);

//       results.push(reconstructed);
//     })
//     .on("end", async () => {
//       try {
//         // insertMany may fail on duplicates if slug unique — handle errors gracefully
//         await Blog.insertMany(results, { ordered: false });
//         res.json({ message: "✅ CSV data saved to MongoDB successfully", inserted: results.length });
//       } catch (err) {
//         console.error("CSV insert error:", err.message || err);
//         // if duplicate key errors happen, inform user
//         res.status(500).json({ message: "Error inserting CSV data (see server logs)", error: err.message });
//       }
//     });
// });

// // Simple login endpoint to get JWT (admin)
// // app.post("/api/login", (req, res) => {
// //   const { username, password } = req.body;
// //   if (username === ADMIN_USER && password === ADMIN_PASS) {
// //     const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "6h" });
// //     return res.json({ token });
// //   }
// //   res.status(401).json({ error: "Invalid credentials" });
// // });

// app.post("/api/login", (req, res) => {
//   const { username, password } = req.body;

//   if (!username || !password) {
//     return res.status(400).json({ success: false, message: "Username and password required" });
//   }

//   if (username === ADMIN_USER && password === ADMIN_PASS) {
//     // Create JWT token
//     const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "1h" });
//     return res.json({ success: true, token });
//   }

//   return res.status(401).json({ success: false, message: "Invalid credentials" });
// });

// // Example protected test route
// app.get("/api/secure-blogs", authenticateToken, (req, res) => {
//   res.json({ message: "Protected data", user: req.user });
// });

// // Start listening
// app.listen(PORT, () => {
//   console.log(`🚀 Server running on port ${PORT}`);
// });
