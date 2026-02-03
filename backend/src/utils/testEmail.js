import { sendWelcomeEmail, sendOTPEmail } from "./email.js";
import dotenv from "dotenv";

dotenv.config();

async function testEmail() {
  console.log("🧪 Testing email service with Mailtrap...\n");

  const testUser = {
    fullName: "John Doe",
    email: "test@example.com",
    role: "JAMAAH",
    isActive: true,
  };

  try {
    // Test Welcome Email
    console.log("📧 Sending Welcome Email...");
    const welcomeResult = await sendWelcomeEmail(testUser);
    console.log("Result:", welcomeResult);

    // Test OTP Email
    console.log("\n📧 Sending OTP Email...");
    const otpResult = await sendOTPEmail(testUser, "123456");
    console.log("Result:", otpResult);

    console.log("\n✅ Email test completed! Check your Mailtrap inbox.");
    console.log("🔗 https://mailtrap.io/inboxes");
  } catch (error) {
    console.error("❌ Email test failed:", error);
  }

  process.exit(0);
}

testEmail();
