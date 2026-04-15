#!/usr/bin/env node
/**
 * Populate galleryImages for posts that have <!-- gallery --> in body.
 * Discovers images from public/images/blog/<dir>/, filters out thumbnail/header/feature,
 * writes paths to frontmatter, and removes the gallery comment.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ASTRO_ROOT, "src/content/blog");
const PUBLIC_IMAGES = path.join(ASTRO_ROOT, "public/images/blog");

const EXCLUDE_PATTERNS = ["thumbnail", "header", "feature"];

function extractDirFromPath(imgPath) {
  if (!imgPath || typeof imgPath !== "string") return null;
  const parts = imgPath.split("/").filter(Boolean);
  const blogIdx = parts.indexOf("blog");
  if (blogIdx >= 0 && blogIdx < parts.length - 1) {
    return parts[blogIdx + 1];
  }
  return null;
}

function resolveImageDir(slug, thumbnail, featureImage) {
  const fromThumb = extractDirFromPath(thumbnail);
  if (fromThumb) return fromThumb;
  const fromFeature = extractDirFromPath(featureImage);
  if (fromFeature) return fromFeature;
  return slug.replace(/-/g, "_");
}

function isExcluded(filename) {
  const lower = filename.toLowerCase();
  return EXCLUDE_PATTERNS.some((p) => lower.includes(p));
}

function findImageDir(dirName) {
  const exact = path.join(PUBLIC_IMAGES, dirName);
  if (fs.existsSync(exact) && fs.statSync(exact).isDirectory()) {
    return dirName;
  }
  const lower = dirName.toLowerCase();
  const entries = fs.readdirSync(PUBLIC_IMAGES, { withFileTypes: true });
  const found = entries.find(
    (e) => e.isDirectory() && e.name.toLowerCase() === lower
  );
  return found ? found.name : null;
}

function getGalleryImages(dirName) {
  const resolved = findImageDir(dirName);
  if (!resolved) return [];
  const dirPath = path.join(PUBLIC_IMAGES, resolved);
  const files = fs.readdirSync(dirPath);
  const images = files
    .filter((f) => !isExcluded(f))
    .filter((f) => /\.(webp|jpg|jpeg|png|gif|avif)$/i.test(f))
    .sort()
    .map((f) => `/images/blog/${resolved}/${f}`);
  return images;
}

function removeGalleryComment(body) {
  return body
    .replace(/\n*\s*<!--\s*gallery\s*-->\s*\n*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function collectMdFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectMdFiles(full, files);
    } else if (e.name.endsWith(".md") && !e.name.startsWith(".")) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const files = collectMdFiles(BLOG_DIR);
  let updated = 0;

  for (const fp of files) {
    const content = fs.readFileSync(fp, "utf-8");
    const { data: fm, content: body } = matter(content);

    if (!body.includes("<!-- gallery -->")) continue;

    const slug = path.basename(fp, ".md");
    const dirName = resolveImageDir(
      slug,
      fm.thumbnail,
      fm.featureImage
    );
    const images = getGalleryImages(dirName);

    const newFm = { ...fm };
    if (images.length > 0) {
      newFm.galleryImages = images;
    }

    const newBody = removeGalleryComment(body);
    const newContent = matter.stringify(newBody, newFm, { lineWidth: -1 });
    fs.writeFileSync(fp, newContent, "utf-8");
    updated++;
    console.log(
      `Updated: ${path.relative(BLOG_DIR, fp)} (${images.length} images)`
    );
  }

  console.log(`\nDone. Updated ${updated} files.`);
}

main();
