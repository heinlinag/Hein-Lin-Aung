export type SignInLocation = {
  country: string | null;
  region: string | null;
  city: string | null;
};

type IpWhoisResponse = {
  success?: boolean;
  country?: string;
  region?: string;
  city?: string;
};

function isPublicIPAddress(ip: string): boolean {
  const normalized = ip.trim().replace(/^::ffff:/, "");
  if (!normalized || normalized === "Unknown" || normalized === "::1" || normalized === "127.0.0.1") return false;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(normalized)) return false;
  return true;
}

/** Resolve approximate country/region/city for a public IP. Failure is intentionally non-blocking. */
export async function resolveSignInLocation(ip: string): Promise<SignInLocation> {
  if (!isPublicIPAddress(ip)) return { country: null, region: null, city: null };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1800);
  try {
    const response = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country,region,city`,
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );
    if (!response.ok) return { country: null, region: null, city: null };
    const data = await response.json() as IpWhoisResponse;
    if (!data.success) return { country: null, region: null, city: null };
    return {
      country: data.country?.trim() || null,
      region: data.region?.trim() || null,
      city: data.city?.trim() || null,
    };
  } catch {
    return { country: null, region: null, city: null };
  } finally {
    clearTimeout(timeout);
  }
}
