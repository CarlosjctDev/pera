import type { CalendarEvent } from '../models/calendar-event.model';

const WEEK_START = 1;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function monthRange(year: number, month: number): { start: string; end: string } {
  return {
    start: toDayKey(new Date(year, month - 1, 1)),
    end: toDayKey(new Date(year, month, 0)),
  };
}

export function buildMonthMatrix(year: number, month: number): readonly (readonly Date[])[] {
  const first = new Date(year, month - 1, 1);
  const offset = (first.getDay() - WEEK_START + 7) % 7;
  const start = new Date(year, month - 1, 1 - offset);

  const weeks: Date[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const days: Date[] = [];

    for (let day = 0; day < 7; day += 1) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + week * 7 + day));
    }

    weeks.push(days);
  }

  return weeks;
}

export function groupEventsByDay(
  events: readonly CalendarEvent[],
): ReadonlyMap<string, readonly CalendarEvent[]> {
  const map = new Map<string, CalendarEvent[]>();

  for (const event of events) {
    const current = map.get(event.day);

    if (current === undefined) {
      map.set(event.day, [event]);
    } else {
      current.push(event);
    }
  }

  return map;
}
