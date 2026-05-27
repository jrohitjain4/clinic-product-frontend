/** Backend API base URL (no trailing slash). Set VITE_API_URL in .env */
export const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export const apiUrl = (path: string) =>
  `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Uploaded files from API (/uploads/...) or static assets (assets/...) */
export const resolveMediaUrl = (src?: string | null) => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("/uploads/")) return `${API_BASE_URL}${src}`;
  if (src.startsWith("/")) return src;
  return `/${src}`;
};
