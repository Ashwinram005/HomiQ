const express = require("express");
const router = express.Router();
const { getSignature } = require("../controllers/cloudinaryController");

// Route to get signed signature for Cloudinary upload
router.get("/sign", getSignature);

module.exports = router;
