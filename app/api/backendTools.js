import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const sendResetEmail = async (email, resetLink, firstTime) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const subjectCreate = 'Set Your Datum Password';
    const subjectReset = 'Reset your Password for Datum';
    const bodyCreate = `
        <p>Your Datum account has been created for you! Click the link below to set/reset your password.</p>
        <a href="${resetLink}">Set/Reset Password</a>
    `;
    const bodyReset = `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
    `;

    const mailOptions = {
      from: `"Datum" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: firstTime ? subjectCreate : subjectReset,
      html: firstTime ? bodyCreate : bodyReset,
    };
    const info = await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending reset link:", error);
  }
};