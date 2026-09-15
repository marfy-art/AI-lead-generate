import { isIP } from "node:net";

const blockedHostnames = new Set(["localhost", "localhost.localdomain", "metadata.google.internal"]);
const allowedPorts = new Set(["", "80", "443"]);

export class UnsafeUrlError extends Error {
  constructor(message: string) { super(message); this.name = "UnsafeUrlError"; }
}

export function isPrivateAddress(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (normalized === "::1" || normalized === "::" || normalized.startsWith("fe80:") || normalized.startsWith("fc") || normalized.startsWith("fd")) return true;
  if (isIP(normalized) !== 4) return false;
  const [a,b] = normalized.split(".").map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

export function validateExternalUrl(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new UnsafeUrlError("URL is invalid."); }
  if (!['http:', 'https:'].includes(url.protocol)) throw new UnsafeUrlError("Only HTTP and HTTPS URLs are allowed.");
  if (url.username || url.password) throw new UnsafeUrlError("URLs containing credentials are not allowed.");
  if (!allowedPorts.has(url.port)) throw new UnsafeUrlError("Non-standard ports are not allowed.");
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (blockedHostnames.has(hostname) || hostname.endsWith(".local") || hostname.endsWith(".internal") || isPrivateAddress(hostname)) throw new UnsafeUrlError("Private or local network targets are not allowed.");
  url.hash = "";
  return url;
}
