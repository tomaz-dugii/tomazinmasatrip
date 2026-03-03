#!/usr/bin/env node
/**
 * Migrate Hugo content (posts + videos) to Astro src/content/blog
 * - Maps date -> pubDate, normalizes image paths
 * - Extracts {{< youtube ID >}} to youtubeUrl, replaces with iframe
 * - Replaces {{< gallery >}} with empty string
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(__dirname, "..");
const HUGO_ROOT = path.resolve(ASTRO_ROOT, "../tomazinmasatrip");
const ASTRO_BLOG = path.resolve(ASTRO_ROOT, "src/content/blog");

function normalizeImagePath(p) {
  if (!p || typeof p !== "string") return p;
  const trimmed = p.trim();
  if (!trimmed) return p;
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function slugFromPath(filePath, baseDir) {
  const relative = path.relative(baseDir, filePath);
  const name = path.basename(filePath, ".md");
  if (name === "index") {
    return path.basename(path.dirname(filePath));
  }
  const dir = path.dirname(relative);
  return dir === "." ? name : path.join(dir, name).replace(/\\/g, "/");
}

function extractYoutubeId(body) {
  const match = body.match(/\{\{<\s*youtube\s+([A-Za-z0-9_-]+)\s*>\}\}/);
  return match ? match[1] : null;
}

function transformBody(body, isVideo) {
  let result = body;

  // Replace {{< youtube ID >}} with iframe
  result = result.replace(
    /\{\{<\s*youtube\s+([A-Za-z0-9_-]+)\s*>\}\}/g,
    (_, id) => {
      return `\n\n<iframe width="560" height="315" src="https://www.youtube.com/embed/${id}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>\n\n`;
    },
  );

  // Replace {{< gallery >}} with empty string (gallery driven by frontmatter galleryImages)
  result = result.replace(/\{\{<\s*gallery\s*>\}\}/g, "");

  return result.trim();
}

function mapFrontmatter(fm, isVideo) {
  const mapped = {
    title: fm.title || "Untitled",
    pubDate: fm.date
      ? new Date(fm.date).toISOString()
      : new Date().toISOString(),
    draft: fm.draft ?? false,
    tags: fm.tags || [],
    categories: fm.categories || [],
    video: isVideo ? true : (fm.video ?? false),
    secondAuthor: fm.secondAuthor === true || fm.secondAuthor === "true",
    readTime: fm.readTime,
    thumbnail: normalizeImagePath(fm.thumbnail),
    featureImage: normalizeImagePath(fm.featureImage),
    showOnSidebar: fm.showOnSidebar ?? fm.tranding ?? false,
  };

  if (fm.description != null && fm.description !== "")
    mapped.description = String(fm.description);

  // Drop preview, type, keywords
  return mapped;
}

function collectMdFiles(dir, baseDir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectMdFiles(full, baseDir, files);
    } else if (e.name.endsWith(".md") && !e.name.startsWith(".")) {
      files.push(full);
    }
  }
  return files;
}

function slugToFilename(slug) {
  // Sanitize for filesystem: remove emoji, replace spaces/commas with hyphens
  return (
    slug
      .replace(/[\s,]+/g, "-")
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, "") // remove emoji
      .replace(/[^\p{L}\p{N}-]/gu, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "untitled"
  );
}

function migrateFile(filePath, baseDir, isVideo) {
  const content = fs.readFileSync(filePath, "utf-8");
  const { data: fm, content: body } = matter(content);

  const youtubeId = extractYoutubeId(body);
  const transformedBody = transformBody(body, isVideo);

  const mapped = mapFrontmatter(fm, isVideo);
  if (youtubeId) {
    mapped.youtubeUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  }

  const slug = slugFromPath(filePath, baseDir);
  const safeSlug = slugToFilename(slug) || slug.replace(/[^\w-]/g, "-");
  const outPath = path.join(ASTRO_BLOG, `${safeSlug}.md`);

  const newContent = matter.stringify(transformedBody, mapped, {
    lineWidth: -1,
  });

  return { outPath, slug: safeSlug, content: newContent };
}

function main() {
  const postsDir = path.join(HUGO_ROOT, "content", "posts");
  const videosDir = path.join(HUGO_ROOT, "content", "videos");

  if (!fs.existsSync(postsDir) && !fs.existsSync(videosDir)) {
    console.error("Hugo content directories not found");
    process.exit(1);
  }

  if (!fs.existsSync(ASTRO_BLOG)) {
    fs.mkdirSync(ASTRO_BLOG, { recursive: true });
  }

  const postFiles = collectMdFiles(postsDir, postsDir);
  const videoFiles = collectMdFiles(videosDir, videosDir);

  const seen = new Set();
  let migrated = 0;
  let skipped = 0;

  for (const fp of postFiles) {
    const { outPath, slug, content } = migrateFile(fp, postsDir, false);
    const key = path.basename(outPath);
    if (seen.has(key)) {
      console.warn(`Skipping duplicate slug: ${slug}`);
      skipped++;
      continue;
    }
    seen.add(key);
    fs.writeFileSync(outPath, content, "utf-8");
    console.log(`Migrated post: ${slug}`);
    migrated++;
  }

  for (const fp of videoFiles) {
    const { outPath, slug, content } = migrateFile(fp, videosDir, true);
    const key = path.basename(outPath);
    if (seen.has(key)) {
      console.warn(`Skipping duplicate slug: ${slug}`);
      skipped++;
      continue;
    }
    seen.add(key);
    fs.writeFileSync(outPath, content, "utf-8");
    console.log(`Migrated video: ${slug}`);
    migrated++;
  }

  console.log(
    `\nDone. Migrated ${migrated} files, skipped ${skipped} duplicates.`,
  );
}

main();
