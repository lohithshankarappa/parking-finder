const router = require("express").Router();
const Booking = require("../models/Booking");
const Location = require("../models/Location");
const auth = require("../middleware/auth");

/* =======================
   ADMIN EARNINGS STATS
======================= */
router.get("/stats", auth, async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get all locations owned by admin
    const locations = await Location.find({ owner: ownerId });

    const locationIds = locations.map(l => l._id);

    // Only finished or booked bookings count as earnings
    const bookings = await Booking.find({
      locationId: { $in: locationIds },
      status: { $in: ["Booked", "Finished"] }
    });

    let totalEarnings = 0;
    const earningsByLocation = {};

    bookings.forEach(b => {
      totalEarnings += b.totalAmount;

      if (!earningsByLocation[b.locationName]) {
        earningsByLocation[b.locationName] = 0;
      }
      earningsByLocation[b.locationName] += b.totalAmount;
    });

    const perLocation = Object.keys(earningsByLocation).map(name => ({
      name,
      amount: earningsByLocation[name]
    }));

    res.json({
      totalEarnings,
      perLocation
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
