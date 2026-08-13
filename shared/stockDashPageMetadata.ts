export type StockDashPageMetadata = {
  title: string;
  description: string;
  canonicalPath: string;
  indexable: boolean;
};

export const STOCK_DASH_SITE_URL = "https://stockdash.click";
export const STOCK_DASH_DEFAULT_TITLE = "Stock Dash - Stock Management System";
export const STOCK_DASH_DEFAULT_DESCRIPTION =
  "Stock Dash Management System by HEiNANN. Created by HEiNANN";
export const STOCK_DASH_OG_IMAGE_URL =
  "https://stockdash.click/manus-storage/stock-dash-open-graph_5de04bac.png";

const publicPageMetadata: Record<string, Omit<StockDashPageMetadata, "canonicalPath">> = {
  "/": {
    title: STOCK_DASH_DEFAULT_TITLE,
    description: STOCK_DASH_DEFAULT_DESCRIPTION,
    indexable: true,
  },
  "/docs": {
    title: "Documentation | Stock Dash",
    description: "Explore Stock Dash guides for stock management, production orders, approvals, and daily workflows.",
    indexable: true,
  },
  "/help": {
    title: "Help Center | Stock Dash",
    description: "Find Stock Dash help, practical guides, troubleshooting steps, and administrator support options.",
    indexable: true,
  },
  "/faq": {
    title: "FAQ | Stock Dash",
    description: "Browse answers to frequently asked questions about Stock Dash stock management workflows.",
    indexable: true,
  },
  "/status": {
    title: "System Status | Stock Dash",
    description: "View Stock Dash service availability, operational status, maintenance information, and recent updates.",
    indexable: true,
  },
};

const applicationPageMetadata: Record<string, Omit<StockDashPageMetadata, "canonicalPath">> = {
  "/login": { title: "Login | Stock Dash", description: "Secure Stock Dash employee login.", indexable: false },
  "/submit-order": { title: "Add Stock NPRM | Stock Dash", description: "Create a Stock Dash NPRM stock entry.", indexable: false },
  "/submit-order/ai-scanner": { title: "AI Scanner | Stock Dash", description: "Scan a production label with Stock Dash.", indexable: false },
  "/stock-history": { title: "Stock History | Stock Dash", description: "Review Stock Dash stock history and production orders.", indexable: false },
  "/approval-center": { title: "NPRM Modify Order | Stock Dash", description: "Review NPRM Modify Orders in Stock Dash.", indexable: false },
  "/customer-sample": { title: "Customer Sample | Stock Dash", description: "Manage customer sample requests in Stock Dash.", indexable: false },
  "/qr-scanner": { title: "QR Scanner | Stock Dash", description: "Use the Stock Dash QR scanner.", indexable: false },
  "/notifications": { title: "Notifications | Stock Dash", description: "Review Stock Dash notifications.", indexable: false },
  "/chat": { title: "Messages | Stock Dash", description: "Open Stock Dash messages.", indexable: false },
  "/user-profile": { title: "My Profile | Stock Dash", description: "Manage your Stock Dash profile.", indexable: false },
  "/404": { title: "Page Not Found | Stock Dash", description: "The requested Stock Dash page could not be found.", indexable: false },
};

function normalizePath(pathname: string) {
  const path = pathname.split("?")[0].split("#")[0] || "/";
  return path !== "/" ? path.replace(/\/+$/, "") : path;
}

export function getStockDashPageMetadata(pathname: string): StockDashPageMetadata {
  const normalizedPath = normalizePath(pathname);

  if (normalizedPath.startsWith("/check.qr/")) {
    return {
      title: "Production Order | Stock Dash",
      description: "View shared production order details in Stock Dash.",
      canonicalPath: normalizedPath,
      indexable: false,
    };
  }

  if (normalizedPath === "/admin" || normalizedPath.startsWith("/admin/")) {
    return {
      title: "Admin Panel | Stock Dash",
      description: "Secure Stock Dash administration workspace.",
      canonicalPath: normalizedPath,
      indexable: false,
    };
  }

  const metadata = publicPageMetadata[normalizedPath] ?? applicationPageMetadata[normalizedPath];
  if (metadata) return { ...metadata, canonicalPath: normalizedPath };

  return {
    title: "Page Not Found | Stock Dash",
    description: "The requested Stock Dash page could not be found.",
    canonicalPath: normalizedPath,
    indexable: false,
  };
}

export function getStockDashCanonicalUrl(pathname: string) {
  const { canonicalPath } = getStockDashPageMetadata(pathname);
  return `${STOCK_DASH_SITE_URL}${canonicalPath === "/" ? "/" : canonicalPath}`;
}

export function getStockDashStructuredData(pathname: string): Record<string, unknown> | null {
  const metadata = getStockDashPageMetadata(pathname);
  if (!metadata.indexable) return null;

  const canonicalUrl = getStockDashCanonicalUrl(pathname);
  const publisher = {
    "@type": "Organization",
    name: "Stock Dash",
    url: STOCK_DASH_SITE_URL,
    logo: STOCK_DASH_OG_IMAGE_URL,
  };

  if (metadata.canonicalPath === "/") {
    const websiteId = `${canonicalUrl}#website`;
    const webApplicationId = `${canonicalUrl}#webapplication`;
    return {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "WebSite",
          "@id": websiteId,
          name: "Stock Dash",
          url: canonicalUrl,
          description: metadata.description,
          publisher,
          creator: { "@type": "Person", name: "HEiNANN" },
          mainEntity: { "@id": webApplicationId },
        },
        {
          "@type": "WebApplication",
          "@id": webApplicationId,
          name: "Stock Dash",
          applicationCategory: "BusinessApplication",
          applicationSubCategory: "Stock Management System",
          operatingSystem: "Web",
          browserRequirements: "Requires a modern web browser.",
          url: canonicalUrl,
          image: STOCK_DASH_OG_IMAGE_URL,
          description: metadata.description,
          isPartOf: { "@id": websiteId },
          publisher,
          creator: { "@type": "Person", name: "HEiNANN" },
          featureList: [
            "Stock management",
            "Production order tracking",
            "NPRM Modify Order workflows",
            "Customer sample requests",
            "QR stock updates",
          ],
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: metadata.title,
    description: metadata.description,
    url: canonicalUrl,
    image: STOCK_DASH_OG_IMAGE_URL,
    isPartOf: { "@type": "WebSite", name: "Stock Dash", url: STOCK_DASH_SITE_URL },
    publisher,
    creator: { "@type": "Person", name: "HEiNANN" },
  };
}
