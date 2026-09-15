import { describe, expect, it } from "vitest";
import { isPrivateAddress, validateExternalUrl } from "./url";

describe("external URL validation", () => {
  it("accepts a normal public HTTPS URL and removes the fragment", () => expect(validateExternalUrl("https://example.com/about#team").toString()).toBe("https://example.com/about"));
  it.each(["http://localhost/admin", "http://127.0.0.1", "http://10.1.2.3", "http://169.254.169.254/latest", "file:///etc/passwd", "https://user:pass@example.com"])("rejects unsafe target %s", value => expect(() => validateExternalUrl(value)).toThrow());
  it.each(["192.168.1.2", "172.20.1.2", "100.64.0.1", "::1", "fd00::1"])("recognizes private address %s", value => expect(isPrivateAddress(value)).toBe(true));
});
