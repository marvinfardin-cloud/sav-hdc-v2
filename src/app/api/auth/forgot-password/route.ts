import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";
import { noCacheHeaders } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400, headers: noCacheHeaders() }
      );
    }

    const client = await prisma.client.findUnique({ where: { email } });

    // Always return 200 to avoid leaking whether an account exists
    if (!client || !client.passwordHash) {
      return NextResponse.json({ success: true }, { headers: noCacheHeaders() });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.client.update({
      where: { id: client.id },
      data: { resetToken: token, resetTokenExpiry: expiry },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"SAV JardiPro" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe — SAV JardiPro",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto">
          <h2 style="color:#F47920">Réinitialisation du mot de passe</h2>
          <p>Bonjour ${client.prenom},</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous :</p>
          <p style="margin:24px 0">
            <a href="${resetUrl}"
               style="background:#F47920;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
              Réinitialiser mon mot de passe
            </a>
          </p>
          <p style="color:#888;font-size:13px">Ce lien est valable 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:12px">SAV JardiPro — Les Hauts de Californie, Martinique</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true }, { headers: noCacheHeaders() });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500, headers: noCacheHeaders() }
    );
  }
}
