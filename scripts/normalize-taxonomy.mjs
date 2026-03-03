#!/usr/bin/env node
/**
 * Normalize taxonomy in blog posts:
 * - Add contentType from video (Blog/Vlog)
 * - Clean categories (remove Blog, Vlog, Videos; fix typos)
 * - Apply tag mappings
 * - Fix body-text typos
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.resolve(ASTRO_ROOT, "src/content/blog");

const CONTENT_TYPE_REMOVE = ["Blog", "Vlog", "Videos"];
const CATEGORY_MAP = {
  Japosnka: "Japonska",
  japonska: "Japonska",
  Taipei: "Taiwan",
  Videos: null, // remove
  "južna koreja": "Južna Koreja",
  "Južna koreja": "Južna Koreja",
};
const TAG_MAP = {
  japonska: "Japonska",
  "južna koreja": "Južna Koreja",
  "Južna koreja": "Južna Koreja",
  Videos: "vlog",
  Vlog: "vlog",
  travel: "potovanje",
};
const BODY_TYPOS = [
  ["Japosnka", "Japonska"],
  ["japosnko", "japonsko"],
];

function normalizeCategories(cats) {
  if (!Array.isArray(cats)) return [];
  return cats
    .map((c) => {
      const mapped = CATEGORY_MAP[c];
      if (mapped === null) return null;
      if (mapped) return mapped;
      if (CONTENT_TYPE_REMOVE.includes(c)) return null;
      return c;
    })
    .filter(Boolean);
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set();
  return tags
    .map((t) => TAG_MAP[t] ?? t)
    .filter((t) => {
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });
}

function fixBodyText(body) {
  if (!body || typeof body !== "string") return body;
  let result = body;
  for (const [from, to] of BODY_TYPOS) {
    result = result.split(from).join(to);
  }
  return result;
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const { data, content: body } = matter(content);

  const isVideo = data.video === true || data.video === "true";

  // Add contentType
  data.contentType = isVideo ? "Vlog" : "Blog";

  // Clean categories
  const rawCats = data.categories || [];
  data.categories = normalizeCategories(rawCats);

  // Special: Taipei -> Taiwan, add tag taipei
  if (rawCats.includes("Taipei")) {
    if (!data.tags) data.tags = [];
    if (!data.tags.includes("taipei")) data.tags.push("taipei");
  }

  // Normalize tags
  data.tags = normalizeTags(data.tags || []);

  // Fix body text
  const newBody = fixBodyText(body);

  const output = matter.stringify(newBody, data, {
    lineWidth: -1,
  });
  fs.writeFileSync(filePath, output, "utf8");
}

function main() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  console.log(`Processing ${files.length} files...`);
  let count = 0;
  for (const f of files) {
    processFile(path.join(BLOG_DIR, f));
    count++;
  }
  console.log(`Done. Updated ${count} files.`);
}

main();
