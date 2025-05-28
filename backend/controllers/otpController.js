const Otp = require("../models/Otp");
const User = require("../models/User");

async function verifyOtp(req, res) {
  const { email, otp } = req.body;
  try {
    const record = await Otp.findOne({ email });
    if (!record || record.otp !== otp) {
      return res.status(400).json({
        message: "Invalid or expired Otp",
        error: true,
        success: false,
      });
    }
    const { name, password } = record;
    console.log(record);
    const newUser = new User({ email, name, password });
    await newUser.save();
    await Otp.deleteOne({ _id: record._id });
    return res.status(200).json({
      message: "User registered Successfully",
      error: true,
      success: false,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
      error: true,
      success: false,
    });
  }
}
module.exports = { verifyOtp };
