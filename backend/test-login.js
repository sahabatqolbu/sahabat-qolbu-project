const testLogin = async () => {
  try {
    // 1. Login
    const loginResponse = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@sahabatqolbu.com",
        password: "Admin123!",
      }),
    });

    const loginData = await loginResponse.json();
    console.log("1. Login Response:", JSON.stringify(loginData, null, 2));

    if (!loginData.success) {
      console.error("Login failed!");
      return;
    }

    // 2. Verify OTP (gunakan OTP dari email Mailtrap)
    console.log("\n📧 Check Mailtrap for OTP code, then run verifyOTP()");
  } catch (error) {
    console.error("Error:", error.message);
  }
};

const verifyOTP = async (otp) => {
  try {
    const response = await fetch("http://localhost:5000/api/auth/verify-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@sahabatqolbu.com",
        otp: otp,
      }),
    });

    const data = await response.json();
    console.log("2. Verify OTP Response:", JSON.stringify(data, null, 2));

    if (data.success && data.data.token) {
      console.log("\n✅ Token:", data.data.token);
      console.log("\nSave this token for authenticated requests!");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Run test
testLogin();

// Export for manual OTP verification
global.verifyOTP = verifyOTP;
