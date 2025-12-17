require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to log IP address of incoming requests
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 
                   (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                   req.headers['x-real-ip'] || 'Unknown';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${clientIP}`);
  next();
});

// MongoDB Connection - Optimized for Serverless (Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  // Check if MONGO_URI is set
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI environment variable is not set!");
    throw new Error("MONGO_URI environment variable is required");
  }

  // If already connected, return cached connection
  if (cached.conn) {
    console.log("Using cached MongoDB connection");
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4 // Use IPv4, skip trying IPv6
    };

    console.log("Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, opts)
      .then((mongoose) => {
        console.log("MongoDB Connected Successfully");
        return mongoose;
      })
      .catch((err) => {
        console.error("MongoDB Connection Error:", err.message);
        cached.promise = null;
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Connect to MongoDB before handling requests
connectDB().catch((err) => {
  console.error("Failed to connect to MongoDB:", err);
});

// Middleware to ensure MongoDB is connected before handling API requests
app.use("/api", async (req, res, next) => {
  try {
    // Ensure MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error("MongoDB connection error in middleware:", error);
    return res.status(503).json({
      success: false,
      error: "Database connection failed. Please try again later.",
      message: error.message
    });
  }
});

// Routes
app.use("/api", sessionRoutes);

app.get("/", (req, res) => {
  res.send({
    message: "FlexBody Mini API Running",
    status: "OK",
    mongoStatus: cached.conn ? "Connected" : "Connecting...",
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting"
    };

    res.json({
      status: "OK",
      database: statusMap[dbStatus] || "unknown",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: "ERROR",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// For Vercel serverless functions, export the app
// For local development, start the server
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
