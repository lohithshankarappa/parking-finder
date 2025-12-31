const r = require("express").Router();
const Location = require("../models/Location");
const Booking = require("../models/Booking");
const User = require("../models/User");
const auth = require("../middleware/auth");

/* =======================
   BOOKING NUMBER GENERATOR
======================= */
function generateBookingNumber() {
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `PE-${Date.now()}-${rand}`;
}

/* =======================
   ADD LOCATION (OWNER)
======================= */
r.post("/", auth, async (req, res) => {
  try {
    const { name, area, address, totalSlots } = req.body;

    if (!name || !area || !address || !totalSlots) {
      return res.status(400).json({ message: "All fields required" });
    }

    const loc = await Location.create({
      name,
      area,
      address,
      totalSlots,
      availableSlots: totalSlots,
      owner: req.user.id
    });

    res.json(loc);
  } catch (err) {
    console.error("Add location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET ALL LOCATIONS
======================= */
r.get("/", auth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.area) {
      filter.area = { $regex: req.query.area, $options: "i" };
    }

    const locations = await Location.find(filter);
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   GET MY LOCATIONS (ADMIN)
======================= */
r.get("/my", auth, async (req, res) => {
  try {
    const locations = await Location.find({ owner: req.user.id });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   UPDATE LOCATION (OWNER)
======================= */
r.put("/:id", auth, async (req, res) => {
  try {
    const { name, area, address, totalSlots } = req.body;

    const loc = await Location.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!loc) return res.sendStatus(404);

    // Adjust available slots safely
    const diff = totalSlots - loc.totalSlots;
    loc.availableSlots = Math.max(0, loc.availableSlots + diff);

    loc.name = name;
    loc.area = area;
    loc.address = address;
    loc.totalSlots = totalSlots;

    await loc.save();
    res.json({ message: "Location updated" });
  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   DELETE LOCATION (OWNER)
======================= */
r.delete("/:id", auth, async (req, res) => {
  try {
    await Location.deleteOne({
      _id: req.params.id,
      owner: req.user.id
    });

    res.json({ message: "Location deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* =======================
   BOOK SLOT (WITH TICKET)
======================= */
r.post("/book/:id", auth, async (req, res) => {
  try {
    const { bookingDate, startTime, endTime } = req.body;

    if (!bookingDate || !startTime || !endTime) {
      return res.status(400).json({ message: "Date & time required" });
    }

    const location = await Location.findOneAndUpdate(
      { _id: req.params.id, availableSlots: { $gt: 0 } },
      { $inc: { availableSlots: -1 } },
      { new: true }
    );

    if (!location) {
      return res.status(400).json({ message: "No slots available" });
    }

    const user = await User.findById(req.user.id);

    await Booking.create({
      bookingNumber: generateBookingNumber(),
      userId: user._id,
      userName: user.name,
      locationId: location._id,
      locationName: location.name,
      area: location.area,
      address: location.address,
      bookingDate,
      startTime,
      endTime,
      status: "Booked"
    });

    res.json({ message: "Booking successful" });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = r;
