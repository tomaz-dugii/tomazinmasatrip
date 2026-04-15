#!/usr/bin/env node
/**
 * Migrate blog posts from secondAuthor (boolean) to authorId (string).
 * - secondAuthor: true -> authorId: "masa"
 * - secondAuthor: false or missing -> authorId: "tomaz"
 * - Removes secondAuthor from frontmatter
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matter from "gray-matter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASTRO_ROOT = path.resolve(__dirname, "..");
const BLOG_DIR = path.join(ASTRO_ROOT, "src/content/blog");

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

function migrateFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const { data: fm, content: body } = matter(content);

  const secondAuthor = fm.secondAuthor === true || fm.secondAuthor === "true";
  const authorId = secondAuthor ? "masa" : "tomaz";

  const { secondAuthor: _, ...rest } = fm;
  const newFm = { ...rest, authorId };

  const newContent = matter.stringify(body, newFm, { lineWidth: -1 });
  return newContent;
}

function main() {
  if (!fs.existsSync(BLOG_DIR)) {
    console.error("Blog directory not found:", BLOG_DIR);
    process.exit(1);
  }

  const files = collectMdFiles(BLOG_DIR);
  let migrated = 0;

  for (const fp of files) {
    const newContent = migrateFile(fp);
    fs.writeFileSync(fp, newContent, "utf-8");
    migrated++;
    console.log(`Migrated: ${path.relative(ASTRO_ROOT, fp)}`);
  }

  console.log(`\nDone. Migrated ${migrated} files.`);
}

main();
