const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Middleware for JWT authentication
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

// Configure Multer for file uploads
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

// File Upload Endpoint
router.post("/upload", authenticate, upload.single("file"), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  res.json({ status: "success", filePath: file.path });
});

// File Download Endpoint
router.get("/download/:filePath", authenticate, (req, res) => {
  const filePath = req.params.filePath;
  const fullPath = path.join(__dirname, "../uploads", filePath);

  if (!fs.existsSync(fullPath)) {
    return res.status(404).json({ message: "File not found" });
  }

  res.sendFile(fullPath);
});

module.exports = router;
