// Vendor email notifications via Resend (resend.com). Without RESEND_API_KEY
// the email is printed to the terminal instead, so everything else still works.

import "server-only";
import { Resend } from "resend";
import type { OrderView, Truck } from "@/lib/types";
import { formatCents } from "@/lib/money";
import { formatWhen } from "@/lib/time";

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function sendNewOrderEmail(input: {
  order: OrderView;
  truck: Truck;
  notificationEmail: string | null;
  locationName: string;
  notifyNewOrder?: boolean; // the vendor's per-event switch; absent = on
}): Promise<void> {
  const { order, truck, notificationEmail, locationName } = input;
  if (input.notifyNewOrder === false) return;
  if (!notificationEmail) {
    console.info(`[email] ${truck.name} has no notification email set; skipping order ${order.orderNumber}`);
    return;
  }

  const pickup = order.pickupAt ? formatWhen(order.pickupAt, truck.timezone) : "at the window"; // "today at 12:15 pm"
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard`;
  const subject = `New order ${order.orderNumber}: ${formatCents(order.totalCents)}, pickup ${pickup}`;

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
      <p style="margin:8px 0 0"><strong>${escapeHtml(order.customerName)}</strong>${order.customerPhone ? ` · ${escapeHtml(order.customerPhone)}` : ""}</p>
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

// ─── Settings emails ───────────────────────────────────────────────────────
// Unlike the new-order email, these report back: the vendor pressed a button
// and needs to know whether anything was actually sent.

export type SendResult = { sent: true } | { sent: false; reason: "not-configured" | "rejected"; error: string };

const FROM = () => process.env.EMAIL_FROM ?? "FoodtruckApp <onboarding@resend.dev>";

async function deliver(input: { to: string; subject: string; text: string; html: string }): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY not set. Would send to ${input.to}:\n  ${input.subject}\n${input.text.replace(/^/gm, "  ")}`);
    return { sent: false, reason: "not-configured", error: "Email isn't set up on this server (RESEND_API_KEY is missing)." };
  }
  try {
    const { error } = await new Resend(apiKey).emails.send({ from: FROM(), ...input });
    if (error) return { sent: false, reason: "rejected", error: error.message };
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: "rejected", error: error instanceof Error ? error.message : "The email service couldn't be reached." };
  }
}

const appUrl = () => process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function sendTestEmail(input: { to: string; truckName: string }): Promise<SendResult> {
  const subject = `Test email from ${input.truckName}`;
  const text = `This is a test from FoodtruckApp. If you can read it, new-order emails for ${input.truckName} will reach this address.`;
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;color:#1d2733">
    <p style="margin:0;color:#5c6660">${escapeHtml(input.truckName)}</p>
    <h1 style="margin:4px 0 0;font-size:24px">Your email works</h1>
    <p>New-order emails for ${escapeHtml(input.truckName)} will reach this address.</p></div>`;
  return deliver({ to: input.to, subject, text, html });
}

export function sendInviteEmail(input: { to: string; truckName: string; role: "OWNER" | "STAFF"; token: string; expiresAt: Date }): Promise<SendResult> {
  const link = `${appUrl()}/invite/${input.token}`;
  const roleText = input.role === "OWNER" ? "an owner" : "staff";
  const expires = input.expiresAt.toISOString().slice(0, 10);
  const subject = `You're invited to join ${input.truckName}`;
  const text = [
    `You've been invited to join ${input.truckName} on FoodtruckApp as ${roleText}.`,
    "",
    `Accept the invite: ${link}`,
    "",
    `The link works until ${expires} and only for you. If you weren't expecting this, ignore it.`,
  ].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;max-width:480px;color:#1d2733">
    <p style="margin:0;color:#5c6660">${escapeHtml(input.truckName)}</p>
    <h1 style="margin:4px 0 0;font-size:24px">You're invited</h1>
    <p>Join ${escapeHtml(input.truckName)} on FoodtruckApp as ${roleText}.</p>
    <p style="margin:20px 0"><a href="${link}" style="background:#1d2733;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none">Accept invite</a></p>
    <p style="color:#5c6660;font-size:14px">The link works until ${expires}. If you weren't expecting this, ignore it.</p></div>`;
  return deliver({ to: input.to, subject, text, html });
}
