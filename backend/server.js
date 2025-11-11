// server.js (ESM - FINAL MANUAL CORS INJECTION)

import dotenv from "dotenv";


import express from "express";
// We no longer need the standard 'cors' library, but keep the import if other packages rely on it, 
// though we will replace its usage with manual middleware below.
import cors from "cors"; 
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import fs from "fs";
import csv from "csv-parser";
import jwt from "jsonwebtoken";
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
// export default router;
import authRoutes from "./routes/authRoutes.js"

import  authRequired  from "./Middlewares/authMiddleware.js"
// import {authUser} from "./Middlewares/auth.js"

// NOTE: You must provide a valid Blog model in ./models/Blog.js
import Blog from "./models/Blog.js"; 
dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----------------- CONFIG / ENV -----------------
const PORT = process.env.PORT; 
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET || "mySuperSecretKey";
const ADMIN_USER = process.env.ADMIN_USER || "admin";
// const ADMIN_PASS = process.env.ADMIN_PASS || "admin123";
let adminPassHash = process.env.ADMIN_PASS_HASH || "$2b$10$w0X2YF.gE8S0tF/QY7N5iO5dG.K0x0fR.Z9pT"; 

// Define the origins we MUST allow
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean)
    : [
        "http://localhost:5174",
        "https://manage-blogs.onrender.com",
        "https://dynamic-website.onrender.com",
        "https://dynamic-blog-server-g5ea.onrender.com"
    ];
// /api/login
console.log("CORS Allowed Origins in Use:", allowedOrigins);

app.use("/api/auth", authRoutes);


app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("❌ CORS blocked for origin:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);


// ----------------- MIDDLEWARE (Order is CRITICAL - TOP PRIORITY) -----------------

// 1. **FINAL SOLUTION: MANUAL CORS HEADER INJECTION**
// This middleware manually checks and sets the CORS headers for every request.
app.use((req, res, next) => {
    const origin = req.headers.origin;
    
    // Check if the request origin is in our allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (allowedOrigins.includes(req.header('referer'))) {
        // Fallback check using referer header
        res.setHeader('Access-Control-Allow-Origin', req.header('referer'));
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    
    // For preflight OPTIONS requests, we respond immediately to guarantee success.
    if (req.method === 'OPTIONS') {
        // 204 No Content is standard for successful OPTIONS response
        return res.sendStatus(204); 
    }
    next();
});

// 2. Body Parser (MUST come after the manual header application)
app.use(express.json({ limit: "8mb" })); 


// ----------------- MULTER / UPLOAD SETUP -----------------
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) =>
        cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`),
});
const upload = multer({ storage });
// --------------------------------------------------------------------------------------------


// ----------------- ERROR HANDLING (Diagnostic Middleware) -----------------
app.use((err, req, res, next) => {
    if (err) {
        console.error("UNHANDLED REQUEST ERROR:", err.stack);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error during request processing." });
        }
    } else {
        next();
    }
});


// ----------------- DB CONNECTION -----------------
if (!MONGO_URI) {
    console.error("MONGO_URI not set. Exiting.");
    process.exit(1);
}


// ----------------- HELPER FUNCTIONS / AUTH MIDDLEWARE -----------------
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

// function authenticateToken(req, res, next) {
//     const authHeader = req.headers["authorization"];
//     const token = authHeader && authHeader.split(" ")[1];
//     if (!token) return res.status(401).json({ error: "Missing token" });

//     jwt.verify(token, JWT_SECRET, (err, user) => {
//         if (err) return res.status(403).json({ error: "Invalid token" });
//         req.user = user;
//         next();
//     });
// }

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Missing token" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid or expired token" });
        
        // Ensure the token belongs to the admin user
        if (user.username !== ADMIN_USER) {
             return res.status(403).json({ error: "Access denied." });
        }
        
        req.user = user;
        next();
    });
}
// ----------------- ROUTES -----------------
// health
app.get("/api/secret", authRequired, (req, res) => {
  res.json({ secret: "only for admins", user: req.user });
});
app.get("/health", (req, res) => res.json({ ok: true }));



app.get("/", (req, res) => res.send("🚀 Dynamic Blog Server is running"));

// Public: list blogs (with optional pagination & tag)
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
app.get("/api/blogs/:identifier", async (req, res) => {
    try {
        const idOrSlug = req.params.identifier;
        let blog = null;

        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            blog = await Blog.findById(idOrSlug);
        }
        if (!blog) blog = await Blog.findOne({ slug: idOrSlug });
        if (!blog) return res.status(404).json({ message: "Blog not found" });

        res.json(blog);
    } catch (err) {
        console.error("GET /api/blogs/:id error:", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

// Public: manual blog post (used by admin form if unprotected)
app.post("/api/blogs/manual", async (req, res) => {
    try {
        const blog = new Blog(req.body);
        if (!blog.slug && blog.title) blog.slug = slugify(blog.title);
        await blog.save();
        res.status(201).json({ message: "Blog created successfully (manual form)", blog });
    } catch (err) {
        console.error("POST /api/blogs/manual error:", err);
        res.status(400).json({ message: err.message || "Bad request" });
    }
});

// Protected create (recommended) - uses JWT
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
app.put("/api/blogs/:identifier", authenticateToken, async (req, res) => {
    try {
        const idOrSlug = req.params.identifier;
        const update = req.body;
        cleanIds(update);
        if (update.title && !update.slug) update.slug = slugify(update.title);

        let blog = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            blog = await Blog.findByIdAndUpdate(idOrSlug, update, { new: true });
        }
        if (!blog) {
            blog = await Blog.findOneAndUpdate({ slug: idOrSlug }, update, { new: true });
        }
        if (!blog) return res.status(404).json({ message: "Blog not found" });
        res.json({ message: "Blog updated", blog });
    } catch (err) {
        console.error("PUT /api/blogs/:id error:", err);
        res.status(400).json({ error: err.message || "Bad request" });
    }
});

// Delete blog (protected)
app.delete("/api/blogs/:identifier", authenticateToken, async (req, res) => {
    try {
        const idOrSlug = req.params.identifier;
        let result = null;
        if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
            result = await Blog.findByIdAndDelete(idOrSlug);
        }
        if (!result) result = await Blog.findOneAndDelete({ slug: idOrSlug });
        if (!result) return res.status(404).json({ message: "Blog not found" });
        res.json({ message: "Blog deleted" });
    } catch (err) {
        console.error("DELETE /api/blogs/:id error:", err);
        res.status(500).json({ error: err.message || "Server error" });
    }
});

// CSV upload (protected) - THIS ROUTE NOW WORKS BECAUSE 'upload' IS DEFINED
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
                // cleanup uploaded file
                fs.unlink(req.file.path, (err) => {
                    if (err) console.warn("Failed to remove CSV file:", err);
                });
                res.json({ message: "CSV data saved to MongoDB successfully", inserted: results.length });
            } catch (err) {
                console.error("CSV insert error:", err);
                fs.unlink(req.file.path, () => {});
                res.status(500).json({ message: "Error inserting CSV data (see server logs)", error: err.message });
            }
        });
});

// Login endpoint
// app.post("/api/login",authenticateToken, (req, res) => {
//     const { username, password } = req.body;
//     if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });

//     if (username === ADMIN_USER && password === ADMIN_PASS_HASH) {
//         const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "6h" });
//         return res.json({ success: true, token });
//     }
//     return res.status(401).json({ success: false, message: "Invalid credentials" });
// });
app.post("/api/auth/login", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ success: false, message: "Username and password required" });

    if (username === ADMIN_USER) {
        // CRITICAL: Use bcrypt.compare() to check the plaintext password against the stored hash
        const isMatch = await bcrypt.compare(password, adminPassHash);

        if (isMatch) {
            const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: "6h" });
            return res.json({ success: true, token });
        }
    }
    // Generic failure message for security
    return res.status(401).json({ success: false, message: "Invalid credentials" });
});


// 2. NEW ENDPOINT: CHANGE ADMIN PASSWORD (Protected)
app.post("/api/admin/change-password", authenticateToken, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Current and new password required." });
    }
    
    // Step 1: Verify the CURRENT password against the stored hash
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, adminPassHash);
    
    if (!isCurrentPasswordValid) {
        return res.status(401).json({ success: false, message: "Invalid current password." });
    }

    // Step 2: Hash the new password
    // Use a salt rounds of 10 (standard and secure)
    const newHash = await bcrypt.hash(newPassword, 10);
    
    // Step 3: Update the in-memory hash
    adminPassHash = newHash;
    
    // IMPORTANT NOTE: In a real application, you would save this newHash 
    // to a persistent database store (e.g., a MongoDB User model).
    // Since we are using ENV variables for simplicity, we only update the runtime variable.
    
    console.log(` Admin password successfully changed in memory. New hash: ${newHash.substring(0, 30)}...`);
    
    return res.json({ 
        success: true, 
        message: "Password changed successfully. You may need to log in again." 
    });
});



// Protected test endpoint
app.get("/api/secure-blogs", authenticateToken, (req, res) => {
    res.json({ message: "Protected data", user: req.user });
});


// ----------------- SERVER START (LAST EXECUTING BLOCK) -----------------
mongoose
    .connect(MONGO_URI, {
        dbName: process.env.DB_NAME || "dynamic-website-blogs",
    })
    .then(() => {
        console.log(" MongoDB connected");
        
        app.listen(PORT, () => {
            console.log(` Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error(" MongoDB connection error:", err.message || err);
        process.exit(1); 
    });












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
