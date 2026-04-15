import taxonomy from "../../taxonomy.json";

/** Canonical strings for post type inside `categories` (and legacy filters). */
export const CONTENT_TYPES = ["Blog", "Vlog"] as const;

export type ContentTypeSlug = (typeof CONTENT_TYPES)[number];

export const DESTINATION_ORDER = taxonomy.destinations as readonly string[];

/** Full ordered list including type slugs (used for redirects / legacy, not blog chip UI). */
export const CATEGORY_FILTERS = [
  "Vse",
  ...CONTENT_TYPES,
  ...DESTINATION_ORDER,
] as const;

// --- Post shape used across listings (keeps imports simple) ---

export type PostForCategory = {
  data: {
    contentType?: string;
    categories?: string[];
  };
};

// --- Post type: prefer `categories`, fall back to `contentType` until all MD is migrated ---

/**
 * Vlog = `categories` contains "Vlog", or legacy `contentType: Vlog` without Blog in categories.
 */
export function isVlogPost(post: PostForCategory): boolean {
  const cats = post.data.categories || [];
  if (cats.includes("Vlog")) return true;
  if (cats.includes("Blog")) return false;
  return post.data.contentType === "Vlog";
}

/**
 * Blog = `categories` contains "Blog", or legacy `contentType: Blog` / untyped non-vlog.
 */
export function isBlogPost(post: PostForCategory): boolean {
  const cats = post.data.categories || [];
  if (cats.includes("Blog")) return true;
  if (cats.includes("Vlog")) return false;
  if (post.data.contentType === "Blog") return true;
  if (post.data.contentType === "Vlog") return false;
  return !post.data.contentType;
}

// --- Destination chips: exclude main type labels from union ---

function destinationStringsFromPosts(posts: PostForCategory[]): string[] {
  const out = new Set<string>();
  for (const p of posts) {
    for (const c of p.data.categories || []) {
      if (!CONTENT_TYPES.includes(c as ContentTypeSlug)) out.add(c);
    }
  }
  return [...out];
}

/** Order: taxonomy destinations that appear, then any other slugs from posts. */
function orderDestinationSlugs(slugs: Set<string>): string[] {
  const known = new Set(DESTINATION_ORDER);
  const ordered = DESTINATION_ORDER.filter((d) => slugs.has(d));
  const extras = [...slugs].filter((s) => !known.has(s as (typeof DESTINATION_ORDER)[number]));
  extras.sort();
  return [...ordered, ...extras];
}

/**
 * Chip list for /blog hub: "Vse" plus **all** taxonomy destinations (same set as home carousel),
 * then any extra destination strings on blog posts that are not in taxonomy.
 * Unused destinations still get a chip and a real page with an empty-state message (no 404).
 */
export function getBlogFilterChips(published: PostForCategory[]): string[] {
  const blogs = published.filter(isBlogPost);
  const fromPosts = new Set(destinationStringsFromPosts(blogs));
  const known = new Set(DESTINATION_ORDER);
  const extras = [...fromPosts].filter(
    (s) => !known.has(s as (typeof DESTINATION_ORDER)[number]),
  );
  extras.sort();
  return ["Vse", ...DESTINATION_ORDER, ...extras];
}

/**
 * Chip list for /vlogi hub: "Vse" plus destinations that appear on **vlog** posts only.
 */
export function getVlogFilterChips(published: PostForCategory[]): string[] {
  const vlogs = published.filter(isVlogPost);
  const slugs = new Set(destinationStringsFromPosts(vlogs));
  return ["Vse", ...orderDestinationSlugs(slugs)];
}

/** Slugs under /blog/category/* — every blog chip except "Vse" (includes unused taxonomy destinations). */
export function getBlogCategoryPathSlugs(published: PostForCategory[]): string[] {
  return getBlogFilterChips(published).filter((c) => c !== "Vse");
}

/** Slugs for /vlogi/category/* (destinations used by at least one vlog post). */
export function getVlogCategoryPathSlugs(published: PostForCategory[]): string[] {
  return orderDestinationSlugs(new Set(destinationStringsFromPosts(published.filter(isVlogPost))));
}

/**
 * Main column on blog hub category URLs: **blog posts only**, optional destination filter.
 * Legacy `/blog/category/Blog` is treated as "all blogs" (prefer redirect to `/blog`).
 */
export function matchesBlogCategoryPage(
  post: PostForCategory,
  category: string,
): boolean {
  if (!isBlogPost(post)) return false;
  if (category === "Blog" || category === "Vse") return true;
  if (category === "Vlog") return false;
  return (post.data.categories || []).includes(category);
}

/**
 * Main column on vlog hub category URLs: **vlog posts only**, optional destination filter.
 */
export function matchesVlogCategoryPage(
  post: PostForCategory,
  category: string,
): boolean {
  if (!isVlogPost(post)) return false;
  if (category === "Blog" || category === "Vse") return true;
  if (category === "Vlog") return false;
  return (post.data.categories || []).includes(category);
}

// --- Filter matching (sidebar, RSS, legacy) ---

/** @deprecated Prefer getBlogFilterChips / getVlogFilterChips for UI chips. */
export function getFilterList(postCategories: string[]): string[] {
  const fromPosts = postCategories.filter(
    (c) => !CONTENT_TYPES.includes(c as ContentTypeSlug),
  );
  const known = new Set(DESTINATION_ORDER);
  const newOnes = fromPosts.filter(
    (c) => !known.has(c as (typeof DESTINATION_ORDER)[number]),
  );
  return ["Vse", ...CONTENT_TYPES, ...DESTINATION_ORDER, ...newOnes];
}

/**
 * Match a single filter chip or RSS category.
 * Blog/Vlog use `categories` + legacy `contentType` (no `video` flag).
 */
export function matchesCategory(
  post: PostForCategory,
  category: string,
): boolean {
  if (category === "Vse") return true;
  if (category === "Blog") return isBlogPost(post);
  if (category === "Vlog") return isVlogPost(post);
  return (post.data.categories || []).includes(category);
}
