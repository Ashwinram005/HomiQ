const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    type: {
      type: String, // e.g., Room, House, PG
      required: true,
    },
    occupancy: {
      type: String, // e.g., Single, Shared
      required: true,
    },
    furnished: {
      type: Boolean,
      default: false,
    },
    availableFrom: {
      type: Date,
      required: true,
    },
    amenities: {
      type: [String], // Array of strings
      default: [],
    },
    images: {
      type: [String], // URLs or filenames
      default: [],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Post = mongoose.model("Post", postSchema);

module.exports = Post;
