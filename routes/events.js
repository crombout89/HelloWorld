const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const WallPost = require("../models/post");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");
const { sendNotification } = require("../services/notificationService");

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

  // Group RSVP attendees by status
  const usersInRSVP = rawEvent.rsvp?.map(r => r.user) || [];
  const allUsers = await User.find({ _id: { $in: usersInRSVP } }).lean();

  const groupedAttendees = {};
  rawEvent.rsvp?.forEach(r => {
    const user = allUsers.find(u => u._id.toString() === r.user.toString());
    if (!user) return;
    if (!groupedAttendees[r.status]) groupedAttendees[r.status] = [];
    groupedAttendees[r.status].push(user);
  });

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
    groupedAttendees,
  });
});

// GET: Manage events
router.get("/events/:id/manage", isLoggedIn, async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate("invitees")
    .populate("attendees")
    .lean();
  if (!event) return res.status(404).render("404");

  const isHost =
    event.hostType === "User" && event.host.toString() === req.session.userId;
  if (!isHost) return res.status(403).render("403", { title: "Access Denied" });

  const User = require("../models/user");
  const allUsers = await User.find({ _id: { $nin: event.invitees } }).lean();

  res.render("events/manage", {
    event,
    invitees: event.invitees,
    attendees: event.attendees,
    users: allUsers,
    title: `Manage Invites for ${event.title}`,
    layout: false,
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
  const user = await User.findById(userId);
  const hostUser = await User.findById(event.host);

  await sendNotification(
    {
      userId: hostUser._id,
      message: `${user.username} RSVP'd as "${status}" to your event "${event.title}"`,
      link: `/events/${event._id}`,
      meta: {
        type: "event_rsvp",
        status,
        eventId: event._id,
        from: userId,
      },
    },
    req.app.get("io")
  );
  res.redirect(`/events/${req.params.id}`);
});

// POST: Invite a user to an event
router.post("/events/:id/invite", isLoggedIn, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    const userId = req.body.userId;

    // Only user-hosted events are editable right now
    const isHost =
      event.hostType === "User" && event.host.toString() === req.session.userId;

    if (!isHost) return res.status(403).send("Not authorized");

    if (!event.invitees.includes(userId)) {
      event.invitees.push(userId);
      await event.save();
      await sendNotification(
        {
          userId, // the person being invited
          message: `${inviter.username} invited you to the event "${event.title}"`,
          link: `/events/${event._id}`,
          meta: {
            type: "event_invite",
            invitedBy: inviter._id,
            eventId: event._id,
          },
        },
        req.app.get("io")
      );
    }

    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error inviting user");
  }
});

// Remove invitee from event
router.post("/events/:id/remove", isLoggedIn, async (req, res) => {
  const { userId } = req.body;

  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    event.invitees = event.invitees.filter(
      id => id.toString() !== userId.toString()
    );
    event.attendees = event.attendees.filter(
      id => id.toString() !== userId.toString()
    );

    event.rsvp = event.rsvp.filter(
      r => r.user.toString() !== userId.toString()
    );

    await event.save();
    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error removing user");
  }
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
