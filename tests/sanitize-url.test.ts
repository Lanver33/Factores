import { describe, it, expect } from "vitest";
import { sanitizeHttpUrl } from "../src/lib/url";

describe("sanitizeHttpUrl Security Function", () => {
  it("permits standard https:// URLs", () => {
    const url = "https://www.ine.es/jaxiT3/Tabla.htm?t=56951";
    expect(sanitizeHttpUrl(url)).toBe(url);
  });

  it("permits standard http:// URLs", () => {
    const url = "http://datos.gob.es/catalogo";
    expect(sanitizeHttpUrl(url)).toBe(url);
  });

  it("blocks javascript: XSS attack vectors", () => {
    expect(sanitizeHttpUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeHttpUrl("JAVASCRIPT:document.location='http://evil.com'")).toBeNull();
  });

  it("blocks data: URI attack vectors", () => {
    expect(sanitizeHttpUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
  });

  it("blocks file: and vbscript: URIs", () => {
    expect(sanitizeHttpUrl("file:///etc/passwd")).toBeNull();
    expect(sanitizeHttpUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("handles null, undefined, whitespace, and non-URL strings safely", () => {
    expect(sanitizeHttpUrl(null)).toBeNull();
    expect(sanitizeHttpUrl(undefined)).toBeNull();
    expect(sanitizeHttpUrl("")).toBeNull();
    expect(sanitizeHttpUrl("   ")).toBeNull();
    expect(sanitizeHttpUrl("not a valid url")).toBeNull();
  });
});
