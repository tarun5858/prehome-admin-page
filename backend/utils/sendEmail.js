export const sendEmail = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Don't crash — just log instead
    console.log("RESEND_API_KEY missing! Email sending is disabled (mock mode).");
    console.log("Mock email ->", { to, subject, html });
    return { success: true, mock: true };
  }

  // Real email sending if API key exists
  const { Resend } = await import("resend");
  const resend = new Resend(apiKey);

  try {
    const response = await resend.emails.send({
      from: process.env.RESEND_FROM || "Blogs Management <onboarding@resend.dev>",
      to,
      subject,
      html,
    });

    console.log("Email sent:", response);
    return response;
  } catch (err) {
    console.error("Email sending failed:", err);
    throw err;
  }
};