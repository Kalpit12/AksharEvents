import * as XLSX from "xlsx";
import type { TourTravelStopType } from "@prisma/client";

export type ParsedTourTravelStop = {
  stopType: TourTravelStopType;
  title: string;
  location: string | null;
  startAt: Date | null;
  endAt: Date | null;
  notes: string | null;
  sortOrder: number;
};

export type ParsedTourTravelDay = {
  dayIndex: number;
  dayDate: Date | null;
  title: string;
  stops: ParsedTourTravelStop[];
};

export type ParsedTourTravelUpload = {
  title: string;
  description: string | null;
  vehicleInfo: string | null;
  memberCount: number | null;
  hotelInfo: string | null;
  days: ParsedTourTravelDay[];
};

export type ParsedEventScheduleItem = {
  title: string;
  startAt: Date;
  endAt: Date | null;
  location: string | null;
  description: string | null;
  speaker: string | null;
};

export type ParsedEventScheduleUpload = {
  items: ParsedEventScheduleItem[];
};

const ACCEPTED_EXTENSIONS = /\.(xlsx|xls|csv)$/i;

export function isAcceptedScheduleFileName(fileName: string) {
  return ACCEPTED_EXTENSIONS.test(fileName);
}

export function readWorkbookRows(buffer: Buffer, fileName: string) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: true,
    raw: true,
  });

  const preferredSheet =
    workbook.SheetNames.find((name) => /detailed/i.test(name)) ??
    workbook.SheetNames.find((name) => /summary/i.test(name)) ??
    workbook.SheetNames[0];

  const sheet = workbook.Sheets[preferredSheet];
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: true,
  });

  return { sheetName: preferredSheet, rows };
}

function cellText(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value).replace(/\r\n/g, "\n").trim();
}

function firstLine(value: string) {
  return value.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

function parseDayIndex(value: string): number | null {
  const match = value.match(/day\s*(\d+)/i);
  return match ? Number(match[1]) : null;
}

function parseDateFromCell(value: unknown): Date | null {
  const text = cellText(value);
  if (!text) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  const line = firstLine(text);
  const match = line.match(/(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})/);
  if (match) {
    const parsed = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date(line);
  if (!Number.isNaN(fallback.getTime())) {
    return new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  return null;
}

function excelSerialToDate(serial: number): Date | null {
  const parsed = XLSX.SSF.parse_date_code(serial);
  if (!parsed) return null;
  return new Date(parsed.y, parsed.m - 1, parsed.d, parsed.H, parsed.M, parsed.S);
}

function applyDayFraction(date: Date, fraction: number) {
  const totalMinutes = Math.round(fraction * 24 * 60);
  date.setHours(Math.floor(totalMinutes / 60), totalMinutes % 60, 0, 0);
}

function parseTimeOnDate(value: unknown, baseDate: Date | null): Date | null {
  if (value == null || value === "") return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    if (baseDate && value.getFullYear() <= 1900) {
      const result = new Date(baseDate);
      result.setHours(value.getHours(), value.getMinutes(), value.getSeconds(), 0);
      return result;
    }
    return value;
  }

  if (typeof value === "number") {
    if (!baseDate) return null;
    if (value >= 1) {
      const whole = Math.floor(value);
      const fraction = value - whole;
      const serial = excelSerialToDate(whole);
      if (!serial) return null;
      const result = new Date(serial);
      applyDayFraction(result, fraction);
      return result;
    }
    const result = new Date(baseDate);
    applyDayFraction(result, value);
    return result;
  }

  const text = cellText(value);
  if (!text) return null;

  const ampm = text.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (ampm && baseDate) {
    let hours = Number(ampm[1]);
    const minutes = Number(ampm[2]);
    const meridiem = ampm[3].toUpperCase();
    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;
    const result = new Date(baseDate);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  const twentyFour = text.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour && baseDate) {
    const result = new Date(baseDate);
    result.setHours(Number(twentyFour[1]), Number(twentyFour[2]), 0, 0);
    return result;
  }

  return null;
}

function inferStopType(place: string, isFirstStopOfDay: boolean): TourTravelStopType {
  const text = place.toLowerCase();
  if (/night\s*stay|overnight|night stay in/i.test(text)) return "STAY";
  if (
    isFirstStopOfDay &&
    /^(arrive|arrival|leave|depart|depature|departure)/i.test(place.trim())
  ) {
    return "START";
  }
  if (/^(leave|depart|depature|departure)\s/i.test(place.trim())) return "START";
  return "STOP";
}

function buildStopNotes(parts: Array<string | null | undefined>) {
  const lines = parts.map((part) => part?.trim()).filter(Boolean) as string[];
  return lines.length > 0 ? lines.join("\n") : null;
}

function extractTitleFromRows(rows: unknown[][], fileName: string) {
  for (let i = 0; i < Math.min(rows.length, 3); i++) {
    const text = firstLine(cellText(rows[i]?.[0]));
    if (text && !/^day$/i.test(text) && text.length > 3) {
      return text.replace(/\s+/g, " ").slice(0, 120);
    }
  }
  return fileName.replace(/\.(xlsx|xls|csv)$/i, "").replace(/[_-]+/g, " ").trim();
}

function findHeaderRowIndex(rows: unknown[][]) {
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((cell) => cellText(cell).toLowerCase());
    const hasDay = cells.some((cell) => cell === "day" || cell.startsWith("day "));
    const hasPlace = cells.some((cell) => cell.includes("place"));
    const hasTime = cells.some((cell) => cell.includes("time") || cell.includes("t ime"));
    if (hasDay && hasPlace && hasTime) return i;
  }
  return -1;
}

function isTourTravelFormat(rows: unknown[][]) {
  return findHeaderRowIndex(rows) >= 0;
}

export function parseTourTravelUpload(buffer: Buffer, fileName: string): ParsedTourTravelUpload {
  const { rows } = readWorkbookRows(buffer, fileName);
  const headerIndex = findHeaderRowIndex(rows);
  if (headerIndex < 0) {
    throw new Error("Could not find Day / Date / Time / Place columns in the uploaded file.");
  }

  const header = rows[headerIndex].map((cell) => cellText(cell).toLowerCase());
  const accommodationIndex = header.findIndex((cell) =>
    /accommodation|accomodation|hotel/.test(cell)
  );

  const accommodations = new Set<string>();
  const days: ParsedTourTravelDay[] = [];
  let currentDay: ParsedTourTravelDay | null = null;
  let currentDate: Date | null = null;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const dayCell = cellText(row[0]);
    const dateCell = row[1];
    const timeCell = row[2];
    const placeCell = cellText(row[3]);
    const kmCell = cellText(row[4]);
    const travelTimeCell = cellText(row[5]);
    const accommodationCell =
      accommodationIndex >= 0 ? cellText(row[accommodationIndex]) : "";

    if (!dayCell && !placeCell && !cellText(dateCell) && !cellText(timeCell)) continue;

    const dayIndexFromCell = dayCell ? parseDayIndex(dayCell) : null;
    if (dayIndexFromCell) {
      currentDay = {
        dayIndex: dayIndexFromCell,
        dayDate: parseDateFromCell(dateCell) ?? currentDate,
        title: `Day ${dayIndexFromCell}`,
        stops: [],
      };
      days.push(currentDay);
    }

    const parsedDate = parseDateFromCell(dateCell);
    if (parsedDate) currentDate = parsedDate;
    if (currentDay && parsedDate) currentDay.dayDate = parsedDate;

    if (!placeCell) continue;
    if (!currentDay) {
      currentDay = {
        dayIndex: 1,
        dayDate: currentDate,
        title: "Day 1",
        stops: [],
      };
      days.push(currentDay);
    }

    if (accommodationCell) accommodations.add(accommodationCell);

    const title = firstLine(placeCell) || placeCell;
    const location =
      placeCell.includes("\n") && placeCell.split("\n").length > 1
        ? placeCell.split("\n").slice(1).join(", ").trim() || null
        : null;

    const stop: ParsedTourTravelStop = {
      stopType: inferStopType(placeCell, currentDay.stops.length === 0),
      title: title.slice(0, 200),
      location,
      startAt: parseTimeOnDate(timeCell, currentDay.dayDate ?? currentDate),
      endAt: null,
      notes: buildStopNotes([
        kmCell ? `Distance: ${kmCell} km` : null,
        travelTimeCell ? `Travel time: ${travelTimeCell}` : null,
        placeCell.includes("\n") ? placeCell.split("\n").slice(1).join("\n") : null,
        accommodationCell && /night\s*stay/i.test(placeCell) ? `Stay: ${accommodationCell}` : null,
      ]),
      sortOrder: currentDay.stops.length,
    };

    currentDay.stops.push(stop);
  }

  if (days.length === 0) {
    throw new Error("No day-by-day schedule rows were found in the uploaded file.");
  }

  const hotelInfo = accommodations.size > 0 ? [...accommodations].join("\n") : null;

  return {
    title: extractTitleFromRows(rows, fileName),
    description: `Imported from ${fileName}`,
    vehicleInfo: null,
    memberCount: null,
    hotelInfo,
    days,
  };
}

function findGenericHeaderRow(rows: unknown[][]) {
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].map((cell) => cellText(cell).toLowerCase());
    const hasTitle = cells.some(
      (cell) => /^(title|session|activity|event|name)$/.test(cell) || cell.includes("session")
    );
    const hasStart = cells.some((cell) => /start|date|time|datetime|from/.test(cell));
    if (hasTitle && hasStart) return i;
  }
  return -1;
}

function columnIndex(headers: string[], patterns: RegExp[]) {
  return headers.findIndex((header) => patterns.some((pattern) => pattern.test(header)));
}

export function parseEventScheduleUpload(buffer: Buffer, fileName: string): ParsedEventScheduleUpload {
  const { rows } = readWorkbookRows(buffer, fileName);

  if (isTourTravelFormat(rows)) {
    const tour = parseTourTravelUpload(buffer, fileName);
    const items: ParsedEventScheduleItem[] = [];
    for (const day of tour.days) {
      for (const stop of day.stops) {
        if (!stop.startAt) continue;
        items.push({
          title: stop.title,
          startAt: stop.startAt,
          endAt: stop.endAt,
          location: stop.location,
          description: stop.notes,
          speaker: null,
        });
      }
    }
    if (items.length === 0) {
      throw new Error("No timed schedule rows were found in the uploaded file.");
    }
    return { items };
  }

  const headerIndex = findGenericHeaderRow(rows);
  if (headerIndex < 0) {
    throw new Error(
      "Could not read event schedule columns. Use Title, Start, End, Location headers — or a Day / Date / Time / Place travel sheet."
    );
  }

  const headers = rows[headerIndex].map((cell) => cellText(cell).toLowerCase());
  const titleIndex = columnIndex(headers, [/title/, /session/, /activity/, /event/, /^name$/]);
  const startIndex = columnIndex(headers, [/start/, /^date$/, /^time$/, /datetime/, /from/]);
  const endIndex = columnIndex(headers, [/end/, /to/, /finish/]);
  const locationIndex = columnIndex(headers, [/location/, /venue/, /room/, /hall/, /place/]);
  const descriptionIndex = columnIndex(headers, [/description/, /notes/, /details/]);
  const speakerIndex = columnIndex(headers, [/speaker/, /presenter/, /host/, /facilitator/]);

  if (titleIndex < 0 || startIndex < 0) {
    throw new Error("Missing required columns: Title and Start (or Date/Time).");
  }

  const items: ParsedEventScheduleItem[] = [];
  let lastDate: Date | null = null;

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i] ?? [];
    const title = cellText(row[titleIndex]);
    if (!title) continue;

    const startCell = row[startIndex];
    const endCell = endIndex >= 0 ? row[endIndex] : null;

    const parsedDate = parseDateFromCell(startCell);
    if (parsedDate) lastDate = parsedDate;

    const startAt =
      startCell instanceof Date
        ? startCell
        : parseTimeOnDate(startCell, lastDate) ?? parseDateFromCell(startCell);

    if (!startAt || Number.isNaN(startAt.getTime())) continue;

    const endAt =
      endCell instanceof Date ? endCell : parseTimeOnDate(endCell, lastDate);

    items.push({
      title: firstLine(title).slice(0, 200),
      startAt,
      endAt: endAt && !Number.isNaN(endAt.getTime()) ? endAt : null,
      location: locationIndex >= 0 ? cellText(row[locationIndex]) || null : null,
      description: descriptionIndex >= 0 ? cellText(row[descriptionIndex]) || null : null,
      speaker: speakerIndex >= 0 ? cellText(row[speakerIndex]) || null : null,
    });
  }

  if (items.length === 0) {
    throw new Error("No event schedule rows were found in the uploaded file.");
  }

  return { items };
}
