const cloudinary = require("../cloudinaryConfig");

const getSignature = (req, res) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder: "HomiQ",
    },
    process.env.CLOUDINARY_API_SECRET
  );
  res.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
};

const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ error: "publicId is required" });
    }

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok") {
      return res
        .status(400)
        .json({ error: "Failed to delete image from Cloudinary" });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getSignature, deleteImage };
