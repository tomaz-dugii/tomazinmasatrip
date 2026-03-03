import taxonomy from "../../taxonomy.json";

/**
 * Predefined filter order for Blog page.
 * Vse = show all (no category).
 * Blog, Vlog = content types (hardcoded).
 * Rest = destination categories (from posts; this order for known ones).
 */
export const CONTENT_TYPES = ["Blog", "Vlog"] as const;

export const DESTINATION_ORDER = taxonomy.destinations as readonly string[];

export const CATEGORY_FILTERS = [
  "Vse",
  ...CONTENT_TYPES,
  ...DESTINATION_ORDER,
] as const;

/** Build filter list: Vse, Blog, Vlog, then known destinations, then any new from posts */
export function getFilterList(postCategories: string[]): string[] {
  const fromPosts = postCategories.filter(
    (c) => !CONTENT_TYPES.includes(c as "Blog" | "Vlog"),
  );
  const known = new Set(DESTINATION_ORDER);
  const newOnes = fromPosts.filter(
    (c) => !known.has(c as (typeof DESTINATION_ORDER)[number]),
  );
  return ["Vse", ...CONTENT_TYPES, ...DESTINATION_ORDER, ...newOnes];
}

/** Check if post matches category filter (Blog/Vlog = contentType, else categories) */
export function matchesCategory(
  post: {
    data: { contentType?: string; video?: boolean; categories?: string[] };
  },
  category: string,
): boolean {
  if (category === "Vse") return true;
  if (category === "Blog") {
    return (
      post.data.contentType === "Blog" ||
      (!post.data.video && !post.data.contentType)
    );
  }
  if (category === "Vlog") {
    return post.data.contentType === "Vlog" || post.data.video === true;
  }
  return (post.data.categories || []).includes(category);
}
