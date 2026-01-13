const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
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

    /* ========= LOCATION INFO ========= */
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Location",
      required: true
    },

    locationName: String,
    area: String,
    address: String,

    image: {
      type: String
    },

    /* ========= TIME INFO ========= */
    bookingDate: {
      type: String, // yyyy-mm-dd
      required: true
    },

    startTime: {
      type: String, // HH:mm
      required: true
    },

    endTime: {
      type: String, // HH:mm
      required: true
    },

    duration: {
      type: Number, // hours
      required: true
    },

    /* ========= PRICING ========= */
    hourlyRate: {
      type: Number,
      required: true
    },

    totalAmount: {
      type: Number,
      required: true
    },

    /* ========= STATUS ========= */
    status: {
      type: String,
      enum: ["Booked", "Finished", "Cancelled"],
      default: "Booked"
    },

    finishedAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
