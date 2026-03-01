"use client";

import type { Facility } from "@/lib/types";

interface HospitalSelectorProps {
  facilities: Facility[];
  selectedId: string | null;
  onSelect: (facilityId: string) => void;
}

export function HospitalSelector({
  facilities,
  selectedId,
  onSelect,
}: HospitalSelectorProps) {
  return (
    <div className="panel h-full">
      <div className="panel-header flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-signal-blue" />
        Facility
      </div>
      <div className="p-3">
        <select
          value={selectedId ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          className="data-value w-full rounded border border-bunker-600 bg-bunker-800 px-3 py-2.5 text-sm text-gray-100 outline-none transition focus:border-signal-blue focus:ring-1 focus:ring-signal-blue/50"
        >
          <option value="">System-wide (all facilities)</option>
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.beds} beds)
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-600">
          {facilities.length} facilities connected
        </p>
      </div>
    </div>
  );
}
