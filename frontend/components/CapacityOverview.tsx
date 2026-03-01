"use client";

interface CapacityOverviewProps {
  totalBeds: number;
  census: number;
  icuMax: number;
  icuOccupied: number;
  admissions: number;
  discharges: number;
  births: number;
}

function pctColor(pct: number) {
  if (pct >= 90) return "text-signal-red";
  if (pct >= 75) return "text-signal-amber";
  return "text-signal-green";
}

export function CapacityOverview({
  totalBeds,
  census,
  icuMax,
  icuOccupied,
  admissions,
  discharges,
  births,
}: CapacityOverviewProps) {
  const occupancyPct = totalBeds > 0 ? Math.round((census / totalBeds) * 100) : 0;
  const icuPct = icuMax > 0 ? Math.round((icuOccupied / icuMax) * 100) : 0;
  const netFlow = admissions + births - discharges;

  return (
    <div className="panel h-full">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-green" />
        Capacity overview
      </div>
      <div className="grid grid-cols-3 gap-x-4 gap-y-3 p-3 sm:p-4">
        <Stat label="Total beds" value={totalBeds.toLocaleString()} />
        <Stat label="Census" value={census.toLocaleString()} />
        <Stat label="Occupancy" value={`${occupancyPct}%`} valueClass={pctColor(occupancyPct)} />
        <Stat label="ICU" value={`${icuOccupied}/${icuMax}`} valueClass={pctColor(icuPct)} />
        <Stat label="Net flow" value={netFlow >= 0 ? `+${netFlow}` : `${netFlow}`} valueClass={netFlow > 0 ? "text-signal-amber" : "text-signal-green"} />
        <Stat label="Births" value={births.toLocaleString()} />
      </div>
    </div>
  );
}

function Stat({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center justify-center">
      <p className="whitespace-nowrap text-[10px] uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`data-value mt-0.5 text-base sm:text-xl ${valueClass ?? "text-gray-100"}`}>{value}</p>
    </div>
  );
}
