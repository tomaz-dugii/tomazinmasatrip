#!/usr/bin/env node
/**
 * Add fmContentType to blog posts based on contentType:
 * - contentType: Blog -> fmContentType: blog-post
 * - contentType: Vlog -> fmContentType: vlog-post
 * Only adds if fmContentType is missing.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dirname, "../src/content/blog");

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

function addFmContentType(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const { data: fm, content: body } = matter(content);

  if (fm.fmContentType) return false;

  const contentType = fm.contentType;
  if (contentType === "Blog") {
    fm.fmContentType = "blog-post";
  } else if (contentType === "Vlog") {
    fm.fmContentType = "vlog-post";
  } else {
    return false;
  }

  const newContent = matter.stringify(body, fm, { lineWidth: -1 });
  fs.writeFileSync(filePath, newContent, "utf-8");
  return true;
}

function main() {
  const files = collectMdFiles(BLOG_DIR);
  let updated = 0;

  for (const fp of files) {
    if (addFmContentType(fp)) {
      updated++;
      console.log(`Updated: ${path.relative(BLOG_DIR, fp)}`);
    }
  }

  console.log(`\nDone. Updated ${updated} files.`);
}

main();
