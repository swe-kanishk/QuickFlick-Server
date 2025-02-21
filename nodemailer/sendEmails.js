import {
  VERIFICATION_EMAIL_TEMPLATE,
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
} from "./emailTemplates.js";
import { transporter } from "./nodemailer.config.js";

export const sendVerificationEmail = async (email, verificationToken) => {
  try {
    const response = await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Verify your email",
      html: VERIFICATION_EMAIL_TEMPLATE.replace(
        "{verificationCode}",
        verificationToken
      ),
      category: "Email verification",
    });
    console.log("Verification email sent successfully:", response);
    return response; // Return for debugging
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error(`Error sending verification email: ${error.message}`);
  }
};

export const sendWelcomeEmail = async (email, username) => {
  try {
    const response = await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      template_uuid: "23766c12-906c-47db-9f24-7e9df7cd3381", // Verify this exists in your Mailtrap dashboard
      template_variables: {
        company_info_name: "Auth QuickFlick",
        name: username,
      },
    });
    console.log("Welcome email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error(`Error sending welcome email: ${error.message}`);
  }
};

export const sendPasswordResetEmail = async (email, resetURL) => {
  try {
    const response = await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Reset your password",
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL),
      category: "Password Reset",
    });
    console.log("Reset email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error(`Error sending password reset email: ${error.message}`);
  }
};

export const sendPasswordResetSuccessEmail = async (email) => {
  try {
    const response = await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password reset successful",
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
      category: "Password Reset",
    });
    console.log("Password reset success email sent successfully:", response);
    return response;
  } catch (error) {
    console.error("Error sending reset password success email:", error);
    throw new Error(
      `Error sending reset password success email: ${error.message}`
    );
  }
};
