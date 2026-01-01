const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const Location = require("../models/Location");
const auth = require("../middleware/auth");

/* =======================
   GET MY BOOKINGS
======================= */
router.get("/my", auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("Get bookings error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET BOOKING TICKET
======================= */
router.get("/ticket/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json({
      bookingNumber: booking.bookingNumber,
      locationName: booking.locationName,
      area: booking.area,
      address: booking.address,
      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status
    });
  } catch (err) {
    console.error("Ticket fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   CANCEL BOOKING (FIXED)
======================= */
router.put("/cancel/:id", auth, async (req, res) => {
  try {
    const booking = await Booking.findOne({
      _id: req.params.id,
      userId: req.user.id
    });

    if (!booking) return res.sendStatus(404);

    if (booking.status === "CANCELLED") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    booking.status = "CANCELLED";
    await booking.save();

    await Location.findByIdAndUpdate(
      booking.locationId,
      { $inc: { availableSlots: 1 } }
    );

    res.json({ message: "Booking cancelled" });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
