const express = require("express");
const jwt = require("jsonwebtoken");

const router = express.Router();

// JWT Secret must be defined in .env
const JWT_SECRET = process.env.JWT_SECRET;

const generateJWT = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, {
    expiresIn: "1h", // JWT token expiration time
  });
};

// Login Endpoint to Generate JWT Token
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Replace with real authentication logic
  if (username === "test" && password === "password") {
    const token = generateJWT("123"); // Generate the JWT token
    return res.json({ token }); // Return the token
  }

  return res.status(401).json({ message: "Invalid credentials" }); // Unauthorized response
});

module.exports = router;
