export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

export function appPath(path: string) {
  if (!path) {
    return basePath || "/";
  }

  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedPath === "/") {
    return basePath || "/";
  }

  return `${basePath}${normalizedPath}`;
}
