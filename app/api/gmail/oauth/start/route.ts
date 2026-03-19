import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getGmailAuthUrlWithState } from "../../../../../src/services/gmail-service";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") || "/settings";
  const state = Buffer.from(JSON.stringify({ returnTo }), "utf8").toString(
    "base64url",
  );
  const url = getGmailAuthUrlWithState(state);
  return NextResponse.redirect(url);
}

