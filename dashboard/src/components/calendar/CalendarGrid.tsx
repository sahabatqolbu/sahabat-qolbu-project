// dashboard/src/components/calendar/CalendarGrid.tsx
"use client";

import { useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  parseISO,
  addMonths, // ✅ ADD
  subMonths, // ✅ ADD
} from "date-fns";
import { id } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CalendarEvent {
  id: number;
  title: string;
  type: string;
  startDate: string;
  endDate?: string;
  color: string;
  icon: string;
  packageId?: number;
}

interface CalendarGridProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  onDateClick: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  selectedDate: Date | null;
}

const EVENT_COLORS: Record<string, string> = {
  green: "bg-green-500 text-white",
  blue: "bg-blue-500 text-white",
  red: "bg-red-500 text-white",
  yellow: "bg-yellow-500 text-white",
  purple: "bg-purple-500 text-white",
  orange: "bg-orange-500 text-white",
  pink: "bg-pink-500 text-white",
};

const EVENT_BG_COLORS: Record<string, { bg: string; text: string }> = {
  PACKAGE: { bg: "bg-green-100", text: "text-green-800" },
  ITINERARY: { bg: "bg-blue-100", text: "text-blue-800" },
  DEADLINE: { bg: "bg-yellow-100", text: "text-yellow-800" },
  MANASIK: { bg: "bg-purple-100", text: "text-purple-800" },
  MEETING: { bg: "bg-orange-100", text: "text-orange-800" },
  ANNOUNCEMENT: { bg: "bg-red-100", text: "text-red-800" },
  EVENT: { bg: "bg-pink-100", text: "text-pink-800" },
  OTHER: { bg: "bg-gray-100", text: "text-gray-800" },
};

export function CalendarGrid({
  currentDate,
  onDateChange,
  events,
  onDateClick,
  onEventClick,
  selectedDate,
}: CalendarGridProps) {
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (day: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;

      // Check if day falls within event range
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        isWithinInterval(day, { start: eventStart, end: eventEnd })
      );
    });
  };

  // ✅ FIX: Navigation dengan addMonths/subMonths
  const goToPreviousMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <Card className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {format(currentDate, "MMMM yyyy", { locale: id })}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hari Ini
          </Button>
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const hasEvents = dayEvents.length > 0;
          const primaryEventType = dayEvents[0]?.type;

          return (
            <div
              key={index}
              className={cn(
                "min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors relative",
                !isCurrentMonth && "bg-gray-50 text-gray-400",
                isCurrentMonth && !hasEvents && "bg-white",
                isToday && "ring-2 ring-primary",
                isSelected && "bg-primary/10 border-primary",
                hasEvents &&
                  isCurrentMonth &&
                  !isSelected &&
                  EVENT_BG_COLORS[primaryEventType]?.bg,
                "hover:bg-gray-100",
              )}
              onClick={() => onDateClick(day)}
            >
              {/* Date Number */}
              <div
                className={cn(
                  "text-sm font-medium mb-1",
                  !isCurrentMonth && "text-gray-400",
                  isToday && "text-primary font-bold",
                  hasEvents &&
                    isCurrentMonth &&
                    EVENT_BG_COLORS[primaryEventType]?.text,
                )}
              >
                {format(day, "d")}
              </div>

              {/* Event count badge */}
              {hasEvents && dayEvents.length > 1 && (
                <span className="absolute top-0 right-1 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {dayEvents.length}
                </span>
              )}

              {/* Events */}
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={`${event.id}-${day.toISOString()}`}
                    className={cn(
                      "text-xs px-1 py-0.5 rounded truncate cursor-pointer",
                      EVENT_COLORS[event.color] || "bg-gray-500 text-white",
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    title={event.title}
                  >
                    {event.icon} {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 2} lainnya
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-3 h-3 rounded bg-green-500"></div>
          <span>Paket</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-3 h-3 rounded bg-blue-500"></div>
          <span>Jadwal</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-3 h-3 rounded bg-yellow-500"></div>
          <span>Deadline</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-3 h-3 rounded bg-purple-500"></div>
          <span>Event</span>
        </div>
      </div>
    </Card>
  );
}
