const express = require("express");
const dotenv = require("dotenv");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

dotenv.config(); // Load environment variables

const app = express();
const PORT = process.env.PORT || 3004;

// Security middleware
app.use(helmet()); // Basic security headers
app.use(cors()); // Manage Cross-Origin Resource Sharing

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
});
app.use(limiter);

// Parse JSON requests
app.use(express.json());

// Import and use routes
const authRoutes = require("./routes/authentication"); // Authentication routes
const fileRoutes = require("./routes/file"); // File upload/download routes

app.use("/api", authRoutes); // Use authentication routes with the base path /api
app.use("/api", fileRoutes); // Use file handling routes with the base path /api

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace
  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ message });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
