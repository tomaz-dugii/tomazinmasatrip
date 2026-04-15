/**
 * Canonical path builders for blog and vlog hub URLs.
 * Use everywhere (cards, sidebars, pagination, RSS) so routes stay consistent.
 */

export type BuildPostHrefOptions = {
  /** List page the user came from (appended as `?from=` for client-side “back” on the post). */
  from?: string;
};

/** Single blog post by collection entry id (file id / slug). Optional `from` preserves list context. */
export function buildPostHref(
  postId: string,
  options?: BuildPostHrefOptions,
): string {
  const segments = postId.split("/").map((s) => encodeURIComponent(s));
  const path = `/blog/${segments.join("/")}`;
  if (options?.from) {
    const q = new URLSearchParams({ from: options.from });
    return `${path}?${q.toString()}`;
  }
  return path;
}

/**
 * Same-origin path allowlist for `?from=` (open-redirect guard).
 * Duplicated in client script on the post page — keep rules in sync.
 */
export function isAllowedListFromPath(path: string): boolean {
  if (!path.startsWith("/")) return false;
  if (path.includes("//") || path.includes(":")) return false;
  return path.startsWith("/blog") || path.startsWith("/vlogi");
}

/** Category filter under /blog (not "Vse"). */
export function buildCategoryHref(category: string): string {
  if (category === "Vse") return "/blog";
  return `/blog/category/${encodeURIComponent(category)}`;
}

/** Paginated blog category listing; page 1 is the base category URL. */
export function buildCategoryPageHref(category: string, page: number): string {
  const base = buildCategoryHref(category);
  if (page <= 1) return base;
  return `${base}/page/${page}`;
}

/** Main blog listing pagination; page 1 is /blog. */
export function buildBlogPageHref(page: number): string {
  if (page <= 1) return "/blog";
  return `/blog/page/${page}`;
}

/** Vlog hub filtered by destination (not "Vse"). */
export function buildVlogCategoryHref(category: string): string {
  if (category === "Vse") return "/vlogi";
  return `/vlogi/category/${encodeURIComponent(category)}`;
}

/** Paginated vlog category listing. */
export function buildVlogCategoryPageHref(
  category: string,
  page: number,
): string {
  const base = buildVlogCategoryHref(category);
  if (page <= 1) return base;
  return `${base}/page/${page}`;
}
