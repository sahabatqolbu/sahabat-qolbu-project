// backend/src/utils/email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// =====================================================
// NODEMAILER TRANSPORTER (MAILTRAP)
// =====================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Email service error:", error);
  } else {
    console.log("✅ Email service ready (Mailtrap)");
  }
});

// =====================================================
// SEND EMAIL FUNCTION
// =====================================================
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    console.log("📧 Email sent:", info.messageId);

    // Mailtrap preview URL (development only)
    if (process.env.NODE_ENV === "development") {
      console.log("🔗 Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return { success: false, error: error.message };
  }
};

// =====================================================
// EMAIL TEMPLATES
// =====================================================

// Welcome Email
export const sendWelcomeEmail = async (user) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0A2C45 0%, #1a4d7a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .button { display: inline-block; background: #FFC107; color: #0A2C45; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🕌 Sahabat Qolbu</div>
          <p>Travel Umrah & Haji Terpercaya</p>
        </div>
        
        <div class="content">
          <h2>Assalamualaikum ${user.fullName},</h2>
          
          <p>Alhamdulillah, akun Anda telah berhasil dibuat! 🎉</p>
          
          <p>Selamat bergabung dengan <strong>Sahabat Qolbu</strong>, partner terpercaya Anda dalam perjalanan ibadah Umrah & Haji.</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-left: 4px solid #3b82f6; margin: 20px 0;">
            <strong>Detail Akun:</strong><br>
            Email: ${user.email}<br>
            Role: ${user.role}<br>
            Status: ${user.isActive ? "Aktif ✅" : "Menunggu Aktivasi"}
          </div>
          
          <p>Silakan login untuk melengkapi profil dan memulai perjalanan ibadah Anda.</p>
          
          <center>
            <a href="${
              process.env.FRONTEND_URL
            }/login" class="button">Login Sekarang</a>
          </center>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Jika Anda tidak merasa mendaftar, abaikan email ini atau hubungi customer service kami.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Sahabat Qolbu</strong><br>
          Travel Umrah & Haji<br>
          📞 WhatsApp: 0812-3456-7890<br>
          🌐 www.sahabatqolbu.com</p>
          
          <p style="margin-top: 15px; font-size: 12px;">
            © ${new Date().getFullYear()} Sahabat Qolbu. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: "🕌 Selamat Datang di Sahabat Qolbu",
    text: `Assalamualaikum ${user.fullName}, selamat bergabung dengan Sahabat Qolbu!`,
    html,
  });
};

// OTP Email
export const sendOTPEmail = async (user, otp) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0A2C45 0%, #1a4d7a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .otp-box { background: #FFC107; color: #0A2C45; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; color: #dc2626; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">🕌 Sahabat Qolbu</div>
          <p>Kode Verifikasi OTP</p>
        </div>
        
        <div class="content">
          <h2>Assalamualaikum ${user.fullName},</h2>
          
          <p>Kami menerima permintaan verifikasi untuk akun Anda. Gunakan kode OTP berikut:</p>
          
          <div class="otp-box">${otp}</div>
          
          <div class="warning">
            ⚠️ <strong>Penting:</strong><br>
            • Kode ini berlaku selama <strong>${
              process.env.OTP_EXPIRY_MINUTES
            } menit</strong><br>
            • Jangan bagikan kode ini kepada siapapun<br>
            • Jika bukan Anda yang meminta, segera hubungi customer service
          </div>
          
          <p style="text-align: center; color: #6b7280; font-size: 14px; margin-top: 20px;">
            Kode akan kedaluwarsa pada:<br>
            <strong>${new Date(
              Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES) * 60000
            ).toLocaleString("id-ID")}</strong>
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Sahabat Qolbu</strong><br>
          📞 WhatsApp: 0812-3456-7890<br>
          🌐 www.sahabatqolbu.com</p>
          
          <p style="margin-top: 15px; font-size: 12px;">
            © ${new Date().getFullYear()} Sahabat Qolbu. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject: `🔐 Kode OTP Anda: ${otp}`,
    text: `Kode OTP Anda adalah: ${otp}. Berlaku selama ${process.env.OTP_EXPIRY_MINUTES} menit.`,
    html,
  });
};

// Payment Confirmation Email
export const sendPaymentConfirmationEmail = async (transaction, jamaah) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0A2C45 0%, #1a4d7a 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
        .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; margin: 10px 0; }
        .invoice-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .invoice-table th { background: #f3f4f6; padding: 12px; text-align: left; }
        .invoice-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
        .total-row { background: #fef3c7; font-weight: bold; font-size: 18px; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 10px 10px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="font-size: 28px; font-weight: bold; margin-bottom: 10px;">🕌 Sahabat Qolbu</div>
          <p>Konfirmasi Pembayaran</p>
        </div>
        
        <div class="content">
          <h2>Assalamualaikum ${jamaah.fullName},</h2>
          
          <center>
            <div class="success-badge">✓ Pembayaran Terverifikasi</div>
          </center>
          
          <p>Alhamdulillah, pembayaran Anda telah kami terima dan verifikasi.</p>
          
          <table class="invoice-table">
            <tr>
              <th colspan="2">Detail Transaksi</th>
            </tr>
            <tr>
              <td><strong>No. Invoice</strong></td>
              <td>${transaction.invoiceNumber}</td>
            </tr>
            <tr>
              <td><strong>Tanggal Bayar</strong></td>
              <td>${new Date().toLocaleDateString("id-ID")}</td>
            </tr>
            <tr>
              <td><strong>Metode Pembayaran</strong></td>
              <td>${transaction.paymentMethod}</td>
            </tr>
            <tr>
              <td><strong>Jumlah Bayar</strong></td>
              <td>Rp ${parseFloat(transaction.paidAmount).toLocaleString(
                "id-ID"
              )}</td>
            </tr>
            <tr class="total-row">
              <td><strong>Sisa Pembayaran</strong></td>
              <td>Rp ${parseFloat(transaction.remainingAmount).toLocaleString(
                "id-ID"
              )}</td>
            </tr>
          </table>
          
          <p>Detail lengkap dapat Anda lihat di dashboard akun Anda.</p>
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            Jika ada pertanyaan, silakan hubungi customer service kami.
          </p>
        </div>
        
        <div class="footer">
          <p><strong>Sahabat Qolbu</strong><br>
          📞 WhatsApp: 0812-3456-7890<br>
          🌐 www.sahabatqolbu.com</p>
          
          <p style="margin-top: 15px; font-size: 12px;">
            © ${new Date().getFullYear()} Sahabat Qolbu. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: jamaah.email,
    subject: `✅ Pembayaran Terverifikasi - ${transaction.invoiceNumber}`,
    text: `Pembayaran Anda sebesar Rp ${parseFloat(
      transaction.paidAmount
    ).toLocaleString("id-ID")} telah terverifikasi.`,
    html,
  });
};

// =====================================================
// NEW USER CREDENTIALS EMAIL
// =====================================================
export const sendCredentialsEmail = async (email, fullName, password) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #0A2C45 0%, #1a4d7a 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 32px; font-weight: bold; }
        .header p { margin: 10px 0 0 0; opacity: 0.95; font-size: 16px; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 24px; color: #0A2C45; margin-bottom: 10px; font-weight: 600; }
        .credentials-box { 
          background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%); 
          padding: 25px; 
          border-left: 5px solid #FFC107; 
          margin: 25px 0; 
          border-radius: 8px;
        }
        .credentials-box h3 { 
          margin: 0 0 15px 0; 
          color: #0A2C45; 
          font-size: 18px;
        }
        .credential-item { 
          margin: 15px 0; 
          padding: 12px 15px; 
          background: white; 
          border-radius: 6px;
          border: 1px solid #FFD54F;
        }
        .credential-label { 
          font-size: 13px; 
          color: #666; 
          margin-bottom: 5px; 
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .credential-value { 
          font-family: 'Courier New', monospace; 
          font-size: 18px; 
          color: #0A2C45; 
          font-weight: bold;
          word-break: break-all;
        }
        .warning-box { 
          background: #FFF3E0; 
          border-left: 5px solid #FF9800; 
          padding: 20px; 
          margin: 25px 0; 
          border-radius: 8px;
        }
        .warning-box h4 { 
          margin: 0 0 12px 0; 
          color: #E65100; 
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .warning-box ul { 
          margin: 10px 0 0 0; 
          padding-left: 20px; 
        }
        .warning-box li { 
          margin: 8px 0; 
          color: #5D4037;
        }
        .steps-box {
          background: #E3F2FD;
          padding: 20px;
          border-radius: 8px;
          margin: 25px 0;
        }
        .steps-box h4 {
          margin: 0 0 15px 0;
          color: #0D47A1;
        }
        .steps-box ol {
          margin: 0;
          padding-left: 20px;
        }
        .steps-box li {
          margin: 10px 0;
          color: #1565C0;
        }
        .button { 
          display: inline-block; 
          background: linear-gradient(135deg, #FFC107 0%, #FFB300 100%);
          color: #0A2C45; 
          padding: 16px 40px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: bold; 
          font-size: 16px;
          margin: 25px 0; 
          box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
          transition: all 0.3s;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 193, 7, 0.4);
        }
        .footer { 
          background: #F5F5F5; 
          padding: 30px; 
          text-align: center; 
          color: #666; 
          font-size: 14px; 
          border-top: 3px solid #FFC107;
        }
        .footer-brand {
          font-weight: bold;
          color: #0A2C45;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .footer-contact {
          margin: 15px 0;
          line-height: 1.8;
        }
        .footer-copyright {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #DDD;
          font-size: 12px;
          color: #999;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🕌 Sahabat Qolbu</h1>
          <p>Travel Umrah & Haji Terpercaya</p>
        </div>
        
        <div class="content">
          <div class="greeting">Assalamu'alaikum Wr. Wb.</div>
          <h2 style="color: #0A2C45; margin: 5px 0 20px 0;">${fullName}</h2>
          
          <p style="font-size: 16px; line-height: 1.8;">
            Alhamdulillah, akun Anda telah berhasil dibuat oleh <strong>Admin Sahabat Qolbu</strong>. 
            Selamat bergabung dalam perjalanan ibadah Umrah bersama kami! 🎉
          </p>
          
          <div class="credentials-box">
            <h3>🔐 Kredensial Login Anda</h3>
            
            <div class="credential-item">
              <div class="credential-label">📧 Email Login</div>
              <div class="credential-value">${email}</div>
            </div>
            
            <div class="credential-item">
              <div class="credential-label">🔑 Password</div>
              <div class="credential-value">${password}</div>
            </div>
          </div>
          
          <div class="warning-box">
            <h4>
              <span style="font-size: 20px;">⚠️</span>
              PENTING - Harap Dibaca!
            </h4>
            <ul>
              <li><strong>Segera login dan GANTI PASSWORD</strong> Anda setelah login pertama kali</li>
              <li><strong>JANGAN BAGIKAN</strong> password ini kepada siapapun, termasuk yang mengaku staff kami</li>
              <li><strong>SIMPAN</strong> email ini di tempat yang aman atau catat password Anda</li>
              <li>Jika lupa password, gunakan fitur "Lupa Password" di halaman login</li>
            </ul>
          </div>
          
          <div class="steps-box">
            <h4>📋 Langkah Selanjutnya:</h4>
            <ol>
              <li>Klik tombol <strong>"Login Sekarang"</strong> di bawah ini</li>
              <li>Masukkan email dan password yang tertera di atas</li>
              <li>Lengkapi data pribadi Anda (KTP, Paspor, dll)</li>
              <li>Upload dokumen yang diperlukan</li>
              <li>Tunggu verifikasi dari admin kami</li>
            </ol>
          </div>
          
          <center>
            <a href="${process.env.DASHBOARD_URL || 'http://localhost:3001'}/login" class="button">
              🔐 Login Sekarang
            </a>
          </center>
          
          <p style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #EEE; color: #666; font-size: 14px; line-height: 1.8;">
            <strong>Butuh Bantuan?</strong><br>
            Jika Anda mengalami kesulitan atau ada pertanyaan, jangan ragu untuk menghubungi tim customer service kami. 
            Kami siap membantu Anda! 😊
          </p>
        </div>
        
        <div class="footer">
          <div class="footer-brand">Sahabat Qolbu Travel</div>
          <div class="footer-contact">
            📞 WhatsApp: <strong>0812-3456-7890</strong><br>
            📧 Email: <strong>support@sahabatqolbu.com</strong><br>
            🌐 Website: <strong>www.sahabatqolbu.com</strong>
          </div>
          <div class="footer-copyright">
            © ${new Date().getFullYear()} Sahabat Qolbu. All rights reserved.<br>
            Email otomatis dari sistem - Mohon jangan membalas email ini.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return await sendEmail({
    to: email,
    subject: "🕌 Akun Umrah Anda di Sahabat Qolbu - Kredensial Login",
    text: `Assalamu'alaikum ${fullName},\n\nAkun Anda telah dibuat!\n\nEmail: ${email}\nPassword: ${password}\n\nSilakan login di: ${process.env.DASHBOARD_URL}/login\n\nHarap ganti password setelah login pertama.\n\nTerima kasih,\nSahabat Qolbu Travel`,
    html,
  });
};





export default transporter;
