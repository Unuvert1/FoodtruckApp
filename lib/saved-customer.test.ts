import { describe, expect, it } from "vitest";
import {
  SAVED_CUSTOMER_KEY,
  clearSavedCustomer,
  readSavedCustomer,
  writeSavedCustomer,
} from "@/lib/saved-customer";

function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

const blocked = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
  removeItem: () => {
    throw new Error("blocked");
  },
};

describe("saved customer details", () => {
  it("saves and reads back the name and phone", () => {
    const storage = fakeStorage();
    expect(writeSavedCustomer(storage, { name: "Jo", phone: "262-555-0100" })).toBe(true);
    expect(readSavedCustomer(storage)).toEqual({ name: "Jo", phone: "262-555-0100" });
  });

  it("trims whitespace", () => {
    const storage = fakeStorage();
    writeSavedCustomer(storage, { name: "  Jo  ", phone: " 262 " });
    expect(readSavedCustomer(storage)).toEqual({ name: "Jo", phone: "262" });
  });

  it("returns null when nothing is saved", () => {
    expect(readSavedCustomer(fakeStorage())).toBeNull();
  });

  it("returns null for corrupt or wrongly shaped data", () => {
    for (const raw of ["not json", "null", "42", '{"name":1,"phone":"x"}', '{"name":"a"}', '{"name":"","phone":""}']) {
      expect(readSavedCustomer(fakeStorage({ [SAVED_CUSTOMER_KEY]: raw }))).toBeNull();
    }
  });

  it("caps very long values", () => {
    const storage = fakeStorage();
    writeSavedCustomer(storage, { name: "x".repeat(500), phone: "1".repeat(500) });
    const saved = readSavedCustomer(storage);
    expect(saved?.name.length).toBe(100);
    expect(saved?.phone.length).toBe(100);
  });

  it("clears the saved details", () => {
    const storage = fakeStorage();
    writeSavedCustomer(storage, { name: "Jo", phone: "262" });
    clearSavedCustomer(storage);
    expect(readSavedCustomer(storage)).toBeNull();
  });

  it("never throws when storage is blocked or missing", () => {
    expect(readSavedCustomer(blocked)).toBeNull();
    expect(writeSavedCustomer(blocked, { name: "Jo", phone: "262" })).toBe(false);
    expect(() => clearSavedCustomer(blocked)).not.toThrow();
    expect(readSavedCustomer(null)).toBeNull();
    expect(writeSavedCustomer(null, { name: "Jo", phone: "262" })).toBe(false);
    expect(() => clearSavedCustomer(undefined)).not.toThrow();
  });
});
