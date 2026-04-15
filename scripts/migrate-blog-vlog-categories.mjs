/**
 * One-off: ensure each post has `Blog` or `Vlog` in `categories` (inserted after `categories:`).
 * Run: node scripts/migrate-blog-vlog-categories.mjs
 */
import fs from "node:fs";
import path from "node:path";

const blogDir = path.resolve("src/content/blog");

function isVlogFrontmatter(fm) {
  if (/^contentType:\s*Vlog\s*$/m.test(fm)) return true;
  if (/^video:\s*true\s*$/m.test(fm)) return true;
  return false;
}

function hasCategoryLine(fm, name) {
  return new RegExp(`^\\s*-\\s*${name}\\s*$`, "m").test(fm);
}

function insertTypeCategory(fm, typeSlug) {
  if (hasCategoryLine(fm, "Blog") || hasCategoryLine(fm, "Vlog")) return fm;

  const lines = fm.split("\n");
  const catIdx = lines.findIndex((l) => /^categories:\s*$/.test(l));
  if (catIdx !== -1) {
    const next = lines[catIdx + 1];
    if (
      next &&
      (/^\s*-\s*Blog\s*$/.test(next) || /^\s*-\s*Vlog\s*$/.test(next))
    ) {
      return fm;
    }
    lines.splice(catIdx + 1, 0, `  - ${typeSlug}`);
    return lines.join("\n");
  }

  const emptyArrIdx = lines.findIndex((l) => /^categories:\s*\[\s*\]\s*$/.test(l));
  if (emptyArrIdx !== -1) {
    lines[emptyArrIdx] = "categories:";
    lines.splice(emptyArrIdx + 1, 0, `  - ${typeSlug}`);
    return lines.join("\n");
  }

  console.warn("skip (no categories: block):", fm.slice(0, 80));
  return fm;
}

function processFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  if (!raw.startsWith("---")) return;
  const end = raw.indexOf("\n---\n", 3);
  if (end === -1) return;
  const fm = raw.slice(3, end + 1);
  const body = raw.slice(end + 4);
  const typeSlug = isVlogFrontmatter(fm) ? "Vlog" : "Blog";
  const newFm = insertTypeCategory(fm, typeSlug);
  if (newFm === fm && !hasCategoryLine(fm, "Blog") && !hasCategoryLine(fm, "Vlog")) {
    return;
  }
  if (newFm !== fm) {
    fs.writeFileSync(filePath, `---${newFm}\n---${body}`, "utf8");
    console.log("updated", path.relative(process.cwd(), filePath));
  }
}

function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (name.endsWith(".md")) processFile(p);
  }
}

walk(blogDir);
