import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap { const lastModified = new Date(); return [
  { url: "https://www.deckforged.com/", lastModified, changeFrequency: "monthly", priority: 1 },
  { url: "https://www.deckforged.com/builder", lastModified, changeFrequency: "monthly", priority: 0.9 },
  { url: "https://www.deckforged.com/privacy", lastModified, changeFrequency: "yearly", priority: 0.2 },
  { url: "https://www.deckforged.com/terms", lastModified, changeFrequency: "yearly", priority: 0.2 },
]; }
