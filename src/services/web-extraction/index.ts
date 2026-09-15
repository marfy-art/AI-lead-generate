import { lookup } from "node:dns/promises";
import { validateExternalUrl, isPrivateAddress, UnsafeUrlError } from "../../lib/security/url";

export type ExtractedPage = { url: string; title: string | null; text: string; capturedAt: string; contentType: string; mode: "live" };
const MAX_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;

async function assertPublicDns(url: URL) {
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some(record => isPrivateAddress(record.address))) throw new UnsafeUrlError("The hostname resolves to a private or restricted address.");
}

function htmlToText(html: string) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi," ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi," ").replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi," ").replace(/<[^>]+>/g," ").replace(/&nbsp;/gi," ").replace(/&amp;/gi,"&").replace(/&lt;/gi,"<").replace(/&gt;/gi,">").replace(/&#39;/g,"'").replace(/&quot;/gi,'"').replace(/\s+/g," ").trim();
}

function getTitle(html: string) { const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i); return match ? htmlToText(match[1]).slice(0,200) : null; }

function robotsAllows(body: string, pathname: string) {
  let applies = false;
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.split("#")[0].trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") applies = value === "*" || value.toLowerCase() === "signaldesk";
    if (applies && key === "disallow" && value && pathname.startsWith(value)) return false;
  }
  return true;
}

async function fetchWithTimeout(url: URL, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try { return await fetch(url, { ...init, signal: controller.signal, headers: { "user-agent":"SignalDesk/0.1 (+compliance-contact-required)", "accept":"text/html,application/xhtml+xml", ...init.headers } }); }
  finally { clearTimeout(timeout); }
}

export async function extractPublicPage(input: string): Promise<ExtractedPage> {
  if (process.env.ENABLE_PUBLIC_WEB_FETCH !== "true") throw new Error("Public web extraction is disabled. Set ENABLE_PUBLIC_WEB_FETCH=true after source-policy review.");
  let url = validateExternalUrl(input);
  await assertPublicDns(url);
  const robotsUrl = new URL("/robots.txt", url.origin);
  const robots = await fetchWithTimeout(robotsUrl).catch(()=>null);
  if (robots?.ok && !robotsAllows(await robots.text(), url.pathname)) throw new UnsafeUrlError("robots.txt disallows this path.");
  for (let redirects=0; redirects<=MAX_REDIRECTS; redirects++) {
    const response = await fetchWithTimeout(url, { redirect:"manual" });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirects === MAX_REDIRECTS) throw new Error("Redirect limit exceeded.");
      url = validateExternalUrl(new URL(location,url).toString());
      await assertPublicDns(url);
      continue;
    }
    if (!response.ok) throw new Error(`Page fetch failed with status ${response.status}.`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("Only HTML pages can be analyzed.");
    const declaredLength = Number(response.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_BYTES) throw new Error("Page exceeds the extraction size limit.");
    const html = (await response.text()).slice(0,MAX_BYTES);
    return { url:url.toString(), title:getTitle(html), text:htmlToText(html).slice(0,50_000), capturedAt:new Date().toISOString(), contentType, mode:"live" };
  }
  throw new Error("Unable to extract page.");
}
