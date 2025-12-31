# Supabase Edge Functions - Stripe + Document Analysis

## Environment variables
Set secrets in Supabase:

```bash
supabase secrets set \
  SUPABASE_URL="https://<project-ref>.supabase.co" \
  SUPABASE_ANON_KEY="<anon-key>" \
  SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
  STRIPE_SECRET_KEY="<stripe-secret>" \
  STRIPE_WEBHOOK_SECRET="<stripe-webhook-secret>" \
  SITE_URL="https://your-site.com" \
  STRIPE_SUBSCRIPTION_PRICE_IDS="price_123,price_456" \
  STRIPE_ONE_TIME_PRICE_IDS="price_abc,price_def" \
  TWILIO_ACCOUNT_SID="<twilio-account-sid>" \
  TWILIO_AUTH_TOKEN="<twilio-auth-token>" \
  TWILIO_API_KEY_SID="<twilio-api-key-sid>" \
  TWILIO_API_KEY_SECRET="<twilio-api-key-secret>" \
  TWILIO_TWIML_APP_SID="<twiml-app-sid>" \
  TWILIO_MESSAGING_SERVICE_SID="<optional-messaging-service-sid>"
```

Notes:
- `STRIPE_SUBSCRIPTION_PRICE_IDS` and `STRIPE_ONE_TIME_PRICE_IDS` are optional.
- `SUPABASE_SERVICE_ROLE_KEY` is required for billing table writes.

## Deploy functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy create-billing-portal-session
supabase functions deploy stripe-webhook
supabase functions deploy analyze-document
supabase functions deploy telephony-token
supabase functions deploy telephony-client-voice-webhook
supabase functions deploy telephony-incoming-voice-webhook
supabase functions deploy sms-send
supabase functions deploy sms-inbound-webhook
supabase functions deploy sms-status-webhook
```

## Stripe webhook URL

Set the webhook endpoint in Stripe to:

```
https://<project-ref>.functions.supabase.co/stripe-webhook
```

For local testing:

```bash
stripe listen --forward-to http://127.0.0.1:54321/functions/v1/stripe-webhook
```

## Twilio setup

- Voice JS SDK (browser calling)
  - Create a Twilio API Key.
  - Create a TwiML App and set its Voice URL to:
    `https://<project-ref>.functions.supabase.co/telephony-client-voice-webhook?client_id=<client-uuid>`
  - Use the TwiML App SID in `TWILIO_TWIML_APP_SID`.
- Incoming voice
  - Configure your Twilio phone number Voice webhook to:
    `https://<project-ref>.functions.supabase.co/telephony-incoming-voice-webhook`
- SMS
  - If using a Messaging Service, set its Inbound webhook to:
    `https://<project-ref>.functions.supabase.co/sms-inbound-webhook`
  - Set Status callback to:
    `https://<project-ref>.functions.supabase.co/sms-status-webhook`
  - If using a phone number instead of a Messaging Service, set the same URLs on the number.

## Frontend usage examples

### Create Checkout Session

```ts
const res = await fetch("https://<project-ref>.functions.supabase.co/create-checkout-session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    client_id: "<client-uuid>",
    mode: "subscription",
    price_id: "price_123",
    quantity: 1,
  }),
});
const data = await res.json();
window.location.href = data.url;
```

### Create Billing Portal Session

```ts
const res = await fetch("https://<project-ref>.functions.supabase.co/create-billing-portal-session", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ client_id: "<client-uuid>" }),
});
const data = await res.json();
window.location.href = data.url;
```

### Analyze Document

```ts
const res = await fetch("https://<project-ref>.functions.supabase.co/analyze-document", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    client_id: "<client-uuid>",
    path: "documents/example.pdf",
    mime_type: "application/pdf",
  }),
});
const data = await res.json();
console.log(data);
```

### Telephony Token (Twilio Client)

```ts
const res = await fetch("https://<project-ref>.functions.supabase.co/telephony-token", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
  body: JSON.stringify({ client_id: "<client-uuid>" }),
});
const data = await res.json();
// Use data.token with Twilio.Device.setup(token) in the browser.
```

### Send SMS

```ts
const res = await fetch("https://<project-ref>.functions.supabase.co/sms-send", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${accessToken}`,
  },
  body: JSON.stringify({
    client_id: "<client-uuid>",
    contact_id: "<contact-uuid>",
    to_number: "+15551234567",
    body: "Hello from Supabase!",
  }),
});
const data = await res.json();
console.log(data);
```
