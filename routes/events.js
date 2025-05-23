127/4441// routes/events.js
const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const Community = require("../models/community");
const WallPost = require("../models/post");
const User = require("../models/user");
const { isLoggedIn } = require("../middleware/auth");
const { sendNotification } = require("../services/notificationService");
const { resolveTags } = require("../services/tagService");
const { getFriendsForUser } = require("../services/friendService");
const LocationIQ = require("../services/locationService");

// GET: All events you're hosting or invited to
router.get("/", isLoggedIn, async (req, res, next) => {
  try {
    const userId = req.session.userId;

    // Events you created
    const createdEvents = await Event.find({ host: userId })
      .sort({ startTime: 1 })
      .lean();

    // Events you're attending but not hosting
    const attendingEvents = await Event.find({
      attendees: userId,
      host: { $ne: userId },
    })
      .sort({ startTime: 1 })
      .lean();

    // Communities for the modal dropdown
   const communities = await Community.find({ members: userId })
      .sort({ name: 1 })
      .lean();

    res.render("events/index", {
      title: "My Events",
      createdEvents,
      attendingEvents,
      communities,
      includeLeaflet: true,
      currentUserId: userId,
      layout: "layout",
    });
  } catch (err) {
    console.error("❌ Error loading events:", err);
    next(err);
  }
});

// GET: New Event Form (standalone page)
router.get("/new", isLoggedIn, async (req, res, next) => {
  try {
    const communities = await Community.find({ members: req.session.userId })
      .sort({ name: 1 })
      .lean();

    res.render("events/new", {
      title: "Create New Event",
      event: {
        location: { name: "", address: "", latitude: "", longitude: "" },
      },
      communities,
      includeLeaflet: true,
      layout: false,
    });
  } catch (err) {
    console.error("❌ Error showing new-event form:", err);
    res.status(500).send("Event modal failed to load.");
  }
});

// POST: Create a new event
router.post("/create", isLoggedIn, async (req, res, next) => {
  const {
    title,
    description,
    locationName,
    locationAddress,
    startTime,
    endTime,
    visibility,
    communityId,
    tags,
    lat,
    lon,
  } = req.body;

  try {
    const tagNames = tags?.split(",").map(t => t.trim()).filter(Boolean);
    const resolvedTags = await resolveTags(tagNames, req.session.userId);

    const newEvent = await Event.create({
      title,
      description,
      hostType: "User",
      host: req.session.userId,
      location: {
        name: locationName,
        address: locationAddress,
        lat: parseFloat(lat) || 0,
        lon: parseFloat(lon) || 0,
      },
      startTime,
      endTime,
      visibility,
      community: communityId || null,
      tags: resolvedTags.map(t => t._id),
      invitees: [],
      attendees: [],
      rsvp: [],
    });

    res.redirect(`/events/${newEvent._id}`);
  } catch (err) {
    console.error("❌ Event creation error:", err);
    next(err);
  }
});

// GET: Single Event View
router.get("/:id", isLoggedIn, async (req, res, next) => {
  try {
    const userId = req.session.userId;
    const rawEvent = await Event.findById(req.params.id)
      .populate("tags")
      .populate("community", "name")
      .populate("host", "username")
      .lean();
    if (!rawEvent) return res.status(404).render("404");

    const isInvited = rawEvent.invitees.some(id => id.toString() === userId);
    const isAttending = rawEvent.attendees.some(id => id.toString() === userId);
    const isHost =
      rawEvent.hostType === "User" &&
      typeof rawEvent.host === "object" &&
      rawEvent.host._id?.toString() === userId;
    const canManage = isHost || isInvited || isAttending;
    const canPost = isHost || isAttending;
    const isVisible =
      rawEvent.visibility === "public" || isInvited || isHost || isAttending;
    if (!isVisible) return res.status(403).render("403", { title: "Access Denied" });

    const wallPosts = await WallPost.find({ event: rawEvent._id }).lean();

    // Group RSVP attendees by status
    const usersInRSVP = rawEvent.rsvp.map(r => r.user);
    const allUsers = await User.find({ _id: { $in: usersInRSVP } }).lean();
    const groupedAttendees = {};
    rawEvent.rsvp.forEach(r => {
      const u = allUsers.find(u => u._id.toString() === r.user.toString());
      if (!u) return;
      groupedAttendees[r.status] = groupedAttendees[r.status] || [];
      groupedAttendees[r.status].push(u);
    });

    res.render("events/view", {
      event: rawEvent,
      currentUserId: userId,
      title: rawEvent.title,
      wallPosts,
      isHost,
      isInvited,
      isAttending,
      canManage,
      canPost,
      canEdit: isHost,
      groupedAttendees,
      includeLeaflet: true,
    });
  } catch (err) {
    console.error("❌ Error loading event view:", err);
    next(err);
  }
});

// GET: Manage events
router.get("/:id/manage", isLoggedIn, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("invitees")
      .populate("attendees")
      .lean();
    if (!event) return res.status(404).render("404");

    const isHost =
      rawEvent.hostType === "User" &&
      typeof rawEvent.host === "object" &&
      rawEvent.host._id?.toString() === userId;
    if (!isHost) return res.status(403).render("403", { title: "Access Denied" });

    const friends = await getFriendsForUser(req.session.userId);
    res.render("events/manage", {
      event,
      invitees: event.invitees,
      attendees: event.attendees,
      friends,
      title: `Manage Invites for ${event.title}`,
      layout: false,
    });
  } catch (err) {
    console.error("❌ Error loading manage page:", err);
    next(err);
  }
});

// POST: RSVP to an event
router.post("/:id/rsvp", isLoggedIn, async (req, res, next) => {
  try {
    const { status } = req.body;
    const userId = req.session.userId;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    event.rsvp = event.rsvp.filter(r => r.user.toString() !== userId);
    event.rsvp.push({ user: userId, status });
    if (status === "going" && !event.attendees.includes(userId)) {
      event.attendees.push(userId);
    }
    await event.save();

    const user = await User.findById(userId);
    if (event.hostType === "User") {
      const hostUser = await User.findById(event.host);
      if (hostUser) {
        await sendNotification(
          {
            userId: hostUser._id,
            message: `${user.username} RSVP'd "${status}" to "${event.title}"`,
            link: `/events/${event._id}`,
            meta: { type: "event_rsvp", status, eventId: event._id, from: userId },
          },
          req.app.get("io")
        );
      }
    }

    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error("❌ RSVP error:", err);
    next(err);
  }
});

// POST: Invite a user to an event
router.post("/:id/invite", isLoggedIn, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");
    const inviterId = req.session.userId;
    const inviteeId = req.body.userId;

    // Only host can invite
    const isHost =
      event.hostType === "User" && event.host.toString() === inviterId;
    if (!isHost) return res.status(403).send("Not authorized");

    const friends = await getFriendsForUser(inviterId);
    if (!friends.some(f => f._id.toString() === inviteeId)) {
      return res.status(403).send("Can only invite friends");
    }

    if (!event.invitees.includes(inviteeId)) {
      event.invitees.push(inviteeId);
      await event.save();

      const inviter = await User.findById(inviterId);
      await sendNotification(
        {
          userId: inviteeId,
          message: `${inviter.username} invited you to "${event.title}"`,
          link: `/events/${event._id}`,
          meta: { type: "event_invite", invitedBy: inviter._id, eventId: event._id },
        },
        req.app.get("io")
      );
    }

    res.redirect(`/${req.params.id}`);
  } catch (err) {
    console.error("❌ Invite error:", err);
    next(err);
  }
});

// POST: Remove invitee from event
router.post("/:id/remove", isLoggedIn, async (req, res, next) => {
  try {
    const { userId: removeId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send("Event not found");

    event.invitees = event.invitees.filter(id => id.toString() !== removeId);
    event.attendees = event.attendees.filter(id => id.toString() !== removeId);
    event.rsvp = event.rsvp.filter(r => r.user.toString() !== removeId);
    await event.save();

    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error("❌ Remove invitee error:", err);
    next(err);
  }
});

// GET: Edit Event Form
router.get("/:id/edit", isLoggedIn, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).populate("tags").lean();
    if (!event) return res.status(404).render("404");
    res.render("events/edit", {
      event,
      title: `Edit: ${event.title}`,
      includeLeaflet: true,
    });
  } catch (err) {
    console.error("❌ Error showing edit form:", err);
    next(err);
  }
});

// POST: Update Event
router.post("/:id/edit", isLoggedIn, async (req, res, next) => {
  try {
    const {
      title,
      description,
      locationName,
      locationAddress,
      startTime,
      endTime,
      visibility,
      tags,
      lat,
      lon,
    } = req.body;

    const tagNames = tags?.split(",").map(t => t.trim()).filter(Boolean);
    const resolvedTags = await resolveTags(tagNames, req.session.userId);
    const location = {
      name: locationName,
      address: locationAddress,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
    };

    await Event.findByIdAndUpdate(req.params.id, {
      title,
      description,
      startTime,
      endTime,
      location,
      visibility,
      tags: resolvedTags.map(t => t._id),
    });

    res.redirect(`/events/${req.params.id}`);
  } catch (err) {
    console.error("❌ Update event error:", err);
    next(err);
  }
});

// POST: Delete Event Tag
router.post("/:id/tags/remove", isLoggedIn, async (req, res, next) => {
  try {
    const { tagId } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event || event.host.toString() !== req.session.userId) {
      return res.status(403).send("Not allowed");
    }
    event.tags = event.tags.filter(t => t.toString() !== tagId);
    await event.save();
    res.redirect(`/events/${req.params.id}/edit`);
  } catch (err) {
    console.error("❌ Remove tag error:", err);
    next(err);
  }
});

// POST: Delete Event
router.post("/:id/delete", isLoggedIn, async (req, res, next) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect("/events");
  } catch (err) {
    console.error("❌ Delete event error:", err);
    next(err);
  }
});

module.exports = router;
