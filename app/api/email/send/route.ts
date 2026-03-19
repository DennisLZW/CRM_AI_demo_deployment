import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "../../../../src/lib/auth";
import { db } from "../../../../src/lib/db";
import { sendGmail } from "../../../../src/services/gmail-service";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const customerId = body.customerId as string | undefined;
  const toEmail = body.toEmail as string | undefined;
  const subject = body.subject as string | undefined;
  const bodyText = body.bodyText as string | undefined;

  if (!customerId || !toEmail || !subject || !bodyText) {
    return NextResponse.json(
      { error: "customerId, toEmail, subject, bodyText are required" },
      { status: 400 },
    );
  }

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (auth.role !== "ADMIN" && customer.ownerId !== auth.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const senderUser = process.env.GMAIL_SENDER_USER;
  const fromEmail = process.env.GMAIL_SEND_AS ?? senderUser;
  if (!senderUser || !fromEmail) {
    return NextResponse.json(
      { error: "Missing GMAIL_SENDER_USER/GMAIL_SEND_AS" },
      { status: 500 },
    );
  }

  const gmailAuth = await db.gmailAuth.findUnique({ where: { email: senderUser } });
  if (!gmailAuth) {
    return NextResponse.json(
      {
        error:
          "Gmail not connected. Visit /api/gmail/oauth/start to authorize and store refresh token.",
      },
      { status: 400 },
    );
  }

  const log = await db.emailLog.create({
    data: {
      customerId,
      createdByUserId: auth.id,
      toEmail,
      fromEmail,
      subject,
      bodyText,
      provider: "gmail",
      status: "queued",
    },
  });

  try {
    const messageId = await sendGmail({
      refreshToken: gmailAuth.refreshToken,
      senderUser,
      from: fromEmail,
      to: toEmail,
      subject,
      bodyText,
    });

    await db.emailLog.update({
      where: { id: log.id },
      data: {
        status: "sent",
        providerMessageId: messageId,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, messageId });
  } catch (e: any) {
    await db.emailLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        error: e?.message ?? "Unknown error",
      },
    });
    return NextResponse.json({ error: "Send failed" }, { status: 500 });
  }
}

