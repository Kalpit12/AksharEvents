export type AttractionImage = {
  url: string;
  alt: string;
};

export type KenyaAttraction = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  highlights: string[];
  images: AttractionImage[];
};

/** Encode a filename in /public for use in img src (handles spaces & apostrophes). */
export function publicImage(filename: string) {
  return `/${filename.split("/").map(encodeURIComponent).join("/")}`;
}

function images(...entries: [string, string][]): AttractionImage[] {
  return entries.map(([filename, alt]) => ({ url: publicImage(filename), alt }));
}

export const KENYA_ATTRACTIONS_INTRO = {
  title: "Discover Kenya While You Visit",
  subtitle: "Safari parks, coastlines, mountains & heritage towns",
  overview:
    "Kenya is Africa's original safari destination — a country of sweeping savannahs, snow-capped mountains, coral coasts, and vibrant cultures. If you are exhibiting at an event here, extend your trip and explore world-famous wildlife reserves, UNESCO heritage sites, and unforgettable adventures just hours from Nairobi.",
};

export const KENYA_ATTRACTIONS: KenyaAttraction[] = [
  {
    slug: "masai-mara",
    name: "Masai Mara National Reserve",
    tagline: "Home of the Great Migration",
    description:
      "Kenya's most celebrated game reserve offers exceptional wildlife viewing year-round. Each July to October, millions of wildebeest and zebra cross from the Serengeti in one of nature's greatest spectacles. Lions, cheetahs, elephants, and the iconic Maasai culture make the Mara unmissable.",
    highlights: ["Great Migration (Jul–Oct)", "Big Five safaris", "Hot-air balloon rides", "Maasai village visits"],
    images: images(
      ["Masaimara 1.jpg", "Wildebeest grazing on the Masai Mara plains"],
      ["Masai Mara 2.jpg", "Wildebeest and zebras on the Masai Mara savannah with a safari vehicle"],
      ["Masai mara 3.webp", "Sunset over the Masai Mara grasslands"],
    ),
  },
  {
    slug: "amboseli",
    name: "Amboseli National Park",
    tagline: "Elephants beneath Kilimanjaro",
    description:
      "Set at the foot of Africa's highest peak, Amboseli is the best place on the continent to photograph free-ranging elephants against the dramatic backdrop of Mount Kilimanjaro. Open plains, swamps, and acacia woodlands support rich birdlife and classic safari game.",
    highlights: ["Elephant herds up close", "Mount Kilimanjaro views", "Birdwatching", "Maasai community experiences"],
    images: images(
      ["Amboseli 1.jpg", "Elephant herd walking across Amboseli plains with snow-capped Mount Kilimanjaro behind"],
      ["Amboseli 2.jpg", "Elephants at Amboseli National Park with Kilimanjaro in the distance"],
      ["Amboseli 3.jpg", "Wildlife and acacia trees in Amboseli beneath Mount Kilimanjaro"],
    ),
  },
  {
    slug: "lake-nakuru",
    name: "Lake Nakuru National Park",
    tagline: "Flamingos on the Rift Valley lake",
    description:
      "This shallow alkaline lake in the Great Rift Valley draws vast flocks of lesser flamingos — sometimes over a million birds — creating one of the world's great wildlife spectacles. Rhinos, lions, and leopards also thrive in the park's woodlands and grasslands.",
    highlights: ["Pink flamingo flocks", "Rhino sanctuary", "Rift Valley scenery", "Leopard sightings"],
    images: images(
      ["Lake Nakuru 1.jpg", "Pink flamingos wading in Lake Nakuru at dusk with hills in the background"],
      ["Lake Nakuru 2.jpg", "Flamingos along the shores of Lake Nakuru"],
      ["Lake Nakuru 3.jpg", "Lake Nakuru landscape with wildlife and Rift Valley views"],
    ),
  },
  {
    slug: "tsavo",
    name: "Tsavo National Parks",
    tagline: "Kenya's vast wilderness",
    description:
      "Tsavo East and Tsavo West together form one of the largest national park systems on earth. Famous for red-dust elephants, volcanic landscapes, Mzima Springs' underwater hippo viewing, and remote solitude far from the crowds.",
    highlights: ["Red elephants of Tsavo", "Mzima Springs", "Lugard Falls", "Remote, uncrowded safaris"],
    images: images(
      ["Tsavo 1.jpg", "Elephants and acacia trees in the Tsavo savannah"],
      ["Tsavo 2.jpg", "Red-dust elephants roaming Tsavo National Park"],
      ["Tsavo3.jpg", "Vast open plains of Tsavo East or West"],
    ),
  },
  {
    slug: "lamu",
    name: "Lamu Island",
    tagline: "Swahili heritage on the coast",
    description:
      "Part of the Lamu Archipelago, this UNESCO-listed island has preserved centuries of Swahili culture. Narrow alleyways replace roads, dhows sail the channel, and Lamu Old Town's carved doors and coral stone buildings transport visitors to another era.",
    highlights: ["UNESCO Old Town", "No cars — donkeys & dhows", "Swahili architecture", "Dhow sailing trips"],
    images: images(
      ["Lamu island 1.jpg", "Traditional dhow boats and waterfront along Lamu Island"],
      ["Lamu island 2.jpg", "Swahili architecture and alleyways in Lamu Old Town"],
      ["Lamu island 4.jpg", "Coastal scenery and heritage buildings on Lamu Island"],
    ),
  },
  {
    slug: "hells-gate",
    name: "Hell's Gate National Park",
    tagline: "Walk or cycle among the wildlife",
    description:
      "Named for a narrow break in the cliffs of the Great Rift Valley, Hell's Gate is unique in Kenya — visitors can hike and cycle without a vehicle guide. Towering gorges, geothermal steam vents, and basalt columns create a dramatic volcanic landscape.",
    highlights: ["Guided gorge walks", "Cycling safaris", "Geothermal features", "Rock climbing"],
    images: images(
      ["Hell's gate 1.jpg", "Narrow rocky gorge with a stream running through Hell's Gate National Park"],
      ["Hell's gate 2.jpg", "Valley road and cliffs with Fischer's Tower in Hell's Gate National Park"],
      ["Hell's gate 3.jpg", "Volcanic landscape and gorge trails in Hell's Gate National Park"],
    ),
  },
  {
    slug: "samburu",
    name: "Samburu National Reserve",
    tagline: "Northern Kenya's arid beauty",
    description:
      "Along the banks of the Ewaso Ng'iro River in Kenya's north, Samburu hosts species rarely seen elsewhere — Grevy's zebra, reticulated giraffe, and Somali ostrich. Lions, leopards, and elephants gather at the river in a peaceful, less-visited reserve.",
    highlights: ["Special five species", "Ewaso Ng'iro River", "Samburu culture", "Quiet safari experience"],
    images: images(
      ["Samburu 1.jpg", "Wildlife in the arid landscape of Samburu National Reserve"],
      ["Samburu 2.jpg", "Reticulated giraffes and wildlife along the Ewaso Ng'iro River"],
      ["Samburu 3.jpg", "Samburu reserve scenery with acacia trees and open savannah"],
    ),
  },
  {
    slug: "mount-kenya",
    name: "Mount Kenya",
    tagline: "Africa's second-highest peak",
    description:
      "Crowned with glaciers and alpine forests, Mount Kenya rises to 5,199 metres. Lower slopes offer accessible trekking through bamboo and moorland, while the jagged peaks of Batian and Nelion challenge experienced climbers. UNESCO recognises it as a World Heritage Site.",
    highlights: ["Trekking & hiking", "Alpine lakes & forests", "UNESCO World Heritage", "Rare highland wildlife"],
    images: images(
      ["Mount kenya 1.jpg", "Snow-capped peaks of Mount Kenya above alpine vegetation"],
      ["Mount kenya 2.jpg", "Mount Kenya massif with glaciers and rocky ridges"],
      ["Mount kenya 3.jpg", "High-altitude landscape and peaks of Mount Kenya"],
    ),
  },
  {
    slug: "malindi",
    name: "Malindi & Watamu Coast",
    tagline: "Coral reefs and Indian Ocean beaches",
    description:
      "North of Mombasa, Malindi and Watamu offer white-sand beaches, marine national parks, and excellent snorkelling and diving. The Malindi Marine National Park protects colourful coral reefs, while historic Swahili and Portuguese heritage adds cultural depth.",
    highlights: ["Snorkelling & diving", "Marine National Park", "Deep-sea fishing", "Coastal cuisine"],
    images: images(
      ["Malindi 1.jpg", "Aerial view of Malindi beach resort with turquoise Indian Ocean waters"],
      ["Malindi 2.jpg", "White-sand beaches and palm trees along the Malindi coast"],
      ["Malindi 3.jpg", "Indian Ocean coastline and resort scenery near Malindi"],
    ),
  },
  {
    slug: "nairobi-national-park",
    name: "Nairobi National Park",
    tagline: "Wildlife with a city skyline",
    description:
      "Just minutes from Nairobi's city centre, this is the world's only national park bordering a capital. Giraffes, rhinos, lions, and buffalo roam open grassland with skyscrapers visible on the horizon — perfect for a half-day safari before or after your event.",
    highlights: ["10 minutes from downtown", "Rhino sanctuary", "Giraffe Centre nearby", "Half-day safari option"],
    images: images(
      ["Nairobi national park 4.jpg", "Zebras drinking at a watering hole in Nairobi National Park"],
      ["Naiobi national park 2.jpg", "Wildlife in Nairobi National Park with urban skyline views"],
      ["Naiobi national park 3.jpg", "Savannah and animals in Nairobi National Park near the city"],
    ),
  },
];
