"use client";

interface ICUOccupancyProps {
  occupied: number;
  total: number;
}

function barColor(percent: number) {
  if (percent >= 85) return "bg-signal-red";
  if (percent >= 75) return "bg-signal-amber";
  return "bg-signal-green";
}

export function ICUOccupancy({ occupied, total }: ICUOccupancyProps) {
  const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const available = total - occupied;

  return (
    <div className="panel h-full">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-amber" />
        ICU status
      </div>
      <div className="p-4">
        <div className="mb-3 flex items-end justify-between">
          <div>
            <p className={`data-value text-3xl font-semibold ${percent >= 85 ? "text-signal-red" : percent >= 75 ? "text-signal-amber" : "text-signal-green"}`}>
              {percent}%
            </p>
            <p className="text-xs text-gray-500">occupied</p>
          </div>
          <div className="text-right">
            <p className="data-value text-lg text-gray-300">{occupied}<span className="text-gray-500">/{total}</span></p>
            <p className="text-xs text-gray-500">{available} available</p>
          </div>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-bunker-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor(percent)}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
