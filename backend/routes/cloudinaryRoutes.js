const express = require("express");
const router = express.Router();
const { getSignature } = require("../controllers/cloudinaryController");

router.get("/sign", getSignature);

module.exports = router;
