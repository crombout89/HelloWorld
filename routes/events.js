const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const WallPost = require("../models/post");
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
      hostType: "User",
      host: req.session.userId, // use the logged-in user as the host
      location: {
        name: req.body.locationName,
        address: req.body.locationAddress,
      },
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
  const userId = req.session.userId;
  const rawEvent = await Event.findById(req.params.id).lean();
  if (!rawEvent) return res.status(404).render("404");

  // Manually fetch the host based on type
  let populatedHost = null;
  if (rawEvent.hostType === "User") {
    const User = require("../models/user");
    populatedHost = await User.findById(rawEvent.host).lean();
  } else if (rawEvent.hostType === "Community") {
    const Community = require("../models/community");
    populatedHost = await Community.findById(rawEvent.host).lean();
  }

  // Attach host manually
  rawEvent.host = populatedHost;

  const isInvited = rawEvent.invitees?.some(id => id.toString() === userId);
  const isAttending = rawEvent.attendees?.some(id => id.toString() === userId);
  const isHost = rawEvent.host?._id?.toString() === userId;
  const canManage = isHost || isInvited || isAttending;
  const canPost = isHost || isAttending;
  const isVisible =
    rawEvent.visibility === "public" || isInvited || isHost || isAttending;

  if (!isVisible)
    return res.status(403).render("403", { title: "Access Denied" });

  const wallPosts = await WallPost.find({ event: rawEvent._id }).lean();

  res.render("events/view", {
    event: rawEvent,
    title: rawEvent.title,
    wallPosts,
    isHost,
    isInvited,
    isAttending,
    canManage,
    canPost,
    canEdit: isHost,
  });
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
