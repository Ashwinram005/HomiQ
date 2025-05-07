const Post = require("../models/Post");

const createPost = async (req, res) => {
  try {
    const {
      title,
      description,
      price,
      location,
      type,
      occupancy,
      furnished,
      availableFrom,
      amenities,
      images,
    } = req.body;

    const { userId } = req.user; // Access the userId set by the middleware

    // Create new post
    const post = new Post({
      title,
      description,
      price,
      location,
      type,
      occupancy,
      furnished,
      availableFrom,
      amenities,
      images,
      postedBy: userId, // from auth middleware
    });

    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error.message);
    res.status(500).json({ message: "Server error while creating post" });
  }
};

const getMyPosts = async (req, res) => {
  try {
    console.log("Authenticated User ID:", req.user.userId);  // Debug line
    const posts = await Post.find({ postedBy: req.user.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

module.exports = {
  createPost,
  getMyPosts,
};
