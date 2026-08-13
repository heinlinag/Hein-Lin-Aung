import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputPath = path.join(projectRoot, "client/public/sitemap.xml");

const publicPages = [
  { path: "/", source: "client/src/pages/Home.tsx", changefreq: "weekly", priority: "1.0" },
  { path: "/docs", source: "client/src/pages/Documentation.tsx", changefreq: "monthly", priority: "0.7" },
  { path: "/help", source: "client/src/pages/HelpCenter.tsx", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", source: "client/src/pages/FAQ.tsx", changefreq: "monthly", priority: "0.6" },
  { path: "/status", source: "client/src/pages/SystemStatus.tsx", changefreq: "daily", priority: "0.5" },
];

function getLastModifiedDate(sourcePath) {
  try {
    const gitDate = execFileSync("git", ["log", "-1", "--format=%cs", "--", sourcePath], {
      cwd: projectRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(gitDate)) return gitDate;
  } catch {
    // Use the source file timestamp for worktrees that have not been committed yet.
  }

  return fs.statSync(path.join(projectRoot, sourcePath)).mtime.toISOString().slice(0, 10);
}

const sitemapEntries = publicPages.map((page) => {
  const canonicalUrl = `https://stockdash.click${page.path}`;
  return [
    "  <url>",
    `    <loc>${canonicalUrl}</loc>`,
    `    <lastmod>${getLastModifiedDate(page.source)}</lastmod>`,
    `    <changefreq>${page.changefreq}</changefreq>`,
    `    <priority>${page.priority}</priority>`,
    "  </url>",
  ].join("\n");
});

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
  '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
  '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">',
  ...sitemapEntries,
  "</urlset>",
  "",
].join("\n");

fs.writeFileSync(outputPath, sitemap, "utf8");
console.log(`Generated sitemap.xml with ${publicPages.length} canonical public routes.`);
