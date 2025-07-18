import { type NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { z } from "zod";
import {
  renderWaitlistWelcomeEmail,
  renderWaitlistNotificationEmail,
} from "@/lib/email-templates";

const resend = new Resend(process.env.RESEND_API_KEY);

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = waitlistSchema.parse(body);

    // Add to waitlist (you could store in a database here)
    // For now, we'll just send a confirmation email

    const welcomeEmailHtml = await renderWaitlistWelcomeEmail(email);

    await resend.emails.send({
      from: "OpenCourt <noreply@opencourtpb.com>",
      to: [email],
      subject: "Welcome to OpenCourt",
      html: welcomeEmailHtml,
    });
    // Send a notification to yourself about the new signup
    const signupTime = new Date().toLocaleString();
    const notificationEmailHtml = await renderWaitlistNotificationEmail(
      email,
      signupTime,
    );

    await resend.emails.send({
      from: "OpenCourt <noreply@opencourtpb.com>",
      to: ["opencourtpb@gmail.com"],
      subject: "New OpenCourt Waitlist Signup",
      html: notificationEmailHtml,
    });

    return NextResponse.json({
      success: true,
      message: "Successfully joined the waitlist!",
    });
  } catch (error) {
    console.error("Waitlist signup error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
