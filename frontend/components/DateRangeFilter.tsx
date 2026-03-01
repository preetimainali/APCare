"use client";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartChange: (date: string) => void;
  onEndChange: (date: string) => void;
  dataStart: string;
  dataEnd: string;
  currentDate: string;
}

const PRESETS: { label: string; daysBefore: number; daysAfter: number }[] = [
  { label: "Last 7d", daysBefore: 7, daysAfter: 0 },
  { label: "Last 14d", daysBefore: 14, daysAfter: 0 },
  { label: "Last 30d", daysBefore: 30, daysAfter: 0 },
  { label: "All history", daysBefore: 999, daysAfter: 0 },
  { label: "All + forecast", daysBefore: 999, daysAfter: 999 },
];

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function DateRangeFilter({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  dataStart,
  dataEnd,
  currentDate,
}: DateRangeFilterProps) {
  function applyPreset(p: { daysBefore: number; daysAfter: number }) {
    const cur = new Date(currentDate);
    const ds = new Date(dataStart);
    const de = new Date(dataEnd);

    const start = new Date(cur);
    start.setDate(start.getDate() - p.daysBefore);
    if (start < ds) start.setTime(ds.getTime());

    const end = new Date(cur);
    end.setDate(end.getDate() + p.daysAfter);
    if (end > de) end.setTime(de.getTime());

    onStartChange(toDateStr(start));
    onEndChange(toDateStr(end));
  }

  const includesForecast = new Date(endDate) > new Date(currentDate);

  return (
    <div className="panel h-full">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
        Date range
      </div>
      <div className="space-y-3 p-3">
        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #30363d",
                background: "transparent",
                color: "#9ca3af",
                fontSize: 11,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#a78bfa"; e.currentTarget.style.color = "#c4b5fd"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#30363d"; e.currentTarget.style.color = "#9ca3af"; }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Date inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-gray-600">From</label>
            <input
              type="date"
              value={startDate}
              min={dataStart}
              max={endDate}
              onChange={(e) => onStartChange(e.target.value)}
              className="data-value w-full rounded border border-bunker-600 bg-bunker-800 px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-[9px] uppercase tracking-wider text-gray-600">To</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              max={dataEnd}
              onChange={(e) => onEndChange(e.target.value)}
              className="data-value w-full rounded border border-bunker-600 bg-bunker-800 px-2 py-1.5 text-xs text-gray-200 outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 text-[10px]">
          {includesForecast ? (
            <span className="flex items-center gap-1 text-purple-400">
              <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
              Includes forecast
            </span>
          ) : (
            <span className="text-gray-600">Historical only</span>
          )}
        </div>
      </div>
    </div>
  );
}
