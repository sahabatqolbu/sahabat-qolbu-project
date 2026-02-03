// backend/src/scripts/fixAgentIds.js
import 'dotenv/config';  // ✅ TAMBAH INI DI PALING ATAS!
import { db } from "../db/index.js";
import { jamaahData, agentData } from "../db/schema.js";
import { eq, sql } from "drizzle-orm";

const fixAgentIds = async () => {
  console.log("🔧 Starting fix agentId in jamaahData...\n");

  // 1. Ambil semua agent
  const agents = await db.query.agentData.findMany();
  console.log(`Found ${agents.length} agents\n`);

  for (const agent of agents) {
    console.log(`Agent ID: ${agent.id}, User ID: ${agent.userId}`);

    // 2. Cari jamaah yang salah pakai userId sebagai agenId
    const wrongJamaah = await db.query.jamaahData.findMany({
      where: eq(jamaahData.agenId, agent.userId), // Yang salah: agenId = userId
    });

    if (wrongJamaah.length > 0) {
      console.log(
        `  ⚠️  Found ${wrongJamaah.length} jamaah with wrong agenId (${agent.userId} instead of ${agent.id})`,
      );

      // 3. Fix: Update ke agent.id yang benar
      const result = await db
        .update(jamaahData)
        .set({ agenId: agent.id })
        .where(eq(jamaahData.agenId, agent.userId));

      console.log(
        `  ✅ Fixed! Updated agenId from ${agent.userId} to ${agent.id}`,
      );
    } else {
      console.log(`  ✓ No wrong data found`);
    }
  }

  console.log("\n🎉 Fix completed!");
  process.exit(0);
};

fixAgentIds().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
