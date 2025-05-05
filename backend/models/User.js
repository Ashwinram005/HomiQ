const mongoose = require("mongoose"); // We need this to work with MongoDB
const bcrypt = require("bcryptjs"); // This is for hashing passwords to keep them secure

// Create a schema (blueprint) for our user
const userSchema = new mongoose.Schema({
  email: {
    type: String, // Email will be a string
    required: true, // Email is required when creating a user
    unique: true, // Ensure no two users have the same email
  },
  password: {
    type: String, // Password will be a string
    required: true, // Password is required when creating a user
  },
  date: {
    type: Date, // The date when the user was created
    default: Date.now, // Set the default value to the current time
  },
});

// Middleware to hash the password before saving the user
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next(); // Skip if the password wasn't modified
  }

  const salt = await bcrypt.genSalt(10); // Generate salt
  this.password = await bcrypt.hash(this.password, salt); // Hash the password
  next(); // Proceed to the next step
});

// Method to compare the password the user enters with the stored password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password); // Compare the entered password with the hashed one
};

// Create the User model using the schema
const User = mongoose.model("User", userSchema);

module.exports = User; // Export the User model so it can be used in other parts of the app
