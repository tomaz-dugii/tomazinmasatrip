#!/usr/bin/env node
/**
 * Add alt text to markdown images that have empty alt: ![]() -> ![alt](path)
 * Alt is derived from filename: underscores to spaces, capitalize words.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, "../src/content/blog");

function filenameToAlt(filepath) {
  const basename = path.basename(filepath, path.extname(filepath));
  return basename.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, "utf-8");
  const pattern = /!\[\]\(([^)]+)\)/g;
  let changed = false;

  content = content.replace(pattern, (match, imgPath) => {
    changed = true;
    const alt = filenameToAlt(imgPath);
    return `![${alt}](${imgPath})`;
  });

  if (changed) {
    fs.writeFileSync(filePath, content, "utf-8");
    return true;
  }
  return false;
}

function collectMdFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      collectMdFiles(full, files);
    } else if (e.name.endsWith(".md")) {
      files.push(full);
    }
  }
  return files;
}

function main() {
  const files = collectMdFiles(BLOG_DIR);
  let fixed = 0;

  for (const fp of files) {
    if (fixFile(fp)) {
      fixed++;
      console.log(`Fixed: ${path.relative(BLOG_DIR, fp)}`);
    }
  }

  console.log(`\nDone. Fixed ${fixed} files.`);
}

main();
