// dashboard/src/app/(dashboard)/admin/calendar/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { CalendarGrid } from "@/components/calendar/CalendarGrid";
import { EventList } from "@/components/calendar/EventList";
import { EventFormDialog } from "@/components/calendar/EventFormDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Loader2,
  Filter,
  List,
  Grid,
  Package,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, addDays, subDays } from "date-fns";

export default function AdminCalendarPage() {
  // =====================================================
  // 1. STATE
  // =====================================================
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // =====================================================
  // 2. CALCULATE DATE RANGE
  // =====================================================
  const dateRange = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    return {
      startDate: format(subDays(monthStart, 7), "yyyy-MM-dd"),
      endDate: format(addDays(monthEnd, 7), "yyyy-MM-dd"),
    };
  }, [currentDate]);

  // =====================================================
  // 3. FETCH EVENTS
  // =====================================================
  const { data, isLoading, error } = useQuery({
    queryKey: ["calendar-events", dateRange.startDate, dateRange.endDate],
    queryFn: () =>
      adminService.calendar.getEventsByRange(
        dateRange.startDate,
        dateRange.endDate,
      ),
  });

  // =====================================================
  // 4. EXTRACT EVENTS FROM DATA
  // =====================================================
  const events = data?.data || [];

  // =====================================================
  // 5. FILTER EVENTS
  // =====================================================
  const filteredEvents = useMemo(() => {
    if (typeFilter === "all") return events;
    return events.filter((e: any) => e.type === typeFilter);
  }, [events, typeFilter]);

  // =====================================================
  // 6. CALCULATE STATS (SETELAH events dideklarasikan!)
  // =====================================================
  const stats = useMemo(() => {
    return {
      total: events.length,
      packages: events.filter((e: any) => e.type === "PACKAGE").length,
      deadlines: events.filter((e: any) => e.type === "DEADLINE").length,
      events: events.filter(
        (e: any) => !["PACKAGE", "DEADLINE", "ITINERARY"].includes(e.type),
      ).length,
    };
  }, [events]);

  // =====================================================
  // 7. DEBUG LOGS (SETELAH semua deklarasi!)
  // =====================================================
  console.log("📅 Date Range:", dateRange);
  console.log("📅 Events:", events);
  console.log("📅 Stats:", stats);

  // =====================================================
  // 8. HANDLERS
  // =====================================================
  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: any) => {
    if (event.type === "PACKAGE") {
      // Package events can't be edited directly
      return;
    }
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setDialogOpen(true);
  };

  // =====================================================
  // 9. RENDER
  // =====================================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Kalender
          </h1>
          <p className="text-gray-600 mt-1">
            Kelola jadwal paket, deadline, dan event
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("calendar")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="rounded-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Add Event Button */}
          <Button onClick={handleAddEvent} className="gap-2">
            <Plus className="h-4 w-4" />
            Tambah Event
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:border-primary"
          onClick={() => setTypeFilter("all")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Event</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-300" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-green-500"
          onClick={() => setTypeFilter("PACKAGE")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Paket</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.packages}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-yellow-500"
          onClick={() => setTypeFilter("DEADLINE")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Deadline</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.deadlines}
                </p>
              </div>
              <div className="text-3xl">⏰</div>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:border-purple-500"
          onClick={() => setTypeFilter("EVENT")}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Event Lain</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.events}
                </p>
              </div>
              <div className="text-3xl">🎉</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tipe</SelectItem>
              <SelectItem value="PACKAGE">🕋 Paket</SelectItem>
              <SelectItem value="ITINERARY">📋 Jadwal Paket</SelectItem>
              <SelectItem value="DEADLINE">⏰ Deadline</SelectItem>
              <SelectItem value="MANASIK">🤲 Manasik</SelectItem>
              <SelectItem value="MEETING">👥 Meeting</SelectItem>
              <SelectItem value="EVENT">🎉 Event</SelectItem>
              <SelectItem value="ANNOUNCEMENT">📢 Pengumuman</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {typeFilter !== "all" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTypeFilter("all")}
          >
            Reset Filter
          </Button>
        )}

        {selectedDate && (
          <Badge variant="secondary" className="gap-1">
            <Calendar className="h-3 w-3" />
            {format(selectedDate, "dd MMM yyyy")}
            <button
              className="ml-1 hover:text-red-500"
              onClick={() => setSelectedDate(null)}
            >
              ×
            </button>
          </Badge>
        )}
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-500">Gagal memuat kalender</p>
          <p className="text-sm text-gray-500 mt-2">
            {(error as any)?.message || "Unknown error"}
          </p>
        </div>
      ) : viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2">
            <CalendarGrid
              currentDate={currentDate}
              onDateChange={setCurrentDate}
              events={filteredEvents}
              onDateClick={handleDateClick}
              onEventClick={handleEventClick}
              selectedDate={selectedDate}
            />
          </div>

          {/* Event List Sidebar */}
          <div>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>
                    {selectedDate
                      ? format(selectedDate, "dd MMMM")
                      : "Event Bulan Ini"}
                  </span>
                  {selectedDate && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEvent(null);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <EventList
                  events={filteredEvents}
                  selectedDate={selectedDate}
                  onEventClick={handleEventClick}
                  showAll={!selectedDate}
                  maxItems={selectedDate ? 20 : 10}
                  emptyMessage={
                    selectedDate
                      ? "Tidak ada event di tanggal ini"
                      : "Tidak ada event bulan ini"
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* List View */
        <Card>
          <CardHeader>
            <CardTitle>Semua Event</CardTitle>
          </CardHeader>
          <CardContent>
            <EventList
              events={filteredEvents}
              onEventClick={handleEventClick}
              showAll
              maxItems={50}
              emptyMessage="Tidak ada event"
            />
          </CardContent>
        </Card>
      )}

      {/* Event Form Dialog */}
      <EventFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={selectedEvent}
        defaultDate={selectedDate || undefined}
      />
    </div>
  );
}
