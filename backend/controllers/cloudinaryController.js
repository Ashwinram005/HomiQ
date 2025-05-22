const cloudinary = require("../cloudinaryConfig");
const crypto = require("crypto");
const getSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  console.log(process.env.CLOUDINARY_CLOUD_NAME); 
  const signature = crypto
    .createHash("sha1")
    .update(`timestamp=${timestamp}${process.env.CLOUDINARY_API_SECRET}`)
    .digest("hex");
  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
};

module.exports = { getSignature };
