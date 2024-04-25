const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
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

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir); // Create the directory if it doesn't exist
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.mimetype)) {
      const error = new Error("Unsupported file type");
      error.status = 400;
      return cb(error);
    }
    cb(null, true);
  },
});

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: "Forbidden" });
    }

    req.user = decoded; // Attach decoded data to request
    next();
  });
};

app.get("/", (req, res) => {
  res.json({ msg: "working" });
});
// Login Endpoint to Generate JWT Token
app.post("/login", (req, res) => {
  // Example: Hardcoded user authentication; replace with real authentication logic
  const userId = "123"; // Normally, this would be from a database
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  res.json({ status: "success", token });
});

// File Upload Endpoint
app.post("/upload", authenticate, upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({ status: "success", filePath: file.path });
});

// File Download Endpoint
app.get("/download/:filePath", authenticate, (req, res) => {
  const filePath = req.params.filePath;
  const fullPath = path.join(__dirname, "uploads", filePath);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.sendFile(fullPath);
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace
  const statusCode = err.status || 500;
  const message = err.message || "Internal server error";

  res.status(statusCode).json({ message });
});
