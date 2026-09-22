// Vendor email notifications via Resend (resend.com). Without RESEND_API_KEY
// the email is printed to the terminal instead, so everything else still works.

import "server-only";
import { Resend } from "resend";
import type { OrderView, Truck } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { formatDayLabel, formatTime } from "@/lib/time";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendNewOrderEmail(input: {
  order: OrderView;
  truck: Truck;
  notificationEmail: string | null;
  locationName: string;
}): Promise<void> {
  const { order, truck, notificationEmail, locationName } = input;
  if (!notificationEmail) {
    console.info(`[email] ${truck.name} has no notification email set; skipping order ${order.orderNumber}`);
    return;
  }

  const pickup = `${formatDayLabel(order.pickupAt, truck.timezone)} at ${formatTime(order.pickupAt, truck.timezone)}`;
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`;
  const subject = `New order ${order.orderNumber}: ${formatCents(order.totalCents)}, pickup ${pickup.toLowerCase()}`;

  const lineText = order.lines.map(
    (l) => `${l.quantity}× ${l.name}${l.modifiers.length ? ` (${l.modifiers.join(", ")})` : ""}  ${formatCents(l.lineTotalCents)}`
  );
  const text = [
    `Order ${order.orderNumber} for ${order.customerName} (${order.customerPhone})`,
    `Pickup ${pickup} at ${locationName}`,
    "",
    ...lineText,
    "",
    `Total ${formatCents(order.totalCents)} (includes ${formatCents(order.tipCents)} tip)`,
    "",
    `Open your order queue: ${dashboardUrl}`,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;color:#1d2733">
      <p style="margin:0;color:#5c6660">${escapeHtml(truck.name)}</p>
      <h1 style="margin:4px 0 0;font-size:40px">${escapeHtml(order.orderNumber)}</h1>
      <p style="margin:8px 0 0"><strong>${escapeHtml(order.customerName)}</strong> · ${escapeHtml(order.customerPhone)}</p>
      <p style="margin:4px 0 0">Pickup ${escapeHtml(pickup)} at ${escapeHtml(locationName)}</p>
      <table style="margin-top:16px;width:100%;border-collapse:collapse">
        ${order.lines
          .map(
            (l) => `<tr>
              <td style="padding:6px 0;border-top:1px solid #d9ddd6">${l.quantity}× ${escapeHtml(l.name)}${
                l.modifiers.length
                  ? `<br><span style="color:#5c6660;font-size:14px">${escapeHtml(l.modifiers.join(", "))}</span>`
                  : ""
              }</td>
              <td style="padding:6px 0;border-top:1px solid #d9ddd6;text-align:right">${formatCents(l.lineTotalCents)}</td>
            </tr>`
          )
          .join("")}
        <tr><td style="padding:8px 0;border-top:1px solid #d9ddd6"><strong>Total</strong></td>
            <td style="padding:8px 0;border-top:1px solid #d9ddd6;text-align:right"><strong>${formatCents(order.totalCents)}</strong></td></tr>
      </table>
      <p style="margin-top:20px"><a href="${dashboardUrl}" style="color:#1d2733">Open your order queue</a></p>
    </div>`;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY not set. Would send to ${notificationEmail}:\n  ${subject}\n${text.replace(/^/gm, "  ")}`);
    return;
  }

  const { error } = await new Resend(apiKey).emails.send({
    // Until you verify your own domain in Resend, you must send from its test address,
    // and it only delivers to the email you signed up to Resend with.
    from: process.env.EMAIL_FROM ?? "FoodtruckApp <onboarding@resend.dev>",
    to: notificationEmail,
    subject,
    text,
    html,
  });
  if (error) console.error("[email] Resend rejected the new-order email", error);
}
