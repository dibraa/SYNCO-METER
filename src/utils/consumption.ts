export interface HourlyEnergy {
  hour: number;
  energyKwh: number | null;
  partial: boolean;
}

export interface RoomConsumption {
  roomId: string;
  name: string;
  location: string;
  date: string;
  hourly: HourlyEnergy[];
  todayKwh: number;
  monthKwh: number;
}

type DemoRoom = { id: string; name: string; location: string; todayKwh: number; monthKwh: number };

export const sumEnergy = (hours: HourlyEnergy[]) =>
  Math.round(hours.reduce((total, item) => total + (item.energyKwh ?? 0), 0) * 10000) / 10000;

/** Session snapshot, not measured telemetry. Allocate integer units to avoid rounding drift. */
export function createConsumptionSnapshot(rooms: DemoRoom[], now = new Date()): RoomConsumption[] {
  const local = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const date = local.toISOString().slice(0, 10);
  const hour = local.getUTCHours();
  return rooms.map((room, index) => {
    const weights = Array.from({ length: hour + 1 }, (_, h) =>
      (h >= 18 ? 3 : h >= 6 ? 2 : 1) + ((h + index) % 3) * 0.2);
    const weightTotal = weights.reduce((a, b) => a + b, 0);
    const totalUnits = Math.round(Math.max(0, room.todayKwh) * 10000);
    let allocated = 0;
    const hourly = Array.from({ length: 24 }, (_, h): HourlyEnergy => {
      if (h > hour) return { hour: h, energyKwh: null, partial: false };
      const units = h === hour ? totalUnits - allocated : Math.floor(totalUnits * weights[h] / weightTotal);
      allocated += units;
      return { hour: h, energyKwh: units / 10000, partial: h === hour };
    });
    const todayKwh = sumEnergy(hourly);
    return { roomId: room.id, name: room.name, location: room.location, date, hourly,
      todayKwh, monthKwh: Math.max(todayKwh, room.monthKwh) };
  });
}

export function combineHourly(rooms: RoomConsumption[]): HourlyEnergy[] {
  if (!rooms.length) return [];
  return Array.from({ length: 24 }, (_, hour) => {
    const entries = rooms.flatMap(room => room.hourly.filter(item => item.hour === hour));
    return { hour, energyKwh: entries.some(item => item.energyKwh !== null) ? sumEnergy(entries) : null,
      partial: entries.some(item => item.partial) };
  });
}

export const formatCost = (kwh: number, tariff: number) =>
  `₱${(kwh * tariff).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatHour12 = (hour: number, includeMinutes = true): string => {
  const normalized = ((hour % 24) + 24) % 24;
  const period = normalized >= 12 ? 'PM' : 'AM';
  const h = normalized % 12 === 0 ? 12 : normalized % 12;
  return includeMinutes ? `${h}:00 ${period}` : `${h} ${period}`;
};

export const hourLabel = (hour: number) => formatHour12(hour, true);
