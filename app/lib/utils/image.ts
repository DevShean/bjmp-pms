/**
 * Generates a base64 encoded SVG data URI for a rounded avatar with initials.
 */
export function avatarDataUrl(name: string, bgColor: string = "#1e4b8f") {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='48' fill='${bgColor}'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI' font-size='34' fill='white' font-weight='700'>${initials}</text></svg>`;
  
  if (typeof window !== "undefined") {
    try {
      return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svg)))}`;
    } catch (e) {
      console.error("Failed to generate base64 avatar:", e);
    }
  }
  
  // Fallback to non-base64 for SSR or errors
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Validates if a string is a valid displayable image source (URL, Path, or Data URI).
 */
export function isValidImageSrc(src: string | null | undefined): boolean {
  if (!src) return false;
  const trimmed = src.trim();
  return trimmed.startsWith("/") || trimmed.startsWith("http") || trimmed.startsWith("data:");
}

/**
 * Gets the final displayable image URL or returns the fallback avatar.
 */
export function getInmateImageUrl(photo_path: string | null | undefined, fullName: string): string {
  const cleanPath = (photo_path || "").trim();
  if (isValidImageSrc(cleanPath)) {
    return cleanPath;
  }
  return avatarDataUrl(fullName);
}
