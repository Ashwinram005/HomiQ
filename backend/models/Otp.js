const mongoose = require("mongoose");
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  password: {
    type: String,
    required: true,
  },
});
const Otp = mongoose.model("Otp", otpSchema);
module.exports = Otp;
