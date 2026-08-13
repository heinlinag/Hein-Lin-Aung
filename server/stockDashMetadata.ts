import {
  getStockDashCanonicalUrl,
  getStockDashPageMetadata,
  getStockDashStructuredData,
  STOCK_DASH_OG_IMAGE_URL,
} from "@shared/stockDashPageMetadata";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function applyStockDashRouteMetadata(template: string, pathname: string) {
  const metadata = getStockDashPageMetadata(pathname);
  const canonicalUrl = getStockDashCanonicalUrl(pathname);
  const structuredData = getStockDashStructuredData(pathname);
  const structuredDataTag = structuredData
    ? `<script id="stock-dash-json-ld" type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>`
    : "";
  const robots = metadata.indexable ? "index,follow" : "noindex,nofollow";

  const replacementTags = [
    `<meta name="description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:site_name" content="Stock Dash" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta property="og:url" content="${escapeHtml(canonicalUrl)}" />`,
    `<meta property="og:image" content="${STOCK_DASH_OG_IMAGE_URL}" />`,
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`,
    `<meta name="twitter:image" content="${STOCK_DASH_OG_IMAGE_URL}" />`,
    structuredDataTag,
  ].join("\n    ");

  return template
    .replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace("<!-- STOCK_DASH_ROUTE_METADATA -->", replacementTags);
}
