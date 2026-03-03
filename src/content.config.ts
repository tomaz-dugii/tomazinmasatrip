import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      heroImage: image().optional(),
      draft: z.preprocess(
        (v) =>
          v === true || v === "true"
            ? true
            : v === false || v === "false" || v === ""
              ? false
              : false,
        z.boolean().optional(),
      ),
      contentType: z.enum(["Blog", "Vlog"]).optional(),
      tags: z.array(z.string()).optional(),
      categories: z.array(z.string()).optional(),
      video: z.preprocess(
        (v) =>
          v === true || v === "true"
            ? true
            : v === false || v === "false" || v === ""
              ? false
              : false,
        z.boolean().optional(),
      ),
      featured: z.preprocess(
        (v) =>
          v === true || v === "true"
            ? true
            : v === false || v === "false" || v === ""
              ? false
              : false,
        z.boolean().optional(),
      ),
      authorId: z.string().optional(),
      readTime: z.string().optional(),
      thumbnail: z.string().optional(),
      featureImage: z.string().optional(),
      youtubeUrl: z.string().optional(),
      showOnSidebar: z.preprocess(
        (v) =>
          v === true || v === "true"
            ? true
            : v === false || v === "false" || v === ""
              ? false
              : false,
        z.boolean().optional(),
      ),
      galleryImages: z.array(z.string()).optional(),
    }),
});

export const collections = { blog };
