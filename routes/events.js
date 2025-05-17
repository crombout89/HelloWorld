const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const { isLoggedIn } = require("../middleware/auth");

// GET: All events you're hosting or invited to
router.get("/events", isLoggedIn, async (req, res) => {
  const userId = req.session.userId;
  const events = await Event.find({
    $or: [{ host: userId }, { invitees: userId }, { attendees: userId }],
  })
    .sort({ startTime: 1 })
    .lean();

  res.render("events/index", { events, title: "My Events" });
});

// GET: New Event Form
router.get("/events/new", isLoggedIn, (req, res) => {
  res.render("events/new", { title: "Create Event" });
});

// POST: Create Event
router.post("/events/create", isLoggedIn, async (req, res) => {
  const {
    title,
    description,
    hostType,
    hostId,
    location,
    startTime,
    endTime,
    visibility,
  } = req.body;

  try {
    const newEvent = await Event.create({
      title,
      description,
      hostType,
      host: hostId,
      location,
      startTime,
      endTime,
      visibility,
      invitees: [],
      attendees: [],
      rsvp: [],
    });

    res.redirect(`/events/${newEvent._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create event");
  }
});

// GET: Single Event View
router.get("/events/:id", isLoggedIn, async (req, res) => {
  const event = await Event.findById(req.params.id).populate("host").lean();
  if (!event) return res.status(404).render("404");

  res.render("events/view", { event, title: event.title });
});

// POST: RSVP to an event
router.post("/events/:id/rsvp", isLoggedIn, async (req, res) => {
  const { status } = req.body;
  const userId = req.session.userId;

  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).send("Event not found");

  // Remove any existing RSVP from this user
  event.rsvp = event.rsvp.filter((r) => r.user.toString() !== userId);
  event.rsvp.push({ user: userId, status });

  if (status === "going" && !event.attendees.includes(userId)) {
    event.attendees.push(userId);
  }

  await event.save();
  res.redirect("back");
});

// GET: Edit Event Form
router.get("/events/:id/edit", isLoggedIn, async (req, res) => {
  const event = await Event.findById(req.params.id).lean();
  if (!event) return res.status(404).render("404");
  res.render("events/edit", { event, title: `Edit ${event.title}` });
});

// POST: Update Event
router.post("/events/:id/edit", isLoggedIn, async (req, res) => {
  try {
    const { title, description, startTime, endTime, location, visibility } =
      req.body;
    await Event.findByIdAndUpdate(req.params.id, {
      title,
      description,
      startTime,
      endTime,
      location,
      visibility,
    });
    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update event");
  }
});

// POST: Delete Event
router.post("/events/:id/delete", isLoggedIn, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect("/events");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to delete event");
  }
});

module.exports = router;