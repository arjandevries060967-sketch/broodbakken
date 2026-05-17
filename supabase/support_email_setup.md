# Supportmail via Resend

De app bewaart supportvragen in `support_tickets` en roept daarna de Supabase Edge Function
`notify-support-ticket` aan. Die function verstuurt een mail naar de beheerder via Resend.

## Benodigde Supabase secrets

Zet deze secrets in Supabase. Gebruik voor `SUPPORT_FROM_EMAIL` een afzender die in Resend is toegestaan
of waarvan het domein is geverifieerd.

```bash
supabase secrets set RESEND_API_KEY="re_..."
supabase secrets set SUPPORT_TO_EMAIL="info@arjandevries.nl"
supabase secrets set SUPPORT_FROM_EMAIL="Broodboek <support@arjandevries.nl>"
```

## Function deployen

```bash
supabase functions deploy notify-support-ticket
```

Na deploy: stuur in de app een testticket via `Opties` -> `Support / vraag stellen`.
