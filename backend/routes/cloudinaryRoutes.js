const express = require("express");
const router = express.Router();
const cloudinary = require("../cloudinaryConfig");
const {
  getSignature,
  deleteImage,
} = require("../controllers/cloudinaryController");

router.get("/sign", getSignature);
router.delete("/delete", deleteImage);

module.exports = router;
