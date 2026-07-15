import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

async function waitForDatabase(maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      console.log(`Database not ready (attempt ${attempt}/${maxAttempts}), retrying…`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function main() {
  console.log("🌱 Seeding AxarEvents database...");
  await waitForDatabase();

  const passwordHash = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("password123", 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@axarevents.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@axarevents.com",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@axarevents.com" },
    update: {},
    create: {
      name: "Kenya Events Co.",
      email: "organizer@axarevents.com",
      passwordHash: userPassword,
      role: "ORGANIZER",
      company: "Kenya Events Co.",
      isVerified: true,
      bio: "Leading event organizer across East Africa specializing in career fairs and conferences.",
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: "attendee@axarevents.com" },
    update: {},
    create: {
      name: "Jane Wanjiku",
      email: "attendee@axarevents.com",
      passwordHash: userPassword,
      role: "ATTENDEE",
      location: "Nairobi, Kenya",
      interests: ["careers", "technology", "education"],
    },
  });

  const exhibitorUser = await prisma.user.upsert({
    where: { email: "exhibitor@axarevents.com" },
    update: {},
    create: {
      name: "Alex Mwangi",
      email: "exhibitor@axarevents.com",
      passwordHash: userPassword,
      role: "ATTENDEE",
      phone: "+254712345678",
      company: "TechHub Africa",
    },
  });

  const printingStaff = await prisma.user.upsert({
    where: { email: "printing@axarevents.com" },
    update: { role: "PRINTING_STAFF", passwordHash: userPassword },
    create: {
      name: "Printing Team",
      email: "printing@axarevents.com",
      passwordHash: userPassword,
      role: "PRINTING_STAFF",
      company: "AxarEvents Print & Artwork",
      isVerified: true,
    },
  });

  // Categories
  const categories = await Promise.all(
    [
      { name: "Technology", slug: "technology", icon: "💻", color: "#0D9488" },
      { name: "Business", slug: "business", icon: "💼", color: "#16A34A" },
      { name: "Education", slug: "education", icon: "📚", color: "#3B82F6" },
      { name: "Careers", slug: "careers", icon: "🎯", color: "#F59E0B" },
      { name: "Healthcare", slug: "healthcare", icon: "🏥", color: "#EF4444" },
      { name: "Agriculture", slug: "agriculture", icon: "🌾", color: "#84CC16" },
      { name: "Government", slug: "government", icon: "🏛️", color: "#6366F1" },
      { name: "Manufacturing", slug: "manufacturing", icon: "🏭", color: "#78716C" },
      { name: "Entertainment", slug: "entertainment", icon: "🎭", color: "#EC4899" },
    ].map((cat) =>
      prisma.eventCategory.upsert({
        where: { slug: cat.slug },
        update: {},
        create: cat,
      })
    )
  );

  // Venues
  const venues = await Promise.all(
    [
      {
        name: "BAPS Community Hall",
        slug: "baps-swaminarayan-mandir",
        description: "A spacious community hall in Nairobi suited to conferences, cultural programmes, exhibitions, and large gatherings.",
        address: "Prof. Wangari Maathai Rd",
        city: "Nairobi",
        capacity: 3000,
        images: ["/Baps-outside-2.jpg"],
        facilities: ["Parking", "Assembly Hall"],
        parkingInfo: "On-site parking available",
        accessibility: "Wheelchair accessible",
        isPopular: true,
        latitude: -1.26834,
        longitude: 36.822471,
      },
      {
        name: "KICC Convention Centre",
        slug: "kicc-convention-centre",
        description: "Kenya's premier convention and exhibition centre in the heart of Nairobi.",
        address: "Harambee Avenue, City Square",
        city: "Nairobi",
        capacity: 5000,
        images: ["/KICC.jpg"],
        facilities: ["WiFi", "Parking", "Catering", "AV Equipment", "Accessibility"],
        parkingInfo: "500+ parking spaces available on-site",
        accessibility: "Wheelchair accessible with dedicated facilities",
        isPopular: true,
        latitude: -1.28861,
        longitude: 36.82306,
      },
      {
        name: "Sarit Expo Centre",
        slug: "sarit-expo-centre",
        description: "Westlands premier exhibition and event venue.",
        address: "Karuna Road, Westlands",
        city: "Nairobi",
        capacity: 3000,
        images: ["/SARIT.jpg"],
        facilities: ["WiFi", "Parking", "Catering", "Exhibition Halls"],
        isPopular: true,
        latitude: -1.2602256,
        longitude: 36.8006199,
      },
    ].map((v) =>
      prisma.venue.upsert({
        where: { slug: v.slug },
        update: {
          name: v.name,
          capacity: v.capacity,
          address: v.address,
          latitude: v.latitude,
          longitude: v.longitude,
          images: v.images,
        },
        create: v,
      })
    )
  );

  // Sponsors
  const sponsorNames = [
    "Safaricom",
    "KCB Bank",
    "Equity Bank",
    "Co-operative Bank",
    "NCBA Bank",
    "Absa Bank Kenya",
    "Kenya Airways",
    "Nation Media Group",
    "East African Breweries",
    "KenGen",
    "Kenya Power",
    "Jubilee Insurance",
    "Britam",
    "University of Nairobi",
    "Strathmore University",
    "Bidco Africa",
  ];

  const sponsors = await Promise.all(
    sponsorNames.map((name) =>
      prisma.sponsor.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: {
          name,
          slug: slugify(name),
          description: `${name} — proud supporter of events across Kenya.`,
          website: `https://${slugify(name)}.co.ke`,
        },
      })
    )
  );

  // Exhibitors
  const exhibitorRecords = await Promise.all(
    [
      { companyName: "TechHub Africa", products: ["Software", "Cloud Services", "AI Solutions"], ownerUserId: exhibitorUser.id },
      { companyName: "GreenFields Agri", products: ["Seeds", "Fertilizers", "Farm Equipment"] },
      { companyName: "MediCare Kenya", products: ["Medical Devices", "Health Insurance"] },
      { companyName: "EduTech Solutions", products: ["E-Learning", "Student Management"] },
    ].map((e) =>
      prisma.exhibitor.upsert({
        where: { slug: slugify(e.companyName) },
        update: e.ownerUserId
          ? {
              userId: e.ownerUserId,
              contactName: exhibitorUser.name,
              contactEmail: exhibitorUser.email,
              contactPhone: exhibitorUser.phone,
            }
          : {},
        create: {
          companyName: e.companyName,
          slug: slugify(e.companyName),
          description: `${e.companyName} showcasing innovative solutions at AxarEvents.`,
          products: e.products,
          website: `https://${slugify(e.companyName)}.com`,
          contactName: e.ownerUserId ? exhibitorUser.name! : "Sales Team",
          contactEmail: e.ownerUserId ? exhibitorUser.email : `info@${slugify(e.companyName)}.com`,
          contactPhone: e.ownerUserId ? exhibitorUser.phone : null,
          userId: e.ownerUserId ?? null,
          ...(e.ownerUserId
            ? {
                members: {
                  create: { userId: e.ownerUserId, role: "OWNER" },
                },
              }
            : {}),
        },
      })
    )
  );
  const exhibitors = exhibitorRecords;

  const techHub = exhibitors.find((e) => e.slug === slugify("TechHub Africa"));
  if (techHub) {
    await prisma.exhibitorMember.upsert({
      where: {
        exhibitorId_userId: { exhibitorId: techHub.id, userId: exhibitorUser.id },
      },
      update: { role: "OWNER" },
      create: {
        exhibitorId: techHub.id,
        userId: exhibitorUser.id,
        role: "OWNER",
      },
    });
  }

  // Categories, venues, sponsors, and exhibitors above are seeded for catalogue use.
  // Events themselves are created via Event Master — no demo events here.

  // Coupon
  await prisma.coupon.upsert({
    where: { code: "WELCOME20" },
    update: {},
    create: {
      code: "WELCOME20",
      description: "20% off your first paid ticket",
      discountType: "percentage",
      discountValue: 20,
      maxUses: 1000,
      isActive: true,
    },
  });

  // Testimonials
  await prisma.testimonial.createMany({
    data: [
      { name: "Peter Kamau", role: "HR Manager", company: "Safaricom", content: "AxarEvents helped us connect with over 500 qualified candidates at the Career Expo. Outstanding platform!", rating: 5 },
      { name: "Grace Akinyi", role: "Student", company: "University of Nairobi", content: "Found my internship through a university event listed on AxarEvents. The booking process was seamless!", rating: 5 },
      { name: "David Omondi", role: "Event Organizer", company: "Kenya Events Co.", content: "The organizer dashboard makes managing events, tickets, and check-ins incredibly easy. Highly recommended.", rating: 5 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completed!");
  console.log("\n📋 Demo Accounts:");
  console.log("  Admin:     admin@axarevents.com / admin123");
  console.log("  Organizer: organizer@axarevents.com / password123");
  console.log("  Attendee:  attendee@axarevents.com / password123");
  console.log("  Exhibitor: exhibitor@axarevents.com / password123");
  console.log("  Printing:  printing@axarevents.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
