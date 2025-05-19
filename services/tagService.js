const Tag = require("../models/tag");

// Ensures tag exists or creates it if needed
async function findOrCreateTag(name, userId = null) {
  const cleaned = name.trim();
  const slug = cleaned.toLowerCase().replace(/\s+/g, "-");

  let tag = await Tag.findOne({ slug });
  if (!tag) {
    tag = await Tag.create({ name: cleaned, slug, createdBy: userId });
  }
  return tag;
}

// Converts a list of raw names to tag objects
async function resolveTags(tagNames = [], userId = null) {
  const results = [];
  for (const name of tagNames) {
    if (name.trim()) {
      const tag = await findOrCreateTag(name, userId);
      results.push(tag);
    }
  }
  return results;
}

module.exports = { findOrCreateTag, resolveTags };
