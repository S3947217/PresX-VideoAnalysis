import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import type { APIGatewayProxyResultV2 } from "aws-lambda";

const ses = new SESClient({ region: "ap-southeast-2" });

const NOTIFY_EMAILS = ["helen@xolvit.io", "dfg600331@outlook.com"];
const FROM_EMAIL = "noreply@xolvit-management.com";

export async function notifySignup(event: { body?: string }): Promise<APIGatewayProxyResultV2> {
  const body = JSON.parse(event.body || "{}");
  const { email, firstName, lastName } = body;

  if (!email) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "email is required" }),
    };
  }

  const displayName = firstName && lastName ? `${firstName} ${lastName}` : firstName || email;
  const greeting = firstName || "there";

  try {
    // Admin notification
    const adminEmail = ses.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: NOTIFY_EMAILS },
        Message: {
          Subject: { Data: `New PresX Sign-up: ${displayName}` },
          Body: {
            Html: {
              Data: `
                <h2>New PresX Sign-up</h2>
                <p><strong>Name:</strong> ${displayName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              `,
            },
            Text: {
              Data: `New PresX Sign-up\n\nName: ${displayName}\nEmail: ${email}\nTime: ${new Date().toISOString()}`,
            },
          },
        },
      })
    );

    // Welcome email to user
    const welcomeEmail = ses.send(
      new SendEmailCommand({
        Source: FROM_EMAIL,
        Destination: { ToAddresses: [email] },
        Message: {
          Subject: { Data: `Welcome to PresX, ${greeting}!` },
          Body: {
            Html: {
              Data: buildWelcomeHtml(greeting),
            },
            Text: {
              Data: buildWelcomeText(greeting),
            },
          },
        },
      })
    );

    await Promise.all([adminEmail, welcomeEmail]);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true }),
    };
  } catch (err) {
    console.error("SES send error:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Failed to send notification" }),
    };
  }
}

function buildWelcomeHtml(name: string): string {
  return `
<div style="max-width:560px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#e5e5e5;background:#000;padding:40px 24px;border-radius:16px;">
  <img src="https://presx-dev-public-assets.s3.ap-southeast-2.amazonaws.com/presx-logo.png" alt="PresX" style="height:48px;margin-bottom:32px;" />

  <h1 style="font-size:24px;font-weight:700;color:#fff;margin:0 0 16px;">Welcome to PresX, ${name}!</h1>

  <p style="font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 20px;">
    We're really glad you're here.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 20px;">
    PresX was born out of something we kept seeing on our <a href="https://www.xolvit.io" style="color:#dc2626;text-decoration:none;">Xolvit</a> platform &mdash; both native and non-native English speakers struggling to communicate their ideas clearly when it mattered most.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 20px;">
    Great ideas deserve to be heard. But without confident delivery, they often get lost. So we built PresX &mdash; an AI-powered presentation coach that listens to your speech and gives you real, actionable feedback on fluency, pacing, clarity, structure, engagement, and vocabulary.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 20px;">
    That's also why we've kept our premium prices at the cost of a coffee &mdash; just <strong style="color:#fff;">$5/month</strong>. We want everyone to have access to world-class presentation coaching.
  </p>

  <p style="font-size:15px;line-height:1.7;color:#a1a1aa;margin:0 0 20px;">
    Your <strong style="color:#fff;">3-day free trial</strong> is now active. You get 5 AI analyses per day &mdash; enough to start seeing real improvement.
  </p>

  <h2 style="font-size:16px;font-weight:700;color:#fff;margin:28px 0 12px;">Here's how to get started:</h2>
  <ol style="font-size:15px;line-height:1.8;color:#a1a1aa;margin:0 0 28px;padding-left:20px;">
    <li>Create a new project for your presentation</li>
    <li>Record yourself or upload an audio file</li>
    <li>Get your scorecard with detailed, timestamped feedback</li>
    <li>Retry and watch your scores improve</li>
  </ol>

  <a href="https://presx.tech" style="display:inline-block;background:#dc2626;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:14px 32px;border-radius:8px;letter-spacing:0.05em;text-transform:uppercase;">Start Practising</a>

  <p style="font-size:13px;line-height:1.6;color:#52525b;margin:32px 0 0;">
    Have questions or feedback? <a href="https://www.xolvit.io/get-in-touch" style="color:#dc2626;text-decoration:none;">Get in touch with us</a> &mdash; we'd love to hear from you.
  </p>

  <p style="font-size:13px;color:#52525b;margin:24px 0 0;">&mdash; The PresX Team at Xolvit</p>
</div>
  `;
}

function buildWelcomeText(name: string): string {
  return `Welcome to PresX, ${name}!

We're really glad you're here.

PresX was born out of something we kept seeing on our Xolvit platform — both native and non-native English speakers struggling to communicate their ideas clearly when it mattered most.

Great ideas deserve to be heard. But without confident delivery, they often get lost. So we built PresX — an AI-powered presentation coach that listens to your speech and gives you real, actionable feedback on fluency, pacing, clarity, structure, engagement, and vocabulary.

That's also why we've kept our premium prices at the cost of a coffee — just $5/month. We want everyone to have access to world-class presentation coaching.

Your 3-day free trial is now active. You get 5 AI analyses per day — enough to start seeing real improvement.

Here's how to get started:
1. Create a new project for your presentation
2. Record yourself or upload an audio file
3. Get your scorecard with detailed, timestamped feedback
4. Retry and watch your scores improve

Start practising at https://presx.tech

Have questions or feedback? Get in touch: https://www.xolvit.io/get-in-touch

— The PresX Team at Xolvit`;
}
