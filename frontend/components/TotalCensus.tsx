"use client";

interface TotalCensusProps {
  census: number;
  capacity: number;
}

export function TotalCensus({ census, capacity }: TotalCensusProps) {
  const pct = capacity > 0 ? Math.round((census / capacity) * 100) : 0;
  const pctColor = pct >= 90 ? "text-signal-red" : pct >= 75 ? "text-signal-amber" : "text-signal-green";

  return (
    <div className="panel h-full">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
        Total census
      </div>
      <div className="flex flex-col items-center justify-center p-5">
        <p className="data-value text-5xl font-bold text-gray-100">
          {census.toLocaleString()}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={`data-value text-lg font-medium ${pctColor}`}>{pct}%</span>
          <span className="text-sm text-gray-500">of {capacity.toLocaleString()} capacity</span>
        </div>
      </div>
    </div>
  );
}
