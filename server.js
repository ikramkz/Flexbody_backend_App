require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const os = require("os");

const sessionRoutes = require("./routes/sessionRoutes");

const app = express();
app.use(cors());
app.use(express.json());

// Middleware to log IP address of incoming requests
app.use((req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || 
                   (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 
                   req.headers['x-real-ip'] || 'Unknown';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${clientIP}`);
  next();
});

// Function to get local IP address
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log("DB Error:", err));

// Routes
app.use("/api", sessionRoutes);

app.get("/", (req, res) => {
  const ipAddress = getLocalIPAddress();
  res.send({
    message: "FlexBody Mini API Running",
    serverIP: ipAddress,
    port: process.env.PORT,
    apiBaseURL: `http://${ipAddress}:${process.env.PORT}/api`
  });
});

// Listen on all network interfaces (0.0.0.0) to accept connections from IP address
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  const ipAddress = getLocalIPAddress();
  console.log("=".repeat(50));
  console.log(`Server running on port ${PORT}`);
  console.log(`Local:   http://localhost:${PORT}`);
  console.log(`Network: http://${ipAddress}:${PORT}`);
  console.log(`API:     http://${ipAddress}:${PORT}/api`);
  console.log("=".repeat(50));
});
