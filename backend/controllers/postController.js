const Post = require('../models/Post');
const Post = require('../models/Post');

// @desc    Create a new post
// @route   POST /api/posts
// @access  Private
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
      images
    } = req.body;

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
      postedBy: req.user._id, // from auth middleware
    });

    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error.message);
    res.status(500).json({ message: 'Server error while creating post' });
  }
};

module.exports = {
  createPost,
};
