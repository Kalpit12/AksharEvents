import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function photoId(url) {
  const match = url.match(/photo-([a-z0-9-]+)/i);
  return match?.[1] ?? url;
}

async function dedupeByKey(rows, keyFn) {
  const seen = new Map();
  const deleteIds = [];
  for (const row of rows) {
    const key = keyFn(row);
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, row.id);
      continue;
    }
    deleteIds.push(row.id);
  }
  return deleteIds;
}

async function cleanupEvent(slug) {
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      speakers: true,
      agenda: true,
      gallery: true,
      faqs: true,
      ticketTypes: true,
    },
  });

  if (!event) {
    console.log(`Event not found: ${slug}`);
    return;
  }

  const speakerDeletes = await dedupeByKey(event.speakers, (s) =>
    s.name.trim().toLowerCase()
  );
  const agendaDeletes = await dedupeByKey(event.agenda, (a) =>
    `${a.title.trim().toLowerCase()}|${a.startTime}|${a.endTime}`
  );
  const faqDeletes = await dedupeByKey(event.faqs, (f) =>
    f.question.trim().toLowerCase()
  );

  const bannerPhoto = event.banner ? photoId(event.banner) : null;
  const gallerySeen = new Set();
  const galleryDeletes = [];
  for (const image of event.gallery) {
    const key = photoId(image.url);
    if (bannerPhoto && key === bannerPhoto) {
      galleryDeletes.push(image.id);
      continue;
    }
    if (gallerySeen.has(key)) {
      galleryDeletes.push(image.id);
      continue;
    }
    gallerySeen.add(key);
  }

  const ticketSeen = new Map();
  const ticketDeletes = [];
  for (const ticket of event.ticketTypes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
    const key = ticket.name.trim().toLowerCase();
    const keepId = ticketSeen.get(key);
    if (!keepId) {
      ticketSeen.set(key, ticket.id);
      continue;
    }
    if (ticket.sold === 0) {
      ticketDeletes.push(ticket.id);
    }
  }

  if (speakerDeletes.length) {
    await prisma.speaker.deleteMany({ where: { id: { in: speakerDeletes } } });
  }
  if (agendaDeletes.length) {
    await prisma.agendaItem.deleteMany({ where: { id: { in: agendaDeletes } } });
  }
  if (faqDeletes.length) {
    await prisma.fAQ.deleteMany({ where: { id: { in: faqDeletes } } });
  }
  if (galleryDeletes.length) {
    await prisma.galleryImage.deleteMany({ where: { id: { in: galleryDeletes } } });
  }
  if (ticketDeletes.length) {
    await prisma.ticketType.deleteMany({ where: { id: { in: ticketDeletes } } });
  }

  console.log(
    JSON.stringify(
      {
        slug,
        removed: {
          speakers: speakerDeletes.length,
          agenda: agendaDeletes.length,
          faqs: faqDeletes.length,
          gallery: galleryDeletes.length,
          tickets: ticketDeletes.length,
        },
      },
      null,
      2
    )
  );
}

const slugArg = process.argv[2];
const allEvents = slugArg === "--all";

if (allEvents) {
  const events = await prisma.event.findMany({ select: { slug: true }, orderBy: { title: "asc" } });
  let totalRemoved = { speakers: 0, agenda: 0, faqs: 0, gallery: 0, tickets: 0 };
  for (const { slug } of events) {
    const event = await prisma.event.findUnique({
      where: { slug },
      include: { speakers: true, agenda: true, gallery: true, faqs: true, ticketTypes: true },
    });
    if (!event) continue;

    const speakerDeletes = await dedupeByKey(event.speakers, (s) => s.name.trim().toLowerCase());
    const agendaDeletes = await dedupeByKey(event.agenda, (a) =>
      `${a.title.trim().toLowerCase()}|${a.startTime}|${a.endTime}`
    );
    const faqDeletes = await dedupeByKey(event.faqs, (f) => f.question.trim().toLowerCase());

    const bannerPhoto = event.banner ? photoId(event.banner) : null;
    const gallerySeen = new Set();
    const galleryDeletes = [];
    for (const image of event.gallery) {
      const key = photoId(image.url);
      if (bannerPhoto && key === bannerPhoto) {
        galleryDeletes.push(image.id);
        continue;
      }
      if (gallerySeen.has(key)) {
        galleryDeletes.push(image.id);
        continue;
      }
      gallerySeen.add(key);
    }

    const ticketSeen = new Map();
    const ticketDeletes = [];
    for (const ticket of event.ticketTypes.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())) {
      const key = ticket.name.trim().toLowerCase();
      if (!ticketSeen.has(key)) {
        ticketSeen.set(key, ticket.id);
        continue;
      }
      if (ticket.sold === 0) ticketDeletes.push(ticket.id);
    }

    if (speakerDeletes.length) await prisma.speaker.deleteMany({ where: { id: { in: speakerDeletes } } });
    if (agendaDeletes.length) await prisma.agendaItem.deleteMany({ where: { id: { in: agendaDeletes } } });
    if (faqDeletes.length) await prisma.fAQ.deleteMany({ where: { id: { in: faqDeletes } } });
    if (galleryDeletes.length) await prisma.galleryImage.deleteMany({ where: { id: { in: galleryDeletes } } });
    if (ticketDeletes.length) await prisma.ticketType.deleteMany({ where: { id: { in: ticketDeletes } } });

    const removed = {
      speakers: speakerDeletes.length,
      agenda: agendaDeletes.length,
      faqs: faqDeletes.length,
      gallery: galleryDeletes.length,
      tickets: ticketDeletes.length,
    };
    const sum = Object.values(removed).reduce((a, b) => a + b, 0);
    if (sum > 0) console.log(JSON.stringify({ slug, removed }, null, 2));
    for (const k of Object.keys(totalRemoved)) totalRemoved[k] += removed[k];
  }
  console.log(JSON.stringify({ scope: "all-events", totalRemoved }, null, 2));
} else {
  const slug = slugArg ?? "kenya-career-expo-2026";
  await cleanupEvent(slug);
}

await prisma.$disconnect();
