import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASS,
  },
});

function createMessage(email, subject, htmlMessage) {
  const message = {
    from: `"Backend Boilerplate" <${process.env.GMAIL_USER}>`,
    to: email,
    subject,
    html: htmlMessage,
  };
  return message;
}

const template = `
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; font-family: Arial, sans-serif; background-color:#f4f6f8;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f8; padding:20px;">
          <tr>
            <td align="center">
            <!-- Card -->
            <table width="400" cellpadding="0" cellspacing="0" style="background:#ffffff; padding:24px; border-radius:8px;">
        
          <tr>
            <td>
              <h2 style="margin:0 0 10px;">Reset Your Password</h2>
              <p style="font-size:14px; color:#555;">
                You requested to reset your password. Click the button below to continue.
              </p>
            </td>
          </tr>

          <!-- Button -->
          <tr>
            <td align="center" style="padding:20px 0;">
              <a href="{{RESET_LINK}}" 
                style="
                  display:inline-block;
                  padding:12px 20px;
                  background-color:#111;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:6px;
                  font-size:14px;
                ">
                Reset Password
              </a>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td>
              <p style="font-size:12px; color:#888;">
                If the button doesn’t work, copy and paste this link into your browser:
              </p>
              <p style="font-size:12px; word-break:break-all; color:#555;">
                {{RESET_LINK}}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:20px;">
              <p style="font-size:12px; color:#999;">
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        </td>
        </tr>
      </table>
      </body>
    </html>

  `;

export async function sendPasswordResetEmail(email, resetLink) {
  const emailMessage = createMessage(email, "Password Recovery", template.replace(/{{RESET_LINK}}/g, resetLink));

  const info = await transporter.sendMail(emailMessage);

  return info;
}
