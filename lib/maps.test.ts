import { describe, expect, it } from "vitest";
import { parseMapsLink } from "@/lib/maps";

describe("parseMapsLink", () => {
  it.each([
    ["https://www.google.com/maps/place/Millennium+Park/@41.8826,-87.6226,17z/data=!3m1", { lat: 41.8826, lng: -87.6226 }],
    ["https://www.google.com/maps/place/X/@41.0,-87.0,17z/data=!4m5!3d41.8826!4d-87.6226", { lat: 41.8826, lng: -87.6226 }],
    ["https://maps.google.com/?q=41.8781,-87.6298", { lat: 41.8781, lng: -87.6298 }],
    ["https://www.google.com/maps/search/?api=1&query=41.8781%2C-87.6298", { lat: 41.8781, lng: -87.6298 }],
    ["41.8781, -87.6298", { lat: 41.8781, lng: -87.6298 }],
  ])("reads %j", (input, expected) => {
    expect(parseMapsLink(input)).toEqual(expected);
  });

  it.each(["", "https://maps.app.goo.gl/abc123", "not a link", "999,999", "@95.0,10.0"])("returns null for %j", (input) => {
    expect(parseMapsLink(input)).toBeNull();
  });
});
