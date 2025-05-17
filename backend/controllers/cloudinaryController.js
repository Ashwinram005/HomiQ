const cloudinary = require("../cloudinaryConfig");

const getSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      // add more options here if needed (e.g., folder)
    },
    process.env.CLOUDINARY_API_SECRET
  );

  res.json({ signature, timestamp, api_key: process.env.CLOUDINARY_API_KEY });
};

module.exports = { getSignature };
