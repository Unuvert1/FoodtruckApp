// The one list of Settings sections. The rail, the mobile sheet, and the
// layout's "current section" lookup all read it, so they can't drift apart.

export type SettingsGroup = "truck" | "business";

export type SettingsSection = {
  href: string;
  label: string;
  group: SettingsGroup;
  ownerOnly?: true;
};

export const GROUP_LABELS: Record<SettingsGroup, string> = {
  truck: "Your truck",
  business: "Business",
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { href: "/dashboard/settings/profile", label: "Truck profile", group: "truck" },
  { href: "/dashboard/settings/storefront", label: "Storefront", group: "truck" },
  { href: "/dashboard/settings/locations", label: "Locations", group: "truck" },
  { href: "/dashboard/settings/ordering", label: "Ordering", group: "business" },
  { href: "/dashboard/settings/taxes", label: "Taxes & fees", group: "business" },
  { href: "/dashboard/settings/payments", label: "Payments", group: "business" },
  { href: "/dashboard/settings/notifications", label: "Notifications", group: "business" },
  { href: "/dashboard/settings/team", label: "Team", group: "business", ownerOnly: true },
];

export function sectionsFor(role: "OWNER" | "STAFF"): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => !s.ownerOnly || role === "OWNER");
}
