import "dotenv/config";
import { db } from "../index.js";
import { agentRequirements, agentPurposes, periods } from "../schema.js";

export async function seedAgentMasterData() {
  console.log("🌱 Seeding Agent Master Data...");

  try {
    // ===== AGENT REQUIREMENTS =====
    console.log("📋 Seeding Agent Requirements...");
    await db.insert(agentRequirements).values([
      {
        title: "Bersedia mengikuti training rutin setiap bulan",
        order: 1,
        isActive: true,
      },
      {
        title: "Aktif mencari jamaah minimal 2 orang per bulan",
        order: 2,
        isActive: true,
      },
      {
        title: "Memiliki smartphone dan akses internet",
        order: 3,
        isActive: true,
      },
      {
        title: "Bersedia menggunakan materi marketing yang disediakan",
        order: 4,
        isActive: true,
      },
      {
        title: "Menjaga nama baik perusahaan dalam setiap interaksi",
        order: 5,
        isActive: true,
      },
    ]);

    // ===== AGENT PURPOSES =====
    console.log("🎯 Seeding Agent Purposes...");
    await db.insert(agentPurposes).values([
      {
        title: "Ingin Mendapatkan Penghasilan Tambahan",
        slug: "ingin-mendapatkan-penghasilan-tambahan",
        order: 1,
        isActive: true,
      },
      {
        title: "Ingin Belajar Marketing Digital Umroh",
        slug: "ingin-belajar-marketing-digital-umroh",
        order: 2,
        isActive: true,
      },
      {
        title: "Ingin Fokus Bisnis Umroh Jangka Panjang",
        slug: "ingin-fokus-bisnis-umroh-jangka-panjang",
        order: 3,
        isActive: true,
      },
      {
        title: "Ingin Membangun Tim Agen",
        slug: "ingin-membangun-tim-agen",
        order: 4,
        isActive: true,
      },
      {
        title: "Membantu jamaah umrah",
        slug: "membantu-jamaah-umrah",
        order: 5,
        isActive: true,
      },
      {
        title: "Melayani ضيوف الرحمن",
        slug: "melayani-tamu-allah",
        order: 6,
        isActive: true,
      },
      {
        title: "Ingin umroh gratis terus menerus",
        slug: "ingin-umroh-gratis-terus-menerus",
        order: 7,
        isActive: true,
      },
      {
        title: "Ingin umroh setiap tahun bersama keluarga",
        slug: "ingin-umroh-setiap-tahun-bersama-keluarga",
        order: 8,
        isActive: true,
      },
      {
        title:
          "Membantu yang lain untuk memudahkan dalam ibadah haji dan umrah",
        slug: "membantu-yang-lain-untuk-memudahkan-dalam-ibadah-haji-dan-umrah",
        order: 9,
        isActive: true,
      },
      {
        title: "Ingin kembali ke tanah suci",
        slug: "ingin-kembali-ke-tanah-suci",
        order: 10,
        isActive: true,
      },
      {
        title: "Berdakwah melalui layanan ibadah umroh dan haji berkualitas",
        slug: "berdakwah-melalui-layanan-ibadah-umroh-dan-haji-berkualitas",
        order: 11,
        isActive: true,
      },
    ]);

    // ===== PERIODS (Contoh 6 bulan) =====
    console.log("📅 Seeding Periods...");
    const currentYear = new Date().getFullYear();
    const months = [
      { name: "Januari", start: "01-01", end: "01-31", days: 31 },
      { name: "Februari", start: "02-01", end: "02-28", days: 28 },
      { name: "Maret", start: "03-01", end: "03-31", days: 31 },
      { name: "April", start: "04-01", end: "04-30", days: 30 },
      { name: "Mei", start: "05-01", end: "05-31", days: 31 },
      { name: "Juni", start: "06-01", end: "06-30", days: 30 },
    ];

    for (const month of months) {
      await db.insert(periods).values({
        name: `${month.name} ${currentYear}`,
        startDate: new Date(`${currentYear}-${month.start}`),
        endDate: new Date(`${currentYear}-${month.end}`),
        duration: month.days,
        isActive: true,
      });
    }

    console.log("✅ Agent Master Data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding agent master data:", error);
    throw error;
  }
}
