const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location"
  },
  bookedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ["BOOKED", "CANCELLED"],
    default: "BOOKED"
  }
});

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  bookings: [bookingSchema]
});

module.exports = mongoose.model("User", userSchema);
