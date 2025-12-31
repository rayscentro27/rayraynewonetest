import twilio from "https://esm.sh/twilio@4.23.0?target=deno";

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function createTwilioRestClient() {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  return twilio(accountSid, authToken);
}

export function generateTwilioVoiceAccessToken(identity: string, ttlSeconds = 3600): string {
  const accountSid = requireEnv("TWILIO_ACCOUNT_SID");
  const apiKeySid = requireEnv("TWILIO_API_KEY_SID");
  const apiKeySecret = requireEnv("TWILIO_API_KEY_SECRET");
  const twimlAppSid = requireEnv("TWILIO_TWIML_APP_SID");

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  const token = new AccessToken(accountSid, apiKeySid, apiKeySecret, {
    identity,
    ttl: ttlSeconds,
  });
  token.addGrant(voiceGrant);

  return token.toJwt();
}

export function verifyTwilioSignature(
  params: Record<string, string>,
  url: string,
  signature: string | null,
): boolean {
  if (!signature) {
    return false;
  }
  const authToken = requireEnv("TWILIO_AUTH_TOKEN");
  return twilio.validateRequest(authToken, signature, url, params);
}
