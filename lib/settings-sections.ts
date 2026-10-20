// The one list of Settings sections. The rail, the mobile sheet, and the
// layout's "current section" lookup all read it, so they can't drift apart.
//
// Everything is owner-only except "Your account", which is about the person,
// not the truck. The owner-only pages live in settings/(owner)/, whose layout
// is the route-level gate; this flag drives the nav, and each action checks the
// role itself.

export type SettingsGroup = "truck" | "business" | "you";

export type SettingsSection = {
  href: string;
  label: string;
  group: SettingsGroup;
  ownerOnly?: true;
};

export const GROUP_LABELS: Record<SettingsGroup, string> = {
  truck: "Your truck",
  business: "Business",
  you: "You",
};

export const SETTINGS_SECTIONS: SettingsSection[] = [
  { href: "/dashboard/settings/profile", label: "Truck profile", group: "truck", ownerOnly: true },
  { href: "/dashboard/settings/storefront", label: "Storefront", group: "truck", ownerOnly: true },
  { href: "/dashboard/settings/locations", label: "Locations", group: "truck", ownerOnly: true },
  { href: "/dashboard/settings/ordering", label: "Ordering", group: "business", ownerOnly: true },
  { href: "/dashboard/settings/taxes", label: "Taxes & fees", group: "business", ownerOnly: true },
  { href: "/dashboard/settings/payments", label: "Payments", group: "business", ownerOnly: true },
  { href: "/dashboard/settings/notifications", label: "Notifications", group: "business", ownerOnly: true },
  { href: "/dashboard/settings/team", label: "Team", group: "business", ownerOnly: true },
  { href: "/dashboard/settings/account", label: "Your account", group: "you" },
];

export function sectionsFor(role: "OWNER" | "STAFF"): SettingsSection[] {
  return SETTINGS_SECTIONS.filter((s) => !s.ownerOnly || role === "OWNER");
}
