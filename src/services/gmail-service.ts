import { google } from "googleapis";

function getOAuthClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET/GOOGLE_REDIRECT_URI");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getGmailAuthUrl() {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
  });
}

export function getGmailAuthUrlWithState(state: string) {
  const oauth2 = getOAuthClient();
  return oauth2.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: ["https://www.googleapis.com/auth/gmail.send"],
    state,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const oauth2 = getOAuthClient();
  const { tokens } = await oauth2.getToken(code);
  if (!tokens.refresh_token) {
    throw new Error("No refresh_token returned. Try prompt=consent or revoke app access and retry.");
  }
  return tokens;
}

function buildRawEmail(input: {
  from: string;
  to: string;
  subject: string;
  bodyText: string;
}) {
  const lines = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    input.bodyText,
  ];
  const message = lines.join("\r\n");
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export async function sendGmail(input: {
  refreshToken: string;
  senderUser: string; // oauth user mailbox
  from: string; // send-as / from header
  to: string;
  subject: string;
  bodyText: string;
}) {
  const oauth2 = getOAuthClient();
  oauth2.setCredentials({ refresh_token: input.refreshToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2 });
  const raw = buildRawEmail({
    from: input.from,
    to: input.to,
    subject: input.subject,
    bodyText: input.bodyText,
  });

  const res = await gmail.users.messages.send({
    userId: input.senderUser,
    requestBody: { raw },
  });

  return res.data.id ?? null;
}

