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
  console.log("🌱 Seeding AksharEvents database...");
  await waitForDatabase();

  const passwordHash = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("password123", 12);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@aksharevents.com" },
    update: {},
    create: {
      name: "Platform Admin",
      email: "admin@aksharevents.com",
      passwordHash,
      role: "ADMIN",
      isVerified: true,
    },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "organizer@aksharevents.com" },
    update: {},
    create: {
      name: "Kenya Events Co.",
      email: "organizer@aksharevents.com",
      passwordHash: userPassword,
      role: "ORGANIZER",
      company: "Kenya Events Co.",
      isVerified: true,
      bio: "Leading event organizer across East Africa specializing in career fairs and conferences.",
    },
  });

  const attendee = await prisma.user.upsert({
    where: { email: "attendee@aksharevents.com" },
    update: {},
    create: {
      name: "Jane Wanjiku",
      email: "attendee@aksharevents.com",
      passwordHash: userPassword,
      role: "ATTENDEE",
      location: "Nairobi, Kenya",
      interests: ["careers", "technology", "education"],
    },
  });

  const exhibitorUser = await prisma.user.upsert({
    where: { email: "exhibitor@aksharevents.com" },
    update: {},
    create: {
      name: "Alex Mwangi",
      email: "exhibitor@aksharevents.com",
      passwordHash: userPassword,
      role: "ATTENDEE",
      phone: "+254712345678",
      company: "TechHub Africa",
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
        name: "BAPS Swaminarayan Mandir",
        slug: "baps-swaminarayan-mandir",
        description: "Stunning Hindu mandir and cultural venue in Nairobi.",
        address: "Prof. Wangari Maathai Rd",
        city: "Nairobi",
        capacity: 1500,
        images: ["/BAPS_Nairobi_Mandir.jpg"],
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
          description: `${e.companyName} showcasing innovative solutions at AksharEvents.`,
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

  // Events
  const eventsData = [
    {
      title: "Kenya Career Expo 2026",
      format: "JOB_FAIR" as const,
      categorySlug: "careers",
      venueSlug: "kicc-convention-centre",
      isFeatured: true,
      isTrending: true,
      banner: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&q=80",
      description: "East Africa's largest career fair connecting top employers with talented professionals. Over 200 companies recruiting across technology, finance, healthcare, and manufacturing sectors.\n\nJoin thousands of job seekers and students exploring career opportunities, attending workshops, and networking with industry leaders.",
      shortDescription: "East Africa's largest career fair with 200+ employers",
      daysFromNow: 30,
      duration: 3,
      capacity: 5000,
      tags: ["careers", "jobs", "recruitment"],
    },
    {
      title: "Nairobi Tech Summit 2026",
      format: "TECHNOLOGY" as const,
      categorySlug: "technology",
      venueSlug: "sarit-expo-centre",
      isFeatured: true,
      isTrending: true,
      banner: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80",
      description: "Africa's premier technology conference bringing together innovators, developers, and tech leaders. Features keynotes, hackathons, startup pitches, and hands-on workshops on AI, cloud computing, and fintech.",
      shortDescription: "Africa's premier tech conference",
      daysFromNow: 45,
      duration: 2,
      capacity: 3000,
      tags: ["technology", "AI", "startups"],
    },
    {
      title: "University of Nairobi Open Day",
      format: "UNIVERSITY_EVENT" as const,
      categorySlug: "education",
      venueSlug: "sarit-expo-centre",
      isFeatured: false,
      isTrending: true,
      banner: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&q=80",
      description: "Explore academic programs, meet faculty, tour campus facilities, and learn about scholarships and admission requirements at Kenya's leading university.",
      shortDescription: "Explore programs and campus life at UoN",
      daysFromNow: 15,
      duration: 1,
      capacity: 2000,
      tags: ["education", "university"],
    },
    {
      title: "East Africa Healthcare Conference",
      format: "HEALTHCARE" as const,
      categorySlug: "healthcare",
      venueSlug: "kicc-convention-centre",
      isFeatured: true,
      isTrending: false,
      banner: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200&q=80",
      description: "Annual healthcare conference addressing medical innovation, public health policy, and healthcare technology adoption across East Africa.",
      shortDescription: "Healthcare innovation across East Africa",
      daysFromNow: 60,
      duration: 2,
      capacity: 1500,
      tags: ["healthcare", "medical"],
    },
    {
      title: "AgriTech Expo Kenya",
      format: "EXPO" as const,
      categorySlug: "agriculture",
      venueSlug: "kicc-convention-centre",
      isFeatured: false,
      isTrending: true,
      banner: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&q=80",
      description: "Showcasing the latest in agricultural technology, sustainable farming practices, and agribusiness opportunities across Kenya and the region.",
      shortDescription: "Agricultural technology and innovation expo",
      daysFromNow: 90,
      duration: 3,
      capacity: 4000,
      tags: ["agriculture", "farming"],
    },
    {
      title: "Corporate Networking Gala",
      format: "NETWORKING" as const,
      categorySlug: "business",
      venueSlug: "sarit-expo-centre",
      isFeatured: false,
      isTrending: false,
      banner: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
      description: "An exclusive evening of networking for business leaders, entrepreneurs, and investors. Connect, collaborate, and create opportunities.",
      shortDescription: "Exclusive business networking evening",
      daysFromNow: 20,
      duration: 1,
      capacity: 500,
      tags: ["business", "networking"],
    },
    {
      title: "Digital Skills Workshop Series",
      format: "WORKSHOP" as const,
      categorySlug: "technology",
      venueSlug: "sarit-expo-centre",
      isFeatured: false,
      isTrending: false,
      banner: "https://images.unsplash.com/photo-1515187028565-61b7229f922d?w=1200&q=80",
      description: "Hands-on workshops covering web development, data science, digital marketing, and cybersecurity. Perfect for career changers and students.",
      shortDescription: "Hands-on digital skills training",
      daysFromNow: 10,
      duration: 1,
      capacity: 200,
      tags: ["technology", "training"],
    },
    {
      title: "Kenya Manufacturing Summit",
      format: "CONFERENCE" as const,
      categorySlug: "manufacturing",
      venueSlug: "kicc-convention-centre",
      isFeatured: true,
      isTrending: false,
      banner: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&q=80",
      description: "Industry leaders discuss manufacturing innovation, supply chain optimization, and Kenya's industrialization agenda.",
      shortDescription: "Manufacturing industry conference",
      daysFromNow: 75,
      duration: 2,
      capacity: 2000,
      tags: ["manufacturing", "industry"],
    },
  ];

  let careerExpoEventId: string | null = null;

  for (const eventData of eventsData) {
    const category = categories.find((c) => c.slug === eventData.categorySlug)!;
    const venue = venues.find((v) => v.slug === eventData.venueSlug)!;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + eventData.daysFromNow);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + eventData.duration - 1);

    const slug = slugify(eventData.title);

    const event = await prisma.event.upsert({
      where: { slug },
      update: { banner: eventData.banner },
      create: {
        title: eventData.title,
        slug,
        description: eventData.description,
        shortDescription: eventData.shortDescription,
        banner: eventData.banner,
        status: "PUBLISHED",
        format: eventData.format,
        isFeatured: eventData.isFeatured,
        isTrending: eventData.isTrending,
        startDate,
        endDate,
        startTime: "09:00",
        endTime: "17:00",
        capacity: eventData.capacity,
        tags: eventData.tags,
        categoryId: category.id,
        venueId: venue.id,
        organizerId: organizer.id,
        terms: "Tickets are non-refundable. Event schedule subject to change.",
      },
    });

    if (slug === "kenya-career-expo-2026") {
      careerExpoEventId = event.id;
    }

    // Ticket types
    await prisma.ticketType.createMany({
      data: [
        { eventId: event.id, name: "General Admission", tier: "FREE", price: 0, quantity: 500, description: "Free entry to the event" },
        { eventId: event.id, name: "Standard Pass", tier: "PAID", price: 1500, quantity: 1000, description: "Full event access" },
        { eventId: event.id, name: "VIP Pass", tier: "VIP", price: 5000, quantity: 100, description: "VIP lounge, priority seating, networking dinner" },
        { eventId: event.id, name: "Group Pass (5)", tier: "GROUP", price: 6000, quantity: 50, maxPerOrder: 5, description: "Group of 5 at discounted rate" },
      ],
      skipDuplicates: true,
    });

    // Speakers
    await prisma.speaker.createMany({
      data: [
        { eventId: event.id, name: "Dr. James Ochieng", title: "CEO", company: "Innovate Africa", order: 0 },
        { eventId: event.id, name: "Sarah Mwangi", title: "Director", company: "Kenya Digital Board", order: 1 },
      ],
      skipDuplicates: true,
    });

    // Agenda
    await prisma.agendaItem.createMany({
      data: [
        { eventId: event.id, title: "Registration & Networking", startTime: "08:00", endTime: "09:00", order: 0 },
        { eventId: event.id, title: "Opening Keynote", startTime: "09:00", endTime: "10:00", speaker: "Dr. James Ochieng", order: 1 },
        { eventId: event.id, title: "Panel Discussion", startTime: "10:30", endTime: "12:00", order: 2 },
        { eventId: event.id, title: "Lunch & Exhibition", startTime: "12:00", endTime: "14:00", order: 3 },
        { eventId: event.id, title: "Workshops", startTime: "14:00", endTime: "16:00", order: 4 },
        { eventId: event.id, title: "Closing Ceremony", startTime: "16:00", endTime: "17:00", order: 5 },
      ],
      skipDuplicates: true,
    });

    // FAQs
    await prisma.fAQ.createMany({
      data: [
        { eventId: event.id, question: "What should I bring?", answer: "Bring a valid ID and your ticket (digital or printed). Business cards recommended for networking events.", order: 0 },
        { eventId: event.id, question: "Is parking available?", answer: "Yes, on-site parking is available at the venue. Arrive early for best spots.", order: 1 },
        { eventId: event.id, question: "Can I get a refund?", answer: "Tickets are non-refundable but transferable to another person.", order: 2 },
      ],
      skipDuplicates: true,
    });

    // Gallery
    await prisma.galleryImage.createMany({
      data: [
        { eventId: event.id, url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80", order: 0 },
        { eventId: event.id, url: "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=600&q=80", order: 1 },
        { eventId: event.id, url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&q=80", order: 2 },
      ],
      skipDuplicates: true,
    });

    // Sponsors
    for (let i = 0; i < Math.min(3, sponsors.length); i++) {
      await prisma.eventSponsor.upsert({
        where: { eventId_sponsorId: { eventId: event.id, sponsorId: sponsors[i].id } },
        update: {},
        create: {
          eventId: event.id,
          sponsorId: sponsors[i].id,
          level: i === 0 ? "PLATINUM" : i === 1 ? "GOLD" : "SILVER",
          order: i,
        },
      });
    }

    // Exhibitors
    for (let i = 0; i < Math.min(2, exhibitors.length); i++) {
      await prisma.eventExhibitor.upsert({
        where: { eventId_exhibitorId: { eventId: event.id, exhibitorId: exhibitors[i].id } },
        update: {},
        create: {
          eventId: event.id,
          exhibitorId: exhibitors[i].id,
          boothNumber: `A${i + 1}`,
          hall: "Main Hall",
        },
      });
    }
  }

  // Sample tours & travel for Career Expo (organizer-created)
  if (careerExpoEventId) {
    const tourStart = new Date();
    tourStart.setDate(tourStart.getDate() + 29);
    tourStart.setHours(10, 0, 0, 0);

    const shuttleStart = new Date(tourStart);
    shuttleStart.setHours(7, 30, 0, 0);

    await prisma.eventActivity.createMany({
      data: [
        {
          eventId: careerExpoEventId,
          createdById: organizer.id,
          kind: "TOUR",
          title: "KICC venue orientation tour",
          description: "Guided walkthrough of halls, booth zones, and exhibitor services.",
          startAt: tourStart,
          endAt: new Date(tourStart.getTime() + 60 * 60 * 1000),
          location: "KICC Main Entrance",
          maxSlots: 30,
          price: 0,
        },
        {
          eventId: careerExpoEventId,
          createdById: organizer.id,
          kind: "TRAVEL",
          travelType: "SHUTTLE",
          title: "Airport shuttle to KICC",
          description: "Complimentary shuttle from Jomo Kenyatta International Airport.",
          startAt: shuttleStart,
          location: "JKIA Terminal 1A",
          maxSlots: 20,
          price: 0,
        },
      ],
      skipDuplicates: true,
    });
  }

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
      { name: "Peter Kamau", role: "HR Manager", company: "Safaricom", content: "AksharEvents helped us connect with over 500 qualified candidates at the Career Expo. Outstanding platform!", rating: 5 },
      { name: "Grace Akinyi", role: "Student", company: "University of Nairobi", content: "Found my internship through a university event listed on AksharEvents. The booking process was seamless!", rating: 5 },
      { name: "David Omondi", role: "Event Organizer", company: "Kenya Events Co.", content: "The organizer dashboard makes managing events, tickets, and check-ins incredibly easy. Highly recommended.", rating: 5 },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Seed completed!");
  console.log("\n📋 Demo Accounts:");
  console.log("  Admin:     admin@aksharevents.com / admin123");
  console.log("  Organizer: organizer@aksharevents.com / password123");
  console.log("  Attendee:  attendee@aksharevents.com / password123");
  console.log("  Exhibitor: exhibitor@aksharevents.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
