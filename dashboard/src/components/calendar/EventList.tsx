// dashboard/src/components/calendar/EventList.tsx
"use client";

import { useMemo } from "react";
import { format, parseISO, isSameDay, isAfter } from "date-fns";
import { id } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  type: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  color: string;
  icon: string;
  location?: string;
  packageId?: number;
  package?: {
    id: number;
    name: string;
    code: string;
  };
}

interface EventListProps {
  events: CalendarEvent[];
  selectedDate?: Date | null;
  onEventClick: (event: CalendarEvent) => void;
  showAll?: boolean;
  maxItems?: number;
  emptyMessage?: string;
}

const TYPE_LABELS: Record<string, string> = {
  PACKAGE: "Paket",
  ITINERARY: "Jadwal",
  DEADLINE: "Deadline",
  MANASIK: "Manasik",
  MEETING: "Meeting",
  EVENT: "Event",
  ANNOUNCEMENT: "Pengumuman",
  OTHER: "Lainnya",
};

const TYPE_COLORS: Record<string, string> = {
  PACKAGE: "bg-green-100 text-green-800",
  ITINERARY: "bg-blue-100 text-blue-800",
  DEADLINE: "bg-yellow-100 text-yellow-800",
  MANASIK: "bg-purple-100 text-purple-800",
  MEETING: "bg-orange-100 text-orange-800",
  EVENT: "bg-pink-100 text-pink-800",
  ANNOUNCEMENT: "bg-red-100 text-red-800",
  OTHER: "bg-gray-100 text-gray-800",
};

export function EventList({
  events,
  selectedDate,
  onEventClick,
  showAll = false,
  maxItems = 10,
  emptyMessage = "Tidak ada event",
}: EventListProps) {
  // Filter and sort events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Filter by selected date if provided
    if (selectedDate && !showAll) {
      result = result.filter((event) => {
        const eventStart = parseISO(event.startDate);
        const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;

        return (
          isSameDay(selectedDate, eventStart) ||
          isSameDay(selectedDate, eventEnd) ||
          (isAfter(selectedDate, eventStart) && isAfter(eventEnd, selectedDate))
        );
      });
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = parseISO(a.startDate);
      const dateB = parseISO(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Limit items
    return result.slice(0, maxItems);
  }, [events, selectedDate, showAll, maxItems]);

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredEvents.map((event) => (
        <div
          key={event.id}
          className={cn(
            "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50",
            event.type === "PACKAGE" && "border-green-200 bg-green-50/50",
          )}
          onClick={() => onEventClick(event)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">{event.icon}</span>
              <div>
                <h4 className="font-medium text-sm">{event.title}</h4>
                {event.package && (
                  <p className="text-xs text-gray-500">{event.package.code}</p>
                )}
              </div>
            </div>
            <Badge
              variant="secondary"
              className={cn("text-xs", TYPE_COLORS[event.type])}
            >
              {TYPE_LABELS[event.type] || event.type}
            </Badge>
          </div>

          {/* Date & Time */}
          <div className="mt-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>📅</span>
              <span>
                {format(parseISO(event.startDate), "dd MMM yyyy", {
                  locale: id,
                })}
                {event.endDate &&
                  event.endDate !== event.startDate &&
                  ` - ${format(parseISO(event.endDate), "dd MMM yyyy", { locale: id })}`}
              </span>
            </div>
            {event.startTime && (
              <div className="flex items-center gap-2 mt-1">
                <span>🕐</span>
                <span>
                  {event.startTime}
                  {event.endTime && ` - ${event.endTime}`}
                </span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 mt-1">
                <span>📍</span>
                <span>{event.location}</span>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <p className="mt-2 text-xs text-gray-500 line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
