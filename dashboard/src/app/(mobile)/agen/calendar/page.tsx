// dashboard/src/app/(mobile)/agen/calendar/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { agenService } from "@/services/agenService";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNav } from "@/components/mobile/BottomNav";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  Package,
  ArrowLeft,
  Filter,
} from "lucide-react";
import Link from "next/link";
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
  addDays,
  subDays,
  addMonths,
  subMonths,
} from "date-fns";
import { id as localeId } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Event Type Colors (ini boleh di luar component karena bukan hooks)
const EVENT_COLORS: Record<string, { bg: string; text: string; dot: string }> =
  {
    PACKAGE: {
      bg: "bg-green-100",
      text: "text-green-800",
      dot: "bg-green-500",
    },
    ITINERARY: { bg: "bg-blue-100", text: "text-blue-800", dot: "bg-blue-500" },
    DEADLINE: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      dot: "bg-yellow-500",
    },
    MANASIK: {
      bg: "bg-purple-100",
      text: "text-purple-800",
      dot: "bg-purple-500",
    },
    MEETING: {
      bg: "bg-orange-100",
      text: "text-orange-800",
      dot: "bg-orange-500",
    },
    ANNOUNCEMENT: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
    EVENT: { bg: "bg-pink-100", text: "text-pink-800", dot: "bg-pink-500" },
    OTHER: { bg: "bg-gray-100", text: "text-gray-800", dot: "bg-gray-500" },
  };

const TYPE_LABELS: Record<string, string> = {
  PACKAGE: "Paket",
  ITINERARY: "Itinerary",
  DEADLINE: "Deadline",
  MANASIK: "Manasik",
  MEETING: "Meeting",
  ANNOUNCEMENT: "Pengumuman",
  EVENT: "Event",
  OTHER: "Lainnya",
};

export default function AgenCalendarPage() {
  // ✅ SEMUA HOOKS HARUS DI DALAM COMPONENT FUNCTION
  const [currentDate, setCurrentDate] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Calculate date range
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return {
      startDate: format(subDays(monthStart, 7), "yyyy-MM-dd"),
      endDate: format(addDays(monthEnd, 7), "yyyy-MM-dd"),
    };
  }, [currentDate]);

  // Fetch events
  const { data, isLoading } = useQuery({
    queryKey: ["agen-calendar", dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      agenService.calendar.getEventsByRange(
        dateRange.startDate,
        dateRange.endDate,
      ),
    staleTime: 5 * 60 * 1000, // Cache 5 menit
  });

  const events = data?.data || [];

  // Filter events
  const filteredEvents = useMemo(() => {
    if (typeFilter === "all") return events;
    return events.filter((e: any) => e.type === typeFilter);
  }, [events, typeFilter]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event: any) => {
      const eventStart = parseISO(event.startDate);
      const eventEnd = event.endDate ? parseISO(event.endDate) : eventStart;
      return (
        isSameDay(day, eventStart) ||
        isSameDay(day, eventEnd) ||
        isWithinInterval(day, { start: eventStart, end: eventEnd })
      );
    });
  };

  // Events for selected date
  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  // ✅ FIX: Navigation dengan addMonths/subMonths
  const goToPreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const goToToday = () => {
    setCurrentDate(startOfMonth(new Date()));
    setSelectedDate(new Date());
  };

  const weekDays = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Link href="/agen">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-bold text-lg">Kalender</h1>
              <p className="text-xs text-gray-500">Jadwal paket & event</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Hari Ini
          </Button>
        </div>

        {/* Filter */}
        <div className="px-4 pb-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="PACKAGE">🕋 Paket</SelectItem>
              <SelectItem value="DEADLINE">⏰ Deadline</SelectItem>
              <SelectItem value="MANASIK">🤲 Manasik</SelectItem>
              <SelectItem value="MEETING">👥 Meeting</SelectItem>
              <SelectItem value="EVENT">🎉 Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b">
        <Button variant="ghost" size="icon" onClick={goToPreviousMonth}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="font-semibold">
          {format(currentDate, "MMMM yyyy", { locale: localeId })}
        </h2>
        <Button variant="ghost" size="icon" onClick={goToNextMonth}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Calendar Grid */}
          <div className="bg-white p-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* ✅ Days Grid - IMPROVED VISIBILITY */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const dayEvents = getEventsForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasEvents = dayEvents.length > 0;
                const primaryEventType = dayEvents[0]?.type;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
          relative aspect-square p-1 rounded-xl transition-all flex flex-col items-center justify-center
          ${!isCurrentMonth ? "text-gray-300" : ""}
          ${isToday && !isSelected ? "ring-2 ring-[var(--color-primary)]" : ""}
          ${
            isSelected
              ? "bg-[var(--color-primary)] text-white shadow-md"
              : hasEvents && isCurrentMonth
                ? `${EVENT_COLORS[primaryEventType]?.bg || "bg-gray-100"} ${EVENT_COLORS[primaryEventType]?.text || "text-gray-800"}`
                : "hover:bg-gray-100"
          }
        `}
                  >
                    <span
                      className={`text-sm ${hasEvents && !isSelected ? "font-bold" : "font-medium"}`}
                    >
                      {format(day, "d")}
                    </span>

                    {/* Event count badge */}
                    {hasEvents && dayEvents.length > 1 && !isSelected && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold shadow-sm">
                        {dayEvents.length}
                      </span>
                    )}

                    {/* Small icon for single event */}
                    {hasEvents && dayEvents.length === 1 && !isSelected && (
                      <span className="text-[10px] leading-none mt-0.5">
                        {dayEvents[0]?.icon}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Events List */}
          <div className="p-4 space-y-3">
            <h3 className="font-semibold text-sm text-gray-700">
              {selectedDate
                ? format(selectedDate, "EEEE, dd MMMM yyyy", {
                    locale: localeId,
                  })
                : "Jadwal Mendatang"}
            </h3>

            {selectedDate && selectedDateEvents.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">
                    Tidak ada jadwal di tanggal ini
                  </p>
                </CardContent>
              </Card>
            )}

            {(selectedDate
              ? selectedDateEvents
              : filteredEvents.slice(0, 10)
            ).map((event: any) => (
              <Card
                key={event.id}
                className="border-0 shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedEvent(event)}
              >
                <div
                  className={`h-1 ${EVENT_COLORS[event.type]?.dot || "bg-gray-400"}`}
                />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{event.icon}</span>
                        <h4 className="font-semibold text-sm">{event.title}</h4>
                      </div>

                      <Badge
                        variant="secondary"
                        className={`text-xs ${EVENT_COLORS[event.type]?.bg} ${EVENT_COLORS[event.type]?.text}`}
                      >
                        {TYPE_LABELS[event.type] || event.type}
                      </Badge>

                      {!selectedDate && (
                        <p className="text-xs text-gray-500 mt-2">
                          {format(parseISO(event.startDate), "dd MMM yyyy", {
                            locale: localeId,
                          })}
                        </p>
                      )}

                      {event.startTime && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {event.startTime}
                          {event.endTime && ` - ${event.endTime}`}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Empty State */}
            {!selectedDate && filteredEvents.length === 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-10 text-center">
                  <Calendar className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="font-semibold text-gray-600 mb-1">
                    Belum Ada Jadwal
                  </h3>
                  <p className="text-sm text-gray-500">
                    Jadwal akan muncul saat ada paket atau event
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Event Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={() => setSelectedEvent(null)}
      >
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-left">
              <span className="text-2xl">{selectedEvent?.icon}</span>
              <span className="text-base">{selectedEvent?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4">
              <Badge
                className={`${EVENT_COLORS[selectedEvent.type]?.bg} ${EVENT_COLORS[selectedEvent.type]?.text}`}
              >
                {TYPE_LABELS[selectedEvent.type] || selectedEvent.type}
              </Badge>

              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                <span>
                  {format(
                    parseISO(selectedEvent.startDate),
                    "EEEE, dd MMMM yyyy",
                    { locale: localeId },
                  )}
                </span>
              </div>

              {selectedEvent.startTime && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>
                    {selectedEvent.startTime}
                    {selectedEvent.endTime && ` - ${selectedEvent.endTime}`}
                  </span>
                </div>
              )}

              {selectedEvent.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{selectedEvent.location}</span>
                </div>
              )}

              {selectedEvent.package && (
                <div className="p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      {selectedEvent.package.name}
                    </span>
                  </div>
                </div>
              )}

              {selectedEvent.description && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 whitespace-pre-line">
                    {selectedEvent.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav role="AGEN" />
    </div>
  );
}
