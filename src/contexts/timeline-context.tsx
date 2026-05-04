"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { generateId } from "@/lib/format";
import type { TimelineEvent, TimelineEventType } from "@/types/timeline";

type TimelineContextValue = {
  events: TimelineEvent[];
  addEvent: (event: Omit<TimelineEvent, "id" | "createdAt" | "createdBy">) => void;
  getEventsForEntity: (entityType: string, entityId: string) => TimelineEvent[];
  addNote: (entityType: "cliente" | "cotacao" | "atendimento", entityId: string, note: string) => void;
};

const TimelineContext = createContext<TimelineContextValue | null>(null);

const STORAGE_KEY = "agencia-hub-timeline";

function loadEvents(): TimelineEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as TimelineEvent[];
  } catch {
    return [];
  }
}

function saveEvents(events: TimelineEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    setEvents(loadEvents());
  }, []);

  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const addEvent = useCallback(
    (event: Omit<TimelineEvent, "id" | "createdAt" | "createdBy">) => {
      const newEvent: TimelineEvent = {
        ...event,
        id: generateId(),
        createdAt: new Date().toISOString(),
        createdBy: user?.nome || "Sistema",
      };
      setEvents((prev) => [newEvent, ...prev]);
    },
    [user]
  );

  const getEventsForEntity = useCallback(
    (entityType: string, entityId: string) => {
      return events.filter(
        (e) => e.entityType === entityType && e.entityId === entityId
      );
    },
    [events]
  );

  const addNote = useCallback(
    (
      entityType: "cliente" | "cotacao" | "atendimento",
      entityId: string,
      note: string
    ) => {
      addEvent({
        type: "nota_adicionada",
        entityType,
        entityId,
        title: "Nota adicionada",
        description: note,
      });
    },
    [addEvent]
  );

  const value = useMemo<TimelineContextValue>(
    () => ({
      events,
      addEvent,
      getEventsForEntity,
      addNote,
    }),
    [events, addEvent, getEventsForEntity, addNote]
  );

  return (
    <TimelineContext.Provider value={value}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  const ctx = useContext(TimelineContext);
  if (!ctx) throw new Error("useTimeline must be used within TimelineProvider");
  return ctx;
}
