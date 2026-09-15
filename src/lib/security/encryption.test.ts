import {afterEach,describe,expect,it,vi} from "vitest";
import {decryptSecret,encryptionPersistenceReady,encryptSecret} from "./encryption";

afterEach(()=>vi.unstubAllEnvs());
describe("secret encryption",()=>{
  it("round-trips with AES-256-GCM without embedding plaintext",()=>{vi.stubEnv("APP_ENCRYPTION_KEY",Buffer.alloc(32,7).toString("base64"));const encrypted=encryptSecret("provider-secret");expect(encrypted).toMatch(/^v1:/);expect(encrypted).not.toContain("provider-secret");expect(decryptSecret(encrypted)).toBe("provider-secret");expect(encryptionPersistenceReady()).toBe(true);});
  it("rejects an invalid configured key",()=>{vi.stubEnv("APP_ENCRYPTION_KEY","too-short");expect(()=>encryptSecret("secret")).toThrow(/32 bytes/);});
});
