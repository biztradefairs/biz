// lib/email-service.ts
import nodemailer from "nodemailer"

/* ============================================================
   CONFIG (HARDCODED – LOCAL ONLY)
============================================================ */

const EMAIL_CONFIG = {
  user: "mondalrohan201@gmail.com",
  // IMPORTANT: Gmail App Password WITHOUT SPACES
  pass: "vwpgxirylmggjgbp",
}

const APP_URL = "https://www.biztradefairs.com/"

/* ============================================================
   TRANSPORTER
============================================================ */

const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_CONFIG.user,
      pass: EMAIL_CONFIG.pass,
    },
  })
}

/* ============================================================
   TIME HELPERS (IST)
============================================================ */

const formatISTTime = (date: Date) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(date)
}

/* ============================================================
   PASSWORD RESET EMAIL
============================================================ */

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  firstName: string,
  userRole: string,
  fullName: string
) {
  const transporter = createTransporter()

  // Verify transporter
  try {
    await transporter.verify()
    console.log("✅ Email server connected")
  } catch (err) {
    console.error("❌ Email server connection failed:", err)
    throw new Error("Email service unavailable")
  }

  const resetLink = `${APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(
    email
  )}`

  const now = new Date()
  const requestTimeIST = formatISTTime(now)
  const expiryTimeIST = formatISTTime(
    new Date(now.getTime() + 60 * 60 * 1000)
  )

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Password Reset</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f1f5f9;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
">

<!-- Wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
<tr>
<td align="center">

<!-- Container -->
<table width="600" cellpadding="0" cellspacing="0" style="
  background:#ffffff;
  border-radius:14px;
  overflow:hidden;
  box-shadow:0 10px 30px rgba(0,0,0,0.08);
">

<!-- Banner -->
<tr>
<td style="
  background:linear-gradient(135deg,#4f46e5,#6366f1);
  padding:40px 30px;
  text-align:center;
  color:#ffffff;
">
  <h1 style="margin:0;font-size:28px;font-weight:700;">TradeFairs</h1>
  <p style="margin-top:8px;font-size:15px;opacity:0.9;">
    Secure Account Recovery
  </p>
</td>
</tr>

<!-- Body -->
<tr>
<td style="padding:40px 35px;">

<p style="font-size:16px;color:#111827;margin:0 0 16px;">
  Hello <strong>${firstName}</strong>,
</p>

<p style="font-size:15px;color:#374151;line-height:1.7;margin-bottom:24px;">
  We received a request to reset the password for your
  <strong>${userRole}</strong> account.  
  Click the button below to securely set a new password.
</p>

<!-- Info Card -->
<table width="100%" cellpadding="0" cellspacing="0" style="
  background:#f8fafc;
  border-radius:12px;
  padding:20px;
  margin-bottom:30px;
  border:1px solid #e5e7eb;
">
<tr>
<td style="font-size:14px;color:#1f2937;">
  <strong>Account Details</strong>
</td>
</tr>
<tr><td height="10"></td></tr>
<tr>
<td style="font-size:14px;color:#374151;">
  <strong>Name:</strong> ${fullName}<br/>
  <strong>Email:</strong> ${email}<br/>
  <strong>Requested:</strong> ${requestTimeIST}<br/>
  <strong>Expires:</strong> ${expiryTimeIST}
</td>
</tr>
</table>

<!-- CTA -->
<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center">
  <a href="${resetLink}" style="
    display:inline-block;
    background:#4f46e5;
    color:#ffffff;
    text-decoration:none;
    padding:16px 36px;
    border-radius:10px;
    font-size:16px;
    font-weight:600;
    box-shadow:0 8px 20px rgba(79,70,229,0.35);
  ">
    Reset Password
  </a>
</td>
</tr>
</table>

<!-- Fallback link -->
<p style="
  margin-top:30px;
  font-size:13px;
  color:#6b7280;
  line-height:1.6;
">
  If the button doesn’t work, copy and paste this link into your browser:
</p>

<p style="
  font-size:12px;
  color:#374151;
  word-break:break-all;
  background:#f9fafb;
  padding:12px;
  border-radius:8px;
  border:1px solid #e5e7eb;
">
  ${resetLink}
</p>

<!-- Security -->
<table width="100%" cellpadding="0" cellspacing="0" style="
  background:#fff7ed;
  border:1px solid #fdba74;
  border-radius:10px;
  padding:18px;
  margin-top:30px;
">
<tr>
<td style="font-size:13px;color:#92400e;">
  🔐 <strong>Security Notice</strong><br/><br/>
  • This link is valid for <strong>1 hour</strong><br/>
  • Never share this link with anyone<br/>
  • If you didn’t request this, ignore this email
</td>
</tr>
</table>

</td>
</tr>

<!-- Footer -->
<tr>
<td style="
  background:#f8fafc;
  padding:24px;
  text-align:center;
  font-size:12px;
  color:#6b7280;
">
  © ${new Date().getFullYear()} TradeFairs<br/>
  All times shown in Indian Standard Time (IST)
</td>
</tr>

</table>
<!-- End Container -->

</td>
</tr>
</table>
<!-- End Wrapper -->

</body>
</html>
`


  const mailOptions = {
    from: `"TradeFairs Security" <${EMAIL_CONFIG.user}>`,
    to: email,
    subject: `🔒 Password Reset (${userRole})`,
    html,
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Reset email sent to ${email}`)
    console.log(`📧 Message ID: ${info.messageId}`)
    return true
  } catch (error: any) {
    console.error("❌ Failed to send reset email:", error.message)
    throw error
  }
}

/* ============================================================
   TEST EMAIL FUNCTION
============================================================ */

export async function testEmailConfig() {
  const transporter = createTransporter()

  try {
    await transporter.verify()
    console.log("✅ Email config OK")

    const info = await transporter.sendMail({
      from: EMAIL_CONFIG.user,
      to: EMAIL_CONFIG.user,
      subject: "✅ TradeFairs Test Email",
      html: `
        <h2>Email Test Successful</h2>
        <p>This confirms Nodemailer is working.</p>
        <p><strong>Time (IST):</strong> ${formatISTTime(new Date())}</p>
      `,
    })

    console.log("📧 Test email sent:", info.messageId)
    return true
  } catch (err) {
    console.error("❌ Email test failed:", err)
    return false
  }
}
