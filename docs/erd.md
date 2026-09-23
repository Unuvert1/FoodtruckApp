# Entity Relationship Diagram

Generated from `prisma/schema.prisma`. The central entity is **Service** — one
truck, at one location, from one time to another. Menu availability, pickup
slots, capacity, and orders all hang off it (see the README's "The problem"
section for why).

```mermaid
erDiagram
    TRUCK ||--o{ MEMBERSHIP : "has"
    TRUCK ||--o{ LOCATION : "has"
    TRUCK ||--o{ MENU : "has"
    TRUCK ||--o{ MENU_ITEM : "owns (denormalized)"
    TRUCK ||--o{ SERVICE : "runs"
    TRUCK ||--o{ ORDER : "receives"

    LOCATION ||--o{ SERVICE : "hosts"

    MENU ||--o{ MENU_SECTION : "contains"
    MENU ||--o{ SERVICE : "used by"

    MENU_SECTION ||--o{ MENU_ITEM : "contains"

    MENU_ITEM ||--o{ MODIFIER_GROUP : "has"
    MENU_ITEM |o--o{ ORDER_LINE_ITEM : "referenced by (nullable)"

    MODIFIER_GROUP ||--o{ MODIFIER_OPTION : "has"

    SERVICE ||--o{ PICKUP_SLOT : "generates on publish"
    SERVICE ||--o{ ORDER : "receives"

    PICKUP_SLOT ||--o{ ORDER : "books"

    ORDER ||--o{ ORDER_LINE_ITEM : "contains (price snapshot)"

    TRUCK {
        string id PK
        string slug UK
        string name
        string timezone "IANA zone"
        string stripeAccountId UK
        boolean stripeOnboarded
        int taxRateBps
        int platformFeeBps
    }

    MEMBERSHIP {
        string id PK
        string truckId FK
        string clerkUserId "tenancy boundary"
        enum role "OWNER | STAFF"
    }

    LOCATION {
        string id PK
        string truckId FK
        string name
        string addressLine
        string city
        float lat
        float lng
    }

    MENU {
        string id PK
        string truckId FK
        string name
        boolean isDefault
    }

    MENU_SECTION {
        string id PK
        string menuId FK
        string name
        int sortOrder
    }

    MENU_ITEM {
        string id PK
        string truckId FK
        string sectionId FK
        string name
        int priceCents
        boolean isAvailable "86'd flag"
        datetime archivedAt "soft delete"
    }

    MODIFIER_GROUP {
        string id PK
        string menuItemId FK
        string name
        int minSelect
        int maxSelect
        boolean required
    }

    MODIFIER_OPTION {
        string id PK
        string groupId FK
        string name
        int priceDeltaCents
        boolean isAvailable
    }

    SERVICE {
        string id PK
        string truckId FK
        string locationId FK
        string menuId FK
        datetime startsAt
        datetime endsAt
        int slotMinutes
        int ordersPerSlot
        enum status "DRAFT..CANCELLED"
        int orderCount "atomic counter for order numbers"
    }

    PICKUP_SLOT {
        string id PK
        string serviceId FK
        datetime startsAt
        int capacity
        int bookedCount
    }

    ORDER {
        string id PK
        string truckId FK
        string serviceId FK
        string pickupSlotId FK
        string orderNumber "e.g. A07"
        string customerName
        string customerPhone
        int totalCents
        enum status "PENDING_PAYMENT..REFUNDED"
        string stripeCheckoutSessionId UK
        enum source "WEB | SMS | API"
    }

    ORDER_LINE_ITEM {
        string id PK
        string orderId FK
        string menuItemId FK "nullable, SetNull on delete"
        string nameSnapshot "never re-joined to live menu"
        int unitPriceCents
        int quantity
        json modifiersSnapshot
        int lineTotalCents
    }
```

`WebhookEvent` (Stripe webhook idempotency guard, keyed on `stripeEventId`)
has no foreign keys and is omitted above for readability.

## Notes for the writeup

- **Multi-tenancy** is enforced by `truckId` on every tenant-scoped table,
  not by a separate schema per truck. `Membership` is the only link between
  a Clerk user and a truck.
- **Money** is always integer cents (`priceCents`, `totalCents`, etc.) and
  rates are basis points (`taxRateBps`, `platformFeeBps`) — never floats.
- **`OrderLineItem` is a price snapshot.** `menuItemId` can go `null` if the
  menu item is later deleted, but `nameSnapshot` / `unitPriceCents` /
  `modifiersSnapshot` preserve exactly what the customer bought and paid,
  independent of later menu edits.
- **`PickupSlot` rows only exist once a `Service` is published** — they're
  generated from `slotMinutes` / `ordersPerSlot`, not created ad hoc.
