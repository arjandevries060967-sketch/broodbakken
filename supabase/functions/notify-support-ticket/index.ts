import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SupportTicket = {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  message: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function textEmail(ticket: SupportTicket) {
  return [
    "Er is een nieuwe supportvraag in Mijn Broodboek.",
    "",
    `Onderwerp: ${ticket.subject}`,
    `Van: ${ticket.user_email}`,
    `Categorie: ${ticket.category}`,
    `Urgentie: ${ticket.priority}`,
    `Status: ${ticket.status}`,
    `Aangemaakt: ${new Date(ticket.created_at).toLocaleString("nl-NL", { timeZone: "Europe/Amsterdam" })}`,
    "",
    "Bericht:",
    ticket.message,
  ].join("\n");
}

function htmlEmail(ticket: SupportTicket) {
  const escapeHtml = (value: string) =>
    value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  return `
    <div style="font-family:Inter,Arial,sans-serif;color:#3f3029;line-height:1.5">
      <h2 style="margin:0 0 12px;color:#4b281b">Nieuwe supportvraag in Mijn Broodboek</h2>
      <table style="border-collapse:collapse;margin-bottom:16px">
        <tr><td style="padding:4px 14px 4px 0;font-weight:700">Onderwerp</td><td>${escapeHtml(ticket.subject)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;font-weight:700">Van</td><td>${escapeHtml(ticket.user_email)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;font-weight:700">Categorie</td><td>${escapeHtml(ticket.category)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;font-weight:700">Urgentie</td><td>${escapeHtml(ticket.priority)}</td></tr>
        <tr><td style="padding:4px 14px 4px 0;font-weight:700">Status</td><td>${escapeHtml(ticket.status)}</td></tr>
      </table>
      <div style="padding:14px;border-left:4px solid #6f7f4d;background:#f6efe2">
        ${escapeHtml(ticket.message).replaceAll("\n", "<br>")}
      </div>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const supportToEmail = Deno.env.get("SUPPORT_TO_EMAIL") || "info@arjandevries.nl";
  const supportFromEmail = Deno.env.get("SUPPORT_FROM_EMAIL");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!resendApiKey || !supportFromEmail || !supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: "Missing server configuration" }, 500);
  }

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace("Bearer ", "");
  if (!token) return jsonResponse({ error: "Missing authorization" }, 401);

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser(token);
  if (userError || !userData.user) return jsonResponse({ error: "Invalid authorization" }, 401);

  const { ticketId } = await req.json().catch(() => ({ ticketId: "" }));
  if (!ticketId || typeof ticketId !== "string") return jsonResponse({ error: "Missing ticketId" }, 400);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: ticket, error: ticketError } = await adminClient
    .from("support_tickets")
    .select("id,user_id,user_email,subject,message,category,priority,status,created_at")
    .eq("id", ticketId)
    .single<SupportTicket>();

  if (ticketError || !ticket) return jsonResponse({ error: "Ticket not found" }, 404);
  if (ticket.user_id !== userData.user.id) return jsonResponse({ error: "Forbidden" }, 403);

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: supportFromEmail,
      to: supportToEmail,
      reply_to: ticket.user_email,
      subject: `Broodboek support: ${ticket.subject}`,
      text: textEmail(ticket),
      html: htmlEmail(ticket),
    }),
  });

  if (!resendResponse.ok) {
    const detail = await resendResponse.text();
    return jsonResponse({ error: "Resend failed", detail }, 502);
  }

  return jsonResponse({ ok: true });
});
