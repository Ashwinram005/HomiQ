const Post = require("../models/Post");

const createPost = async (req, res) => {
  try {
    const {
      email,
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
      email,
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

// Helper function to build filter conditions
const buildFilterConditions = (query, currentUserId, isMyPosts) => {
  const {
    searchQuery = "",
    locationQuery = "",
    priceFilter = "all",
    roomTypeFilter = "all",
    occupancyFilter = "all",
    availableFrom = "",
  } = query;

  let amenityFilters = query["amenityFilters[]"] || query.amenityFilters || [];

  if (typeof amenityFilters === "string") {
    amenityFilters = [amenityFilters];
  }

  // console.log("Amenities", amenityFilters);
  const filterConditions = {
    postedBy: isMyPosts ? currentUserId : { $ne: currentUserId },
  };

  if (searchQuery) {
    filterConditions.title = { $regex: searchQuery, $options: "i" };
  }

  if (locationQuery) {
    filterConditions.location = { $regex: locationQuery, $options: "i" };
  }

  if (priceFilter !== "all") {
    filterConditions.price = { $lte: parseInt(priceFilter) };
  }

  if (roomTypeFilter !== "all") {
    filterConditions.type = roomTypeFilter;
  }

  if (occupancyFilter !== "all") {
    filterConditions.occupancy = occupancyFilter;
  }

  if (availableFrom) {
    filterConditions.availableFrom = { $gte: new Date(availableFrom) };
  }

  if (amenityFilters.length > 0) {
    filterConditions.amenities = {
      $all: amenityFilters.map((amenity) => new RegExp(`^${amenity}$`, "i")),
    };
    // console.log("filter amenities", filterConditions.amenities);
  }

  return filterConditions;
};

const getMyPosts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    const filterConditions = buildFilterConditions(
      req.query,
      currentUserId,
      true
    );

    const posts = await Post.find(filterConditions)
      .sort({ createdAt: -1 })
      .populate("postedBy", "email")
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Post.countDocuments(filterConditions);

    res.status(200).json({
      posts,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Error fetching my posts:", error);
    res.status(500).json({ message: "Failed to fetch your posts" });
  }
};

// Main function to fetch posts
const getOtherUsersPosts = async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;

    // Get filter conditions using the helper function
    const filterConditions = buildFilterConditions(
      req.query,
      currentUserId,
      false
    );

    const posts = await Post.find(filterConditions)
      .populate("postedBy", "email")
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();

    const total = await Post.countDocuments(filterConditions);

    res.status(200).json({
      posts,
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("Error fetching other users' posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const getRoom = async (req, res) => {
  try {
    const room = await Post.findById(req.params.id);
    if (!room) {
      return res.status(404).json({
        messae: "Room not found",
        error: true,
        success: false,
      });
    }
    return res.status(200).json({
      data: room,
      error: false,
      success: true,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
};

async function getRoomsByUser(req, res) {
  try {
    const { id: userId } = req.params;
    const posts = await Post.find({ postedBy: userId }); // ✅ correct key
    return res.status(200).json({
      rooms: posts, // ✅ rename to 'rooms'
      success: true,
      error: false,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

async function updatePost(req, res) {
  const { postId } = req.params;
  try {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updatePost) {
      return res.status(404).json({
        message: "Room not Found",
        error: true,
        success: false,
      });
    }
    res.status(200).json({
      updatedPost,
      error: false,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message || error,
      error: true,
      success: false,
    });
  }
}

const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    // You can also check if the user owns the post here

    const deletedPost = await Post.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ error: "Post not found" });
    }

    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
async function getallPosts(req, res) {
  try {
    const {
      page = 1,
      limit = 6,
      searchQuery,
      locationQuery,
      priceFilter,
      roomTypeFilter,
      occupancyFilter,
      furnishedFilter,
      availableFromFilter,
      amenitiesFilter, // expects comma separated string e.g. "wifi,parking"
      postedByFilter,
    } = req.query;

    // Build dynamic filters object
    const filters = {};

    if (searchQuery) {
      filters.$or = [
        { title: { $regex: searchQuery, $options: "i" } },
        { description: { $regex: searchQuery, $options: "i" } },
      ];
    }

    if (locationQuery) {
      filters.location = { $regex: locationQuery, $options: "i" };
    }

    if (priceFilter && priceFilter !== "all") {
      filters.price = { $lte: Number(priceFilter) };
    }

    if (roomTypeFilter && roomTypeFilter !== "all") {
      filters.type = roomTypeFilter;
    }

    if (occupancyFilter && occupancyFilter !== "all") {
      filters.occupancy = occupancyFilter;
    }

    if (furnishedFilter === "true") {
      filters.furnished = true;
    } else if (furnishedFilter === "false") {
      filters.furnished = false;
    }

    if (availableFromFilter) {
      const date = new Date(availableFromFilter);
      if (!isNaN(date.getTime())) {
        filters.availableFrom = { $gte: date };
      }
    }

    if (amenitiesFilter) {
      const amenitiesArray = amenitiesFilter.split(",").map((a) => a.trim());
      // Posts that have all the selected amenities
      filters.amenities = { $all: amenitiesArray };
    }

    if (postedByFilter) {
      // if you want to filter by email, you may need to populate or join
      // assuming postedByFilter is a user id for simplicity
      filters.postedBy = postedByFilter;
    }

    // Pagination
    const skip = (page - 1) * limit;
    const posts = await Post.find(filters)
      .populate("postedBy", "email") // populate email of user
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Total count for pagination
    const total = await Post.countDocuments(filters);

    res.json({
      posts,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

module.exports = {
  createPost,
  getMyPosts,
  getOtherUsersPosts,
  getRoom,
  getRoomsByUser,
  updatePost,
  deletePost,
  getallPosts,
};
