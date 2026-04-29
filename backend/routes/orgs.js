const express = require("express");
const { requireAuth } = require("../auth");
const { Organization, OrgMember, Room } = require("../db");

const router = express.Router();

router.use(requireAuth);

router.post("/", async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ error: "name and slug are required" });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: "slug format is invalid" });
    }

    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      return res.status(409).json({ error: "slug already taken" });
    }

    const org = await Organization.create({
      name,
      slug,
      owner_id: req.user._id,
    });

    await OrgMember.create({
      org_id: org._id,
      user_id: req.user._id,
      role: "owner",
    });

    const room = await Room.create({
      org_id: org._id,
      name: "Main Room",
    });

    return res.status(201).json({ org, room });
  } catch (error) {
    return res.status(500).json({ error: "Failed to create organization", detail: error.message });
  }
});

router.get("/:slug", async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    const members = await OrgMember.find({ org_id: org._id })
      .populate("user_id", "_id name username avatar_color email")
      .lean();

    const rooms = await Room.find({ org_id: org._id }).lean();

    const isMember = members.some(
      (member) => String(member.user_id?._id) === String(req.user._id),
    );

    return res.status(200).json({ org, members, rooms, isMember });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch organization", detail: error.message });
  }
});

router.post("/:slug/join", async (req, res) => {
  try {
    const org = await Organization.findOne({ slug: req.params.slug });
    if (!org) {
      return res.status(404).json({ error: "Organization not found" });
    }

    await OrgMember.findOneAndUpdate(
      { org_id: org._id, user_id: req.user._id },
      { $setOnInsert: { org_id: org._id, user_id: req.user._id, role: "member" } },
      { upsert: true, new: true },
    );

    return res.status(200).json({ message: "Joined successfully" });
  } catch (error) {
    return res.status(500).json({ error: "Failed to join organization", detail: error.message });
  }
});

module.exports = router;
