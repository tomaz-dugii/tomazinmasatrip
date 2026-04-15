#!/usr/bin/env node
/**
 * Seed taxonomyDb.json with starter values from taxonomy.json.
 * Merges: ensures all starter values exist, preserves user-added values.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const TAXONOMY_JSON = path.join(ROOT, "taxonomy.json");
const TAXONOMY_DB = path.join(ROOT, ".frontmatter/database/taxonomyDb.json");

function loadJson(filePath, defaultValue = {}) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function mergeArrays(starter, existing) {
  const set = new Set(existing || []);
  for (const item of starter) {
    set.add(item);
  }
  return [...set];
}

function main() {
  const taxonomy = loadJson(TAXONOMY_JSON);
  if (!taxonomy.destinations || !taxonomy.tags) {
    console.error("taxonomy.json must have 'destinations' and 'tags' arrays");
    process.exit(1);
  }

  const db = loadJson(TAXONOMY_DB, { taxonomy: {} });
  const current = db.taxonomy || {};

  const categories = mergeArrays(taxonomy.destinations, current.categories);
  const tags = mergeArrays(taxonomy.tags, current.tags);

  const output = {
    taxonomy: {
      categories,
      tags,
    },
  };

  fs.mkdirSync(path.dirname(TAXONOMY_DB), { recursive: true });
  fs.writeFileSync(TAXONOMY_DB, JSON.stringify(output, null, 2) + "\n", "utf8");
  console.log(
    `Seeded taxonomyDb.json: ${categories.length} categories, ${tags.length} tags`,
  );
}

main();
