// backend/src/db/relations.js

import { relations } from "drizzle-orm";
import {
  users,
  masterHotels,
  masterAirlines,
  masterAirports,
  masterDocuments,
  masterBanks,
  packages,
  packageImages,
  jamaahData,

  jamaahPayments, // ✅ TAMBAH INI (yang lu bikin)
  transactions,
  paymentInstallments,
  itikafPrograms,
  itikafParticipants,
  auditLogs,
  agentData,
  agentLevels,
  agentBenefits,
  agentPaymentTransactions,
  agentClosingHistory,
  periods,
} from "./schema.js";

// =====================================================
// PACKAGES RELATIONS
// =====================================================
export const packagesRelations = relations(packages, ({ one, many }) => ({
  hotelMakkah: one(masterHotels, {
    fields: [packages.hotelMakkahId],
    references: [masterHotels.id],
    relationName: "hotelMakkah",
  }),
  hotelMadinah: one(masterHotels, {
    fields: [packages.hotelMadinahId],
    references: [masterHotels.id],
    relationName: "hotelMadinah",
  }),
  airline: one(masterAirlines, {
    fields: [packages.airlineId],
    references: [masterAirlines.id],
  }),
  departureAirport: one(masterAirports, {
    fields: [packages.departureAirportId],
    references: [masterAirports.id],
  }),
  images: many(packageImages),
  jamaahList: many(jamaahData),
}));

// =====================================================
// PACKAGE IMAGES RELATIONS
// =====================================================
export const packageImagesRelations = relations(packageImages, ({ one }) => ({
  package: one(packages, {
    fields: [packageImages.packageId],
    references: [packages.id],
  }),
}));

// =====================================================
// JAMAAH DATA RELATIONS
// =====================================================
export const jamaahDataRelations = relations(jamaahData, ({ one, many }) => ({
  // User
  user: one(users, {
    fields: [jamaahData.userId],
    references: [users.id],
  }),

  // Package
  package: one(packages, {
    fields: [jamaahData.packageId],
    references: [packages.id],
  }),

  // Agen
  agen: one(users, {
    fields: [jamaahData.agenId],
    references: [users.id],
    relationName: "agen",
  }),

  // Self Relation (Mahram)
  mahram: one(jamaahData, {
    fields: [jamaahData.mahramId],
    references: [jamaahData.id],
    relationName: "mahram",
  }),

  // ❌ HAPUS INI (karena ga ada tabel jamaahDocuments)
  // documents: many(jamaahDocuments),

  // ✅ GANTI DENGAN INI (pakai jamaahPayments)
  payments: many(jamaahPayments),

  // Transactions (masih ada kan?)
  transactions: many(transactions),
}));

// ❌ HAPUS SELURUH BLOCK INI (karena tabel ga ada)
// export const jamaahDocumentsRelations = relations(
//   jamaahDocuments,
//   ({ one }) => ({
//     jamaah: one(jamaahData, {
//       fields: [jamaahDocuments.jamaahId],
//       references: [jamaahData.id],
//     }),
//     documentType: one(masterDocuments, {
//       fields: [jamaahDocuments.documentTypeId],
//       references: [masterDocuments.id],
//     }),
//   })
// );

// ✅ TAMBAH INI (untuk jamaahPayments)
export const jamaahPaymentsRelations = relations(jamaahPayments, ({ one }) => ({
  jamaah: one(jamaahData, {
    fields: [jamaahPayments.jamaahId],
    references: [jamaahData.id],
  }),
  bank: one(masterBanks, {
    fields: [jamaahPayments.bankId],
    references: [masterBanks.id],
  }),
  verifier: one(users, {
    fields: [jamaahPayments.verifiedBy],
    references: [users.id],
    relationName: "paymentVerifier",
  }),
}));

// =====================================================
// TRANSACTIONS RELATIONS
// =====================================================
export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    jamaah: one(jamaahData, {
      fields: [transactions.jamaahId],
      references: [jamaahData.id],
    }),
    package: one(packages, {
      fields: [transactions.packageId],
      references: [packages.id],
    }),
    installments: many(paymentInstallments),
  })
);

// =====================================================
// PAYMENT INSTALLMENTS RELATIONS
// =====================================================
export const paymentInstallmentsRelations = relations(
  paymentInstallments,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [paymentInstallments.transactionId],
      references: [transactions.id],
    }),
  })
);

// =====================================================
// ITIKAF PROGRAMS RELATIONS
// =====================================================
export const itikafProgramsRelations = relations(
  itikafPrograms,
  ({ many }) => ({
    participants: many(itikafParticipants),
  })
);

// =====================================================
// ITIKAF PARTICIPANTS RELATIONS
// =====================================================
export const itikafParticipantsRelations = relations(
  itikafParticipants,
  ({ one }) => ({
    program: one(itikafPrograms, {
      fields: [itikafParticipants.programId],
      references: [itikafPrograms.id],
    }),
    user: one(users, {
      fields: [itikafParticipants.userId],
      references: [users.id],
    }),
  })
);

// =====================================================
// AUDIT LOGS RELATIONS
// =====================================================
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// =====================================================
// USERS RELATIONS
// =====================================================
export const usersRelations = relations(users, ({ one, many }) => ({
  // ✅ FIX: Ubah dari many() jadi one()
  agentData: one(agentData, {
    fields: [users.id],
    references: [agentData.userId],
  }),
  
  jamaahData: many(jamaahData),
  auditLogs: many(auditLogs),
  itikafParticipants: many(itikafParticipants),

  // ✅ TAMBAH INI (user bisa jadi verifier payment)
  verifiedPayments: many(jamaahPayments, { relationName: "paymentVerifier" }),
}));

// =====================================================
// MASTER DATA RELATIONS
// =====================================================
export const masterHotelsRelations = relations(masterHotels, ({ many }) => ({
  packagesMakkah: many(packages, { relationName: "hotelMakkah" }),
  packagesMadinah: many(packages, { relationName: "hotelMadinah" }),
}));

export const masterAirlinesRelations = relations(
  masterAirlines,
  ({ many }) => ({
    packages: many(packages),
  })
);

export const masterAirportsRelations = relations(
  masterAirports,
  ({ many }) => ({
    packages: many(packages),
  })
);

// ✅ UPDATE INI (ga pakai jamaahDocuments lagi)
export const masterDocumentsRelations = relations(
  masterDocuments,
  ({ many }) => ({
    // ❌ HAPUS INI
    // jamaahDocuments: many(jamaahDocuments),
  })
);

// ✅ TAMBAH INI (untuk master_banks)
export const masterBanksRelations = relations(masterBanks, ({ many }) => ({
  payments: many(jamaahPayments),
}));




// ===== AGENT DATA RELATIONS =====
export const agentDataRelations = relations(agentData, ({ one, many }) => ({
  user: one(users, {
    fields: [agentData.userId],
    references: [users.id],
  }),
  currentLevel: one(agentLevels, {
    fields: [agentData.currentLevelId],
    references: [agentLevels.id],
  }),
  transactions: many(agentPaymentTransactions),
  closingHistory: many(agentClosingHistory),
}));

// ===== AGENT LEVELS RELATIONS =====
export const agentLevelsRelations = relations(agentLevels, ({ many }) => ({
  benefits: many(agentBenefits),
  agents: many(agentData),
}));

// ===== AGENT BENEFITS RELATIONS =====
export const agentBenefitsRelations = relations(agentBenefits, ({ one }) => ({
  level: one(agentLevels, {
    fields: [agentBenefits.agentLevelId],
    references: [agentLevels.id],
  }),
}));

// ===== AGENT PAYMENT TRANSACTIONS RELATIONS =====
export const agentPaymentTransactionsRelations = relations(
  agentPaymentTransactions,
  ({ one }) => ({
    agentData: one(agentData, {
      fields: [agentPaymentTransactions.agentDataId],
      references: [agentData.id],
    }),
  })
);

// ===== AGENT CLOSING HISTORY RELATIONS =====
export const agentClosingHistoryRelations = relations(
  agentClosingHistory,
  ({ one }) => ({
    agentData: one(agentData, {
      fields: [agentClosingHistory.agentDataId],
      references: [agentData.id],
    }),
    jamaahData: one(jamaahData, {
      fields: [agentClosingHistory.jamaahDataId],
      references: [jamaahData.id],
    }),
    period: one(periods, {
      fields: [agentClosingHistory.periodId],
      references: [periods.id],
    }),
  })
);
