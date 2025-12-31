const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  bookingNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  locationId: mongoose.Schema.Types.ObjectId,
  locationName: String,
  area: String,
  address: String,
  bookingDate: String,
  startTime: String,
  endTime: String,
  status: {
    type: String,
    default: "Booked"
  }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);
