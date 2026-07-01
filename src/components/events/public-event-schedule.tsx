import { EventScheduleTimeline } from "@/components/events/event-schedule-timeline";
import { groupScheduleByDay } from "@/lib/event-master-aggregations";
import { Clock } from "lucide-react";

type AgendaItem = {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  speaker?: string | null;
};

type ScheduleItem = {
  id: string;
  title: string;
  description: string | null;
  speaker: string | null;
  speakerImageUrl: string | null;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
};

export function PublicEventScheduleSection({
  scheduleItems,
  agenda,
}: {
  scheduleItems: ScheduleItem[];
  agenda: AgendaItem[];
}) {
  if (scheduleItems.length > 0) {
    const serialized = scheduleItems.map((item) => ({
      id: item.id,
      title: item.title,
      speaker: item.speaker,
      speakerImageUrl: item.speakerImageUrl,
      description: item.description,
      location: item.location,
      startAt: item.startAt.toISOString(),
      endAt: item.endAt?.toISOString() ?? null,
    }));

    const byDay = groupScheduleByDay(serialized);
    const multipleDays = byDay.length > 1;

    return (
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
          <Clock className="h-5 w-5 text-primary" />
          Schedule
        </h2>
        <div className="space-y-6">
          {byDay.map(({ day, items }) => (
            <div key={day}>
              {multipleDays ? (
                <p className="mb-3 text-sm font-medium text-muted-foreground">{day}</p>
              ) : null}
              <EventScheduleTimeline items={items} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (agenda.length === 0) return null;

  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-xl font-bold">
        <Clock className="h-5 w-5 text-primary" />
        Schedule
      </h2>
      <EventScheduleTimeline
        items={agenda.map((item) => ({
          id: item.id,
          title: item.title,
          speaker: item.speaker,
          description: item.description,
          startAt: `1970-01-01T${item.startTime}:00`,
          endAt: `1970-01-01T${item.endTime}:00`,
        }))}
      />
    </section>
  );
}
