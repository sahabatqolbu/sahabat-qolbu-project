// backend/src/utils/email.js
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const isTestEnv = process.env.NODE_ENV === "test";

// =====================================================
// NODEMAILER TRANSPORTER (MAILTRAP / SMTP)
// =====================================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const shouldVerifyTransportOnBoot = process.env.EMAIL_VERIFY_ON_BOOT === "true";

if (shouldVerifyTransportOnBoot) {
  transporter.verify((error) => {
    if (error) {
      logger.error("Email service error", error);
    } else {
      logger.info("Email service ready");
    }
  });
}

// =====================================================
// SEND EMAIL FUNCTION
// =====================================================
const isQueueEnabled = !isTestEnv && process.env.EMAIL_QUEUE_ENABLED !== "false";

let emailQueueModule = null;
const getEmailQueue = () => {
  if (!emailQueueModule) {
    emailQueueModule = import("./queue/index.js");
  }
  return emailQueueModule;
};

export const sendEmail = async ({ to, subject, text, html, queue = isQueueEnabled }) => {
  try {
    if (isTestEnv) {
      return {
        success: true,
        queued: false,
        messageId: `test-email-${Date.now()}`,
      };
    }

    if (queue) {
      const { addToEmailQueue } = await getEmailQueue();
      const jobId = addToEmailQueue({ to, subject, text, html });
      logger.debug("Email added to queue", { jobId, to });
      return { success: true, queued: true, jobId };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    logger.info("Email sent", { messageId: info.messageId });

    if (process.env.NODE_ENV === "development") {
      logger.debug("Email preview URL", { preview: nodemailer.getTestMessageUrl(info) });
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Email sending failed", error);
    return { success: false, error: error.message };
  }
};

export const sendEmailSync = async ({ to, subject, text, html }) => {
  try {
    if (isTestEnv) {
      return {
        success: true,
        messageId: `test-email-sync-${Date.now()}`,
      };
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      text,
      html,
    });

    logger.info("Email sent (sync)", { messageId: info.messageId });

    if (process.env.NODE_ENV === "development") {
      logger.debug("Email preview URL", { preview: nodemailer.getTestMessageUrl(info) });
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error("Email sending failed (sync)", error);
    return { success: false, error: error.message };
  }
};

export const getEmailStats = async () => {
  const { getEmailQueueStats } = await getEmailQueue();
  return getEmailQueueStats();
};

// =====================================================
// EMAIL BRANDING
// =====================================================
const websiteUrl = (process.env.WEBSITE_URL || process.env.PUBLIC_SITE_URL || "https://sahabatqolbu.com").replace(/\/$/, "");
const dashboardUrl = (process.env.DASHBOARD_URL || "https://dashboard.sahabatqolbu.com").replace(/\/$/, "");
const logoUrl = process.env.EMAIL_LOGO_URL || `${websiteUrl}/landing/images/icon.png`;

const brand = {
  name: "Sahabat Qolbu",
  legalName: "PT. Sahabat Qolbu Cahaya Baitullah",
  tagline: "Travel Umrah & Haji Terpercaya",
  websiteLabel: "sahabatqolbu.com",
  websiteUrl,
  dashboardUrl,
  logoUrl,
  hotline: "0812 4000 0101",
  paymentAdmin: "0896 5919 5000",
  email: "admin@sahabatqolbu.com",
  instagram: "@sahabatqolbu.official",
  address: "Ruko Jl. Ebony, Metland Transyogi No.11, Cileungsi, Bogor 16820",
};

const escapeHtml = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID")}`;

const renderEmailLayout = ({ preheader, title, subtitle, children, cta }) => `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0; padding:0; background:#f4f7fb; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">${escapeHtml(preheader || subtitle || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb; padding:28px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 18px 45px rgba(10,44,69,0.12);">
          <tr>
            <td style="background:#0A2C45; padding:32px 28px; color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="width:74px; vertical-align:middle;">
                    <img src="${escapeHtml(brand.logoUrl)}" alt="Logo ${escapeHtml(brand.name)}" width="58" height="58" style="display:block; width:58px; height:58px; object-fit:contain; border-radius:14px; background:#ffffff; padding:6px;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <div style="font-size:22px; font-weight:800; letter-spacing:.2px;">${escapeHtml(brand.name)}</div>
                    <div style="font-size:13px; line-height:1.5; color:#dbeafe; margin-top:3px;">${escapeHtml(brand.tagline)}</div>
                  </td>
                </tr>
              </table>
              <div style="height:24px;"></div>
              <div style="font-size:30px; line-height:1.18; font-weight:800; letter-spacing:-.3px;">${escapeHtml(title)}</div>
              ${subtitle ? `<div style="font-size:15px; line-height:1.7; color:#dbeafe; margin-top:10px; max-width:520px;">${escapeHtml(subtitle)}</div>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:34px 30px 28px;">
              ${children}
              ${cta ? `
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 4px;">
                  <tr>
                    <td style="background:#D6A84F; border-radius:10px;">
                      <a href="${escapeHtml(cta.href)}" style="display:inline-block; padding:14px 24px; color:#0A2C45; font-size:15px; font-weight:800; text-decoration:none;">${escapeHtml(cta.label)}</a>
                    </td>
                  </tr>
                </table>
              ` : ""}
            </td>
          </tr>
          <tr>
            <td style="background:#f8fafc; padding:26px 30px; border-top:1px solid #e5e7eb;">
              <div style="font-size:15px; font-weight:800; color:#0A2C45; margin-bottom:12px;">Kontak Resmi ${escapeHtml(brand.name)}</div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px; line-height:1.8; color:#475569;">
                <tr>
                  <td style="padding:2px 0;"><strong>WhatsApp Hotline:</strong> ${escapeHtml(brand.hotline)}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;"><strong>Admin Pembayaran:</strong> ${escapeHtml(brand.paymentAdmin)}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;"><strong>Email:</strong> <a href="mailto:${escapeHtml(brand.email)}" style="color:#0A2C45; text-decoration:none;">${escapeHtml(brand.email)}</a></td>
                </tr>
                <tr>
                  <td style="padding:2px 0;"><strong>Website:</strong> <a href="${escapeHtml(brand.websiteUrl)}" style="color:#0A2C45; text-decoration:none;">${escapeHtml(brand.websiteLabel)}</a></td>
                </tr>
                <tr>
                  <td style="padding:2px 0;"><strong>Instagram:</strong> ${escapeHtml(brand.instagram)}</td>
                </tr>
                <tr>
                  <td style="padding:2px 0;"><strong>Alamat:</strong> ${escapeHtml(brand.address)}</td>
                </tr>
              </table>
              <div style="font-size:12px; line-height:1.7; color:#94a3b8; margin-top:18px; padding-top:16px; border-top:1px solid #e5e7eb;">
                Email otomatis dari sistem ${escapeHtml(brand.legalName)}. Mohon jangan membalas email ini. Untuk bantuan, hubungi kontak resmi di atas.
              </div>
            </td>
          </tr>
        </table>
        <div style="font-size:12px; color:#94a3b8; margin-top:16px;">© ${new Date().getFullYear()} ${escapeHtml(brand.name)}. All rights reserved.</div>
      </td>
    </tr>
  </table>
</body>
</html>
`;

const infoBox = (content, options = {}) => `
  <div style="background:${options.background || "#f8fafc"}; border:1px solid ${options.border || "#e5e7eb"}; border-left:5px solid ${options.accent || "#D6A84F"}; border-radius:12px; padding:18px 20px; margin:22px 0;">
    ${content}
  </div>
`;

// =====================================================
// EMAIL TEMPLATES
// =====================================================
export const sendWelcomeEmail = async (user) => {
  const fullName = escapeHtml(user.fullName || "Bapak/Ibu");
  const role = escapeHtml(user.role || "-");
  const status = user.isActive ? "Aktif" : "Menunggu aktivasi";
  const loginUrl = `${brand.dashboardUrl}/login`;

  const html = renderEmailLayout({
    title: "Selamat Datang",
    subtitle: "Akun Sahabat Qolbu Anda sudah dibuat dan siap digunakan.",
    preheader: "Akun Sahabat Qolbu Anda telah berhasil dibuat.",
    cta: { href: loginUrl, label: "Masuk ke Dashboard" },
    children: `
      <div style="font-size:18px; font-weight:800; color:#0A2C45; margin-bottom:10px;">Assalamu'alaikum ${fullName},</div>
      <p style="font-size:15px; line-height:1.8; margin:0 0 16px;">Alhamdulillah, akun Anda telah berhasil dibuat di sistem ${escapeHtml(brand.name)}. Silakan masuk ke dashboard untuk melengkapi data dan mengikuti informasi perjalanan ibadah Anda.</p>
      ${infoBox(`
        <div style="font-size:13px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:.4px; margin-bottom:10px;">Detail Akun</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; line-height:1.8; color:#334155;">
          <tr><td style="width:120px; color:#64748b;">Email</td><td><strong>${escapeHtml(user.email)}</strong></td></tr>
          <tr><td style="color:#64748b;">Role</td><td><strong>${role}</strong></td></tr>
          <tr><td style="color:#64748b;">Status</td><td><strong>${status}</strong></td></tr>
        </table>
      `)}
      <p style="font-size:14px; line-height:1.8; color:#64748b; margin:20px 0 0;">Jika Anda tidak merasa mendaftar, abaikan email ini atau hubungi kontak resmi kami.</p>
    `,
  });

  return await sendEmail({
    to: user.email,
    subject: "Selamat Datang di Sahabat Qolbu",
    text: `Assalamu'alaikum ${user.fullName}, akun Sahabat Qolbu Anda telah berhasil dibuat. Login: ${loginUrl}`,
    html,
  });
};

export const sendOTPEmail = async (user, otp) => {
  const fullName = escapeHtml(user.fullName || "Bapak/Ibu");
  const expiryMinutes = Number.parseInt(process.env.OTP_EXPIRY_MINUTES || "10", 10);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60000).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const html = renderEmailLayout({
    title: "Kode Verifikasi",
    subtitle: "Gunakan kode ini untuk menyelesaikan proses verifikasi akun Anda.",
    preheader: `Kode OTP Anda: ${otp}`,
    children: `
      <div style="font-size:18px; font-weight:800; color:#0A2C45; margin-bottom:10px;">Assalamu'alaikum ${fullName},</div>
      <p style="font-size:15px; line-height:1.8; margin:0 0 18px;">Kami menerima permintaan verifikasi untuk akun Anda. Masukkan kode berikut pada halaman dashboard:</p>
      <div style="background:#0A2C45; color:#ffffff; border-radius:14px; padding:22px 18px; text-align:center; margin:22px 0;">
        <div style="font-size:12px; color:#bfdbfe; text-transform:uppercase; letter-spacing:1.8px; font-weight:700; margin-bottom:8px;">Kode OTP</div>
        <div style="font-size:38px; letter-spacing:8px; font-weight:900; font-family:'Courier New', monospace;">${escapeHtml(otp)}</div>
      </div>
      ${infoBox(`
        <div style="font-weight:800; color:#92400e; margin-bottom:8px;">Catatan keamanan</div>
        <ul style="margin:0; padding-left:18px; color:#78350f; font-size:14px; line-height:1.8;">
          <li>Kode berlaku selama <strong>${expiryMinutes} menit</strong>, sampai ${escapeHtml(expiresAt)}.</li>
          <li>Jangan bagikan kode ini kepada siapa pun, termasuk pihak yang mengaku sebagai admin.</li>
          <li>Jika bukan Anda yang meminta kode ini, segera hubungi kontak resmi ${escapeHtml(brand.name)}.</li>
        </ul>
      `, { background: "#fffbeb", border: "#fde68a", accent: "#f59e0b" })}
    `,
  });

  return await sendEmail({
    to: user.email,
    subject: `Kode OTP Sahabat Qolbu: ${otp}`,
    text: `Kode OTP Anda adalah: ${otp}. Berlaku selama ${expiryMinutes} menit. Jangan bagikan kode ini kepada siapa pun.`,
    html,
  });
};

export const sendPaymentConfirmationEmail = async (transaction, jamaah) => {
  const fullName = escapeHtml(jamaah.fullName || "Bapak/Ibu");
  const invoiceNumber = escapeHtml(transaction.invoiceNumber || "-");
  const paymentMethod = escapeHtml(transaction.paymentMethod || "-");

  const html = renderEmailLayout({
    title: "Pembayaran Terverifikasi",
    subtitle: "Pembayaran Anda telah kami terima dan tercatat di sistem Sahabat Qolbu.",
    preheader: `Pembayaran ${invoiceNumber} telah terverifikasi.`,
    cta: { href: `${brand.dashboardUrl}/login`, label: "Lihat Dashboard" },
    children: `
      <div style="font-size:18px; font-weight:800; color:#0A2C45; margin-bottom:10px;">Assalamu'alaikum ${fullName},</div>
      <p style="font-size:15px; line-height:1.8; margin:0 0 16px;">Alhamdulillah, pembayaran Anda telah diverifikasi oleh tim kami. Detail transaksi dapat dilihat di bawah ini.</p>
      ${infoBox(`
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px; line-height:1.9; color:#334155;">
          <tr><td style="width:150px; color:#64748b;">No. Invoice</td><td><strong>${invoiceNumber}</strong></td></tr>
          <tr><td style="color:#64748b;">Tanggal Verifikasi</td><td><strong>${new Date().toLocaleDateString("id-ID")}</strong></td></tr>
          <tr><td style="color:#64748b;">Metode Pembayaran</td><td><strong>${paymentMethod}</strong></td></tr>
          <tr><td style="color:#64748b;">Jumlah Bayar</td><td><strong>${formatCurrency(transaction.paidAmount)}</strong></td></tr>
          <tr><td style="color:#64748b;">Sisa Pembayaran</td><td><strong>${formatCurrency(transaction.remainingAmount)}</strong></td></tr>
        </table>
      `, { background: "#f0fdf4", border: "#bbf7d0", accent: "#16a34a" })}
      <p style="font-size:14px; line-height:1.8; color:#64748b; margin:20px 0 0;">Untuk pertanyaan seputar pembayaran, hubungi admin pembayaran resmi di ${escapeHtml(brand.paymentAdmin)}.</p>
    `,
  });

  return await sendEmail({
    to: jamaah.email,
    subject: `Pembayaran Terverifikasi - ${transaction.invoiceNumber}`,
    text: `Pembayaran Anda sebesar ${formatCurrency(transaction.paidAmount)} telah terverifikasi. Sisa pembayaran: ${formatCurrency(transaction.remainingAmount)}.`,
    html,
  });
};

export const sendCredentialsEmail = async (email, fullName, password) => {
  const safeFullName = escapeHtml(fullName || "Bapak/Ibu");
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(password);
  const loginUrl = `${brand.dashboardUrl}/login`;

  const html = renderEmailLayout({
    title: "Akun Dashboard Anda",
    subtitle: "Berikut kredensial login sementara untuk masuk ke dashboard Sahabat Qolbu.",
    preheader: "Akun dashboard Sahabat Qolbu Anda telah dibuat.",
    cta: { href: loginUrl, label: "Login Sekarang" },
    children: `
      <div style="font-size:18px; font-weight:800; color:#0A2C45; margin-bottom:10px;">Assalamu'alaikum ${safeFullName},</div>
      <p style="font-size:15px; line-height:1.8; margin:0 0 16px;">Akun Anda telah dibuat oleh admin ${escapeHtml(brand.name)}. Gunakan email dan password sementara berikut untuk login pertama kali.</p>
      ${infoBox(`
        <div style="font-size:13px; color:#64748b; font-weight:700; text-transform:uppercase; letter-spacing:.4px; margin-bottom:12px;">Kredensial Login</div>
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px; margin-bottom:12px;">
          <div style="font-size:12px; color:#64748b; font-weight:700; margin-bottom:5px;">Email</div>
          <div style="font-size:16px; color:#0A2C45; font-weight:800; word-break:break-all;">${safeEmail}</div>
        </div>
        <div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:14px 16px;">
          <div style="font-size:12px; color:#64748b; font-weight:700; margin-bottom:5px;">Password sementara</div>
          <div style="font-size:18px; color:#0A2C45; font-weight:900; font-family:'Courier New', monospace; word-break:break-all;">${safePassword}</div>
        </div>
      `)}
      ${infoBox(`
        <div style="font-weight:800; color:#92400e; margin-bottom:8px;">Penting untuk keamanan akun</div>
        <ul style="margin:0; padding-left:18px; color:#78350f; font-size:14px; line-height:1.8;">
          <li>Segera ganti password setelah login pertama.</li>
          <li>Jangan bagikan password kepada siapa pun.</li>
          <li>Admin tidak pernah meminta password Anda melalui WhatsApp, telepon, atau email.</li>
          <li>Jika mengalami kendala login, hubungi WhatsApp Hotline ${escapeHtml(brand.hotline)}.</li>
        </ul>
      `, { background: "#fffbeb", border: "#fde68a", accent: "#f59e0b" })}
      <p style="font-size:14px; line-height:1.8; color:#64748b; margin:22px 0 0;">Setelah login, lengkapi data pribadi dan dokumen yang diminta agar proses administrasi perjalanan berjalan lancar.</p>
    `,
  });

  return await sendEmail({
    to: email,
    subject: "Akun Dashboard Sahabat Qolbu Anda",
    text: `Assalamu'alaikum ${fullName},\n\nAkun Anda telah dibuat.\n\nEmail: ${email}\nPassword sementara: ${password}\n\nLogin: ${loginUrl}\n\nHarap ganti password setelah login pertama.\n\nKontak resmi: ${brand.hotline} | ${brand.email} | ${brand.websiteLabel}`,
    html,
  });
};

export default transporter;