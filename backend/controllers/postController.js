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
    console.log("Authenticated User ID:", req.user.userId); // Debug line
    const posts = await Post.find({ postedBy: req.user.userId }).sort({
      createdAt: -1,
    });
    res.status(200).json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// Get posts not created by the current user
// const getOtherUsersPosts = async (req, res) => {
//   try {
//     const currentUserId = req.user.userId;

//     const posts = await Post.find({
//       postedBy: { $ne: currentUserId },
//     }).populate("postedBy", "email"); // only email field

//     res.status(200).json(posts);
//   } catch (error) {
//     console.error("Error fetching other users' posts:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };

const getOtherUsersPosts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const posts = await Post.find({
      postedBy: { $ne: currentUserId },
    })
      .populate("postedBy", "email")
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Post.countDocuments({
      postedBy: { $ne: currentUserId },
    });

    res.status(200).json({
      posts,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Error fetching other users' posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createPost,
  getMyPosts,
  getOtherUsersPosts,
};
