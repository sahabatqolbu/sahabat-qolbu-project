import "dotenv/config";
import { db } from "../index.js";
import { agentLevels, agentBenefits } from "../schema.js";

export async function seedAgentLevels() {
  console.log("🌱 Seeding Agent Levels...");

  try {
    // ===== 1. PRA-AGENT (Bintang 0) - GRATIS =====
    const [praAgent] = await db.insert(agentLevels).values({
      name: "Pra-Agent",
      slug: "pra-agent",
      star: 0,
      price: "0",
      minClosing: null,
      maxPeriod: null,
      maintainClosing: null,
      maintainPeriod: null,
      downgradeClosing: null,
      description: "Level gratis untuk pemula. Akses terbatas.",
      isActive: true,
      order: 0,
    });

    await db.insert(agentBenefits).values([
      {
        agentLevelId: praAgent.insertId,
        title: "Akses Dashboard Basic",
        description: "Lihat statistik sederhana",
        order: 0,
      },
      {
        agentLevelId: praAgent.insertId,
        title: "Referral Code",
        description: "Kode referral untuk recruit agen",
        order: 1,
      },
    ]);

    // ===== 2. BINTANG 1 (Basic Agent) - 150K =====
    const [bintang1] = await db.insert(agentLevels).values({
      name: "Bintang 1 (Basic Agent)",
      slug: "bintang-1",
      star: 1,
      price: "150000",
      minClosing: 1,
      maxPeriod: 3,
      maintainClosing: 1,
      maintainPeriod: 3,
      downgradeClosing: 0, // Jika 0 closing = turun ke Pra-Agent
      description:
        "Level basic dengan akses training. Bisa didapat gratis dengan closing 1 jamaah dalam 3 periode.",
      isActive: true,
      order: 1,
    });

    await db.insert(agentBenefits).values([
      {
        agentLevelId: bintang1.insertId,
        title: "Ikut Training Gratis",
        description: "Akses semua materi training umroh",
        order: 0,
      },
      {
        agentLevelId: bintang1.insertId,
        title: "Komisi 5%",
        description: "Komisi dari setiap jamaah yang closing",
        order: 1,
      },
      {
        agentLevelId: bintang1.insertId,
        title: "Dashboard Analytics",
        description: "Laporan lengkap performa agen",
        order: 2,
      },
      {
        agentLevelId: bintang1.insertId,
        title: "Materi Marketing Digital",
        description: "Template desain & copywriting",
        order: 3,
      },
      {
        agentLevelId: bintang1.insertId,
        title: "Sertifikat Bintang 1",
        description: "Sertifikat resmi sebagai agen",
        order: 4,
      },
    ]);

    // ===== 3. BINTANG 2 (Silver Agent) - 350K =====
    const [bintang2] = await db.insert(agentLevels).values({
      name: "Bintang 2 (Silver Agent)",
      slug: "bintang-2",
      star: 2,
      price: "350000",
      minClosing: 5,
      maxPeriod: 2,
      maintainClosing: 1,
      maintainPeriod: 3,
      downgradeClosing: 1, // Jika cuma 1 closing = turun ke Bintang 1
      description:
        "Level premium dengan benefit maksimal. Bisa didapat gratis dengan closing 5 jamaah dalam 2 periode.",
      isActive: true,
      order: 2,
    });

    await db.insert(agentBenefits).values([
      {
        agentLevelId: bintang2.insertId,
        title: "Semua Benefit Bintang 1",
        description: "Plus benefit tambahan di bawah",
        order: 0,
      },
      {
        agentLevelId: bintang2.insertId,
        title: "Komisi 10%",
        description: "Komisi lebih besar dari Bintang 1",
        order: 1,
      },
      {
        agentLevelId: bintang2.insertId,
        title: "Dashboard + CRM",
        description: "Fitur manajemen jamaah lengkap",
        order: 2,
      },
      {
        agentLevelId: bintang2.insertId,
        title: "Priority Support",
        description: "Respon cepat dari tim support",
        order: 3,
      },
      {
        agentLevelId: bintang2.insertId,
        title: "Bonus Referral Agen",
        description: "Dapat bonus dari recruit agen baru",
        order: 4,
      },
      {
        agentLevelId: bintang2.insertId,
        title: "Sertifikat Bintang 2",
        description: "Sertifikat premium + badge digital",
        order: 5,
      },
      {
        agentLevelId: bintang2.insertId,
        title: "Undangan Event Eksklusif",
        description: "Gathering & training khusus Bintang 2",
        order: 6,
      },
    ]);

    console.log("✅ Agent Levels seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding agent levels:", error);
    throw error;
  }
}
