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
    const userId = req.user.id;

    const bookings = await Booking.find({ userId })
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
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // ✅ SAFE RESPONSE (OLD + NEW BOOKINGS)
    res.json({
      bookingNumber: booking.bookingNumber,
      locationName: booking.locationName,
      area: booking.area,
      address: booking.address,

      bookingDate: booking.bookingDate,
      startTime: booking.startTime,
      endTime: booking.endTime,

      hourlyRate: booking.hourlyRate ?? 0,
      duration: booking.duration ?? 0,
      totalAmount: booking.totalAmount ?? 0,

      status: booking.status
    });
  } catch (err) {
    console.error("Ticket fetch error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


const mongoose = require("mongoose");

/* =======================
   ADMIN EARNINGS STATS
======================= */
router.get("/stats/admin", auth, async (req, res) => {
  try {
    const ownerId = new mongoose.Types.ObjectId(req.user.id);

    const bookings = await Booking.aggregate([
      {
        $match: {
          status: { $ne: "Cancelled" }
        }
      },
      {
        $lookup: {
          from: "locations",
          localField: "locationId",
          foreignField: "_id",
          as: "location"
        }
      },
      { $unwind: "$location" },
      {
        $match: {
          "location.owner": ownerId
        }
      },
      {
        $group: {
          _id: "$location.name",
          total: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalEarnings = bookings.reduce(
      (sum, b) => sum + b.total,
      0
    );

    res.json({
      totalEarnings,
      byLocation: bookings
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});



/* =======================
   CANCEL BOOKING
======================= */
router.put("/cancel/:id", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const booking = await Booking.findOne({
      _id: req.params.id,
      userId
    });

    if (!booking) {
      return res.sendStatus(404);
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({ message: "Already cancelled" });
    }

    booking.status = "Cancelled";
    await booking.save();

    // Restore slot
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
