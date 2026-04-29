const express = require("express");
const { requireAuth } = require("../auth");
const { Message } = require("../db");

const router = express.Router();

router.use(requireAuth);

router.get("/:roomId/messages", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { withUser } = req.query;

    if (!withUser) {
      return res.status(400).json({ error: "withUser query param is required" });
    }

    const messages = await Message.find({
      room_id: roomId,
      $or: [
        { sender_id: req.user._id, receiver_id: withUser },
        { sender_id: withUser, receiver_id: req.user._id },
      ],
    })
      .sort({ created_at: 1 })
      .limit(50)
      .populate("sender_id", "_id name username avatar_color");

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch messages", detail: error.message });
  }
});

module.exports = router;
