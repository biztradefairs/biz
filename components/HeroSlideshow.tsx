import { prisma } from "@/lib/prisma";
import HeroSlideshowClient from "./HeroSlideshowClient";

export const dynamic = "force-dynamic"; // Always fresh SSR

export default async function HeroSlideshow() {
  const events = await prisma.event.findMany({
    where: { isVIP: true },
    select: {
      id: true,
      title: true,
      startDate: true,
      endDate: true,
      bannerImage: true,
      images: true,
      venue: {
        select: {
          venueName: true,
          // venueAddress: true,
          venueCity: true,
          venueCountry: true,
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  // ✅ Convert Date → string for client safety
  const serializedEvents = events.map((event) => ({
    ...event,
    startDate: event.startDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
  }));

  return <HeroSlideshowClient initialEvents={serializedEvents} />;
}
