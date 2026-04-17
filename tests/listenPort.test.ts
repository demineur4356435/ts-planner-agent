import { describe, expect, it } from "vitest";
import { parseListenPort } from "../src/api/listenPort.js";

describe("parseListenPort", () => {
  it("defaults to 3000", () => {
    expect(parseListenPort({})).toBe(3000);
    expect(parseListenPort({ PORT: undefined })).toBe(3000);
    expect(parseListenPort({ PORT: "" })).toBe(3000);
    expect(parseListenPort({ PORT: "   " })).toBe(3000);
  });

  it("parses valid ports", () => {
    expect(parseListenPort({ PORT: "8080" })).toBe(8080);
    expect(parseListenPort({ PORT: "1" })).toBe(1);
    expect(parseListenPort({ PORT: "65535" })).toBe(65535);
  });

  it("rejects invalid values", () => {
    expect(parseListenPort({ PORT: "0" })).toBe(3000);
    expect(parseListenPort({ PORT: "99999" })).toBe(3000);
    expect(parseListenPort({ PORT: "nan" })).toBe(3000);
  });
});
