import dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

import { db } from "./index.js";
import {
  users,
  masterDocuments,
  faqs,
  masterHotels,
  masterAirlines,
  masterAirports,
  packages,
} from "./schema.js";
import bcrypt from "bcrypt";

async function seed() {
  console.log("🌱 Seeding database...\n");

  // Verify database connection
  console.log("🔍 Database config:");
  console.log("   Host:", process.env.DB_HOST);
  console.log("   User:", process.env.DB_USER);
  console.log("   Database:", process.env.DB_NAME);
  console.log("   Password:", process.env.DB_PASSWORD ? "***" : "(empty)");
  console.log("");

  try {
    // =====================================================
    // 1. CREATE ADMIN & FINANCE USERS
    // =====================================================
    console.log("👤 Creating users...");

    const hashedPassword = await bcrypt.hash("Admin123!", 10);

    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.email, "admin@sahabatqolbu.com"),
    });

    if (!existingAdmin) {
      // Insert users one by one to avoid bulk insert issues
      const adminUser = await db.insert(users).values({
        email: "admin@sahabatqolbu.com",
        password: hashedPassword,
        role: "ADMIN",
        fullName: "Super Admin",
        phone: "081234567890",
        isActive: true,
        isEmailVerified: true,
      });
      console.log("✅ Admin user created");

      const financeUser = await db.insert(users).values({
        email: "finance@sahabatqolbu.com",
        password: hashedPassword,
        role: "FINANCE",
        fullName: "Finance Team",
        phone: "081234567891",
        isActive: true,
        isEmailVerified: true,
      });
      console.log("✅ Finance user created");

      const agenUser = await db.insert(users).values({
        email: "agen@sahabatqolbu.com",
        password: hashedPassword,
        role: "AGEN",
        fullName: "Agen Travel",
        phone: "081234567892",
        isActive: true,
        isEmailVerified: true,
      });
      console.log("✅ Agen user created");
    } else {
      console.log("ℹ️  Admin user already exists, skipping...");
    }

    // =====================================================
    // 2. CREATE MASTER DOCUMENTS
    // =====================================================
    console.log("\n📄 Creating master documents...");

    const existingDocs = await db.query.masterDocuments.findMany();

    if (existingDocs.length === 0) {
      await db.insert(masterDocuments).values([
        {
          name: "KTP",
          description: "Kartu Tanda Penduduk",
          category: "IDENTITAS",
          isMandatory: true,
          fileFormat: "PDF,JPG,PNG",
          maxSizeMB: 5,
          isActive: true,
        },
        {
          name: "Kartu Keluarga",
          description: "Kartu Keluarga",
          category: "IDENTITAS",
          isMandatory: true,
          fileFormat: "PDF,JPG,PNG",
          maxSizeMB: 5,
          isActive: true,
        },
        {
          name: "Paspor",
          description: "Paspor (minimal berlaku 6 bulan)",
          category: "TRAVEL",
          isMandatory: true,
          fileFormat: "PDF,JPG,PNG",
          maxSizeMB: 5,
          isActive: true,
        },
        {
          name: "Foto 4x6",
          description: "Foto 4x6 latar belakang putih",
          category: "TRAVEL",
          isMandatory: true,
          fileFormat: "JPG,PNG",
          maxSizeMB: 2,
          isActive: true,
        },
        {
          name: "Buku Vaksin Meningitis",
          description: "Sertifikat vaksin meningitis",
          category: "KESEHATAN",
          isMandatory: true,
          fileFormat: "PDF,JPG",
          maxSizeMB: 5,
          isActive: true,
        },
        {
          name: "Surat Keterangan Mahram",
          description: "Untuk jamaah wanita di bawah 45 tahun",
          category: "LAINNYA",
          isMandatory: false,
          fileFormat: "PDF,JPG,PNG",
          maxSizeMB: 5,
          isActive: true,
        },
      ]);
      console.log("✅ Master documents created");
    } else {
      console.log("ℹ️  Master documents already exist, skipping...");
    }

    // =====================================================
    // 2B. CREATE PUBLIC FAQ CONTENT
    // =====================================================
    console.log("\n❓ Creating public FAQ content...");

    const existingFaqs = await db.query.faqs.findMany({
      columns: {
        question: true,
      },
    });
    const existingFaqQuestions = new Set(
      existingFaqs.map((faq) =>
        String(faq.question || "")
          .trim()
          .toLowerCase(),
      ),
    );

    const faqSeedItems = [
      {
        category: "UMRAH",
        question: "Dokumen apa saja yang harus disiapkan saat pendaftaran?",
        answer:
          "Dokumen pendaftaran yang harus disiapkan:\n" +
          "- Fotocopy KTP\n" +
          "- Fotocopy Kartu Keluarga\n" +
          "- Paspor aktif\n" +
          "- Pas foto 4x6",
        sortOrder: 1,
      },
      {
        category: "UMRAH",
        question: "Apa saja syarat jamaah untuk mendaftar paket umroh?",
        answer:
          "Syarat jamaah:\n" +
          "- Sehat jasmani dan rohani\n" +
          "- Tidak memiliki kendala jalan kaki\n" +
          "- Tidak ada batas usia\n" +
          "- Jamaah usia 60 tahun ke atas atau memiliki riwayat komorbid disarankan didampingi keluarga",
        sortOrder: 2,
      },
      {
        category: "UMRAH",
        question: "Biaya apa saja yang tidak termasuk dalam paket?",
        answer:
          "Biaya yang tidak termasuk dalam paket:\n" +
          "- Pembuatan / perpanjangan paspor\n" +
          "- Biaya pengiriman perlengkapan jamaah\n" +
          "- Keperluan pribadi selama perjalanan\n" +
          "- Vaksin meningitis dan polio apabila diwajibkan sesuai ketentuan\n" +
          "- Perjalanan domestik dari / ke bandara keberangkatan\n" +
          "- Tiket Kereta Gantung Thaif / Telefric",
        sortOrder: 3,
      },
      {
        category: "UMRAH",
        question: "Apa syarat dan alur pembuatan paspor untuk umroh?",
        answer:
          "Dokumen pembuatan paspor yang dibutuhkan:\n" +
          "- KTP asli dan fotocopy (diperbesar A4)\n" +
          "- KK asli dan fotocopy\n" +
          "- Akta Lahir / Ijazah asli dan fotocopy\n" +
          "- Buku Nikah asli dan fotocopy (bagi pasangan suami istri)\n" +
          "- Untuk perpanjangan: paspor lama asli dan fotocopy\n\n" +
          "Proses pembuatan paspor mandiri oleh jamaah:\n" +
          '1. Download aplikasi "Layanan Paspor Online" di Playstore\n' +
          "2. Daftar akun dan pilih Kantor Imigrasi terdekat\n" +
          "3. Datang sesuai jadwal dengan dokumen asli dan fotocopy (2 rangkap)\n" +
          "4. Wawancara, foto, dan sidik jari\n" +
          "5. Bayar setelah mendapat Bukti Pengantar Pembayaran\n" +
          "6. Paspor jadi 5-7 hari setelah pembayaran",
        sortOrder: 4,
      },
      {
        category: "UMRAH",
        question: "Berapa ketentuan nama paspor untuk visa umroh?",
        answer:
          "Untuk visa umroh, nama jamaah minimal 3 kata. Jika paspor hanya 1 kata, perlu proses penambahan nama di Kantor Imigrasi sebelum visa bisa diproses. Jika nama hanya 1 kata, bisa ditambahkan nama Ayah dan nama Kakek dari pihak Ayah sesuai KK, Akta, atau Buku Nikah.",
        sortOrder: 5,
      },
      {
        category: "UMRAH",
        question: "Bagaimana aturan vaksin meningitis untuk jamaah umroh?",
        answer:
          "Vaksin meningitis (Buku Kuning ICV) bisa dilakukan di Kantor Kesehatan Pelabuhan (KKP) terdekat atau rumah sakit / klinik bersertifikat ICV.\n\n" +
          "Dokumen yang dibawa ke KKP:\n" +
          "- Tanda terima pendaftaran online\n" +
          "- Fotocopy paspor\n" +
          "- Fotocopy KTP\n" +
          "- Foto 4x6 2 lembar dengan background putih\n\n" +
          "Catatan penting:\n" +
          "- Daftar online KKP: https://kespel.kemkes.go.id/vaksinasi_int/vaksinasi_int_public/add\n" +
          "- Waktu terbaik vaksin paling lambat 2 minggu sebelum keberangkatan\n" +
          "- Masa berlaku Buku Kuning 2 tahun\n" +
          "- Jika sudah punya Buku Hijau Haji yang masih berlaku dan memuat data meningitis, bisa digunakan",
        sortOrder: 6,
      },
    ];

    const faqToInsert = faqSeedItems.filter(
      (item) =>
        !existingFaqQuestions.has(
          String(item.question || "")
            .trim()
            .toLowerCase(),
        ),
    );

    if (faqToInsert.length > 0) {
      await db.insert(faqs).values(
        faqToInsert.map((item) => ({
          ...item,
          isActive: true,
        })),
      );
      console.log(`✅ FAQ seeded (${faqToInsert.length} new items)`);
    } else {
      console.log(
        "ℹ️  Public FAQ already contains the seeded items, skipping...",
      );
    }

    // =====================================================
    // 3. CREATE MASTER AIRLINES
    // =====================================================
    console.log("\n✈️  Creating master airlines...");

    const existingAirlines = await db.query.masterAirlines.findMany();

    if (existingAirlines.length === 0) {
      await db.insert(masterAirlines).values([
        {
          code: "GA",
          name: "Garuda Indonesia",
          logo: "https://www.garuda-indonesia.com/logo.png",
          country: "Indonesia",
          isActive: true,
        },
        {
          code: "SV",
          name: "Saudia Airlines",
          logo: "https://www.saudia.com/logo.png",
          country: "Saudi Arabia",
          isActive: true,
        },
        {
          code: "QR",
          name: "Qatar Airways",
          logo: "https://www.qatarairways.com/logo.png",
          country: "Qatar",
          isActive: true,
        },
        {
          code: "EY",
          name: "Etihad Airways",
          logo: "https://www.etihad.com/logo.png",
          country: "UAE",
          isActive: true,
        },
      ]);
      console.log("✅ Master airlines created");
    } else {
      console.log("ℹ️  Master airlines already exist, skipping...");
    }

    // =====================================================
    // 4. CREATE MASTER AIRPORTS
    // =====================================================
    console.log("\n🛫 Creating master airports...");

    const existingAirports = await db.query.masterAirports.findMany();

    if (existingAirports.length === 0) {
      await db.insert(masterAirports).values([
        {
          code: "CGK",
          name: "Soekarno-Hatta International Airport",
          city: "Jakarta",
          country: "Indonesia",
          isActive: true,
        },
        {
          code: "SUB",
          name: "Juanda International Airport",
          city: "Surabaya",
          country: "Indonesia",
          isActive: true,
        },
        {
          code: "JED",
          name: "King Abdulaziz International Airport",
          city: "Jeddah",
          country: "Saudi Arabia",
          isActive: true,
        },
        {
          code: "MED",
          name: "Prince Mohammad Bin Abdulaziz Airport",
          city: "Madinah",
          country: "Saudi Arabia",
          isActive: true,
        },
      ]);
      console.log("✅ Master airports created");
    } else {
      console.log("ℹ️  Master airports already exist, skipping...");
    }

    // =====================================================
    // 5. CREATE MASTER HOTELS
    // =====================================================
    console.log("\n🏨 Creating master hotels...");

    const existingHotels = await db.query.masterHotels.findMany();

    if (existingHotels.length === 0) {
      await db.insert(masterHotels).values([
        {
          name: "Fairmont Makkah Clock Royal Tower",
          city: "MAKKAH",
          address: "Abraj Al Bait Complex, Makkah",
          starRating: 5,
          distanceToHaram: 50,
          facilities: JSON.stringify([
            "WiFi",
            "AC",
            "Restaurant",
            "Room Service",
            "Laundry",
          ]),
          imageUrl: "https://example.com/fairmont.jpg",
          isActive: true,
        },
        {
          name: "Pullman ZamZam Makkah",
          city: "MAKKAH",
          address: "Abraj Al Bait, Makkah",
          starRating: 5,
          distanceToHaram: 100,
          facilities: JSON.stringify(["WiFi", "Pool", "Gym", "Restaurant"]),
          imageUrl: "https://example.com/pullman.jpg",
          isActive: true,
        },
        {
          name: "Swissotel Makkah",
          city: "MAKKAH",
          address: "Ibrahim Al Khalil Street, Makkah",
          starRating: 5,
          distanceToHaram: 200,
          facilities: JSON.stringify(["WiFi", "Restaurant", "Spa"]),
          imageUrl: "https://example.com/swissotel.jpg",
          isActive: true,
        },
        {
          name: "Anwar Al Madinah Movenpick Hotel",
          city: "MADINAH",
          address: "King Fahd Road, Madinah",
          starRating: 5,
          distanceToHaram: 150,
          facilities: JSON.stringify(["WiFi", "Restaurant", "Room Service"]),
          imageUrl: "https://example.com/movenpick.jpg",
          isActive: true,
        },
        {
          name: "Pullman ZamZam Madinah",
          city: "MADINAH",
          address: "Al Masjid Al Nabawi Road, Madinah",
          starRating: 5,
          distanceToHaram: 200,
          facilities: JSON.stringify(["WiFi", "Pool", "Restaurant"]),
          imageUrl: "https://example.com/pullman-madinah.jpg",
          isActive: true,
        },
      ]);
      console.log("✅ Master hotels created");
    } else {
      console.log("ℹ️  Master hotels already exist, skipping...");
    }

    // =====================================================
    // 6. CREATE SAMPLE PACKAGES
    // =====================================================
    console.log("\n📦 Creating sample packages...");

    const existingPackages = await db.query.packages.findMany();

    if (existingPackages.length === 0) {
      await db.insert(packages).values([
        {
          code: "UMR-2024-001",
          name: "Umrah Ramadhan 2024 - Premium",
          type: "FULL_SERVICE",
          duration: 9,
          price: "25000000.00",
          discountPrice: "24000000.00",
          departureDate: new Date("2024-03-10"),
          returnDate: new Date("2024-03-18"),
          airlineId: 1,
          hotelMakkahId: 1,
          hotelMadinahId: 4,
          totalSeats: 45,
          bookedSeats: 0,
          itinerary: JSON.stringify({
            day1: "Keberangkatan dari Jakarta",
            day2: "Tiba di Jeddah, menuju Madinah",
            day3: "Ziarah Madinah",
            day4: "Madinah - Makkah",
            day5: "Umrah pertama",
            day6: "Tawaf & Sai",
            day7: "Ziarah Makkah",
            day8: "Persiapan pulang",
            day9: "Tiba di Jakarta",
          }),
          facilities: JSON.stringify([
            "Tiket pesawat PP",
            "Hotel bintang 5",
            "Makan 3x sehari",
            "Bus AC",
            "Perlengkapan umrah",
            "Pembimbing berpengalaman",
          ]),
          notes: "Harga sudah termasuk tiket, hotel, makan, dan transportasi.",
          isActive: true,
          isPublished: true,
        },
        {
          code: "UMR-2024-002",
          name: "Umrah Plus Turki 2024",
          type: "EXTREME",
          duration: 12,
          price: "35000000.00",
          discountPrice: "33000000.00",
          departureDate: new Date("2024-04-15"),
          returnDate: new Date("2024-04-26"),
          airlineId: 2,
          hotelMakkahId: 2,
          hotelMadinahId: 5,
          totalSeats: 40,
          bookedSeats: 0,
          itinerary: JSON.stringify({
            day1: "Jakarta - Istanbul",
            day2: "Tour Istanbul",
            day3: "Istanbul - Jeddah",
          }),
          facilities: JSON.stringify(["Tiket PP", "Hotel 5*", "Tour Istanbul"]),
          notes: "Termasuk tour Istanbul.",
          isActive: true,
          isPublished: true,
        },
      ]);
      console.log("✅ Sample packages created");
    } else {
      console.log("ℹ️  Packages already exist, skipping...");
    }

    console.log("\n✅ Seeding completed successfully!\n");
    console.log("📊 Summary:");
    console.log("   - Users: 3 (ADMIN, FINANCE, AGEN)");
    console.log("   - Master Documents: 6");
    console.log("   - Airlines: 4");
    console.log("   - Airports: 4");
    console.log("   - Hotels: 5");
    console.log("   - Packages: 2");
    console.log("   - Public FAQ: seeded");
    console.log("\n🔐 Login Credentials:");
    console.log("   Email: admin@sahabatqolbu.com");
    console.log("   Password: Admin123!");
    console.log("   Role: ADMIN\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    console.error("\nFull error:", error);
    process.exit(1);
  }
}

seed();
