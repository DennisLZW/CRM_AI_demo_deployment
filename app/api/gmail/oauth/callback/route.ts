import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "../../../../../src/services/gmail-service";
import { db } from "../../../../../src/lib/db";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  let returnTo = "/settings";
  if (state) {
    try {
      const parsed = JSON.parse(Buffer.from(state, "base64url").toString("utf8"));
      if (typeof parsed?.returnTo === "string" && parsed.returnTo.startsWith("/")) {
        returnTo = parsed.returnTo;
      }
    } catch {
      // ignore bad state
    }
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    const email = process.env.GMAIL_SENDER_USER;
    if (!email) {
      throw new Error("Missing GMAIL_SENDER_USER");
    }

    await db.gmailAuth.upsert({
      where: { email },
      create: { email, refreshToken: tokens.refresh_token! },
      update: { refreshToken: tokens.refresh_token! },
    });

    const url = new URL(returnTo, req.url);
    url.searchParams.set("gmail", "connected");
    return NextResponse.redirect(url);
  } catch (e: any) {
    const url = new URL(returnTo, req.url);
    url.searchParams.set("gmail", "error");
    url.searchParams.set("message", String(e?.message ?? "oauth_failed"));
    return NextResponse.redirect(url);
  }
}

