"use client";

import { ArrowDownAZ, ArrowUpDown, Clock3 } from "lucide-react";
import type { FilterOption, SortKey } from "@/constants";

interface Props {
  categories: FilterOption[];
  /** The server value of the active chip; "" means no category filter. */
  active: string;
  onChange: (value: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
}

const SORTS: { key: SortKey; label: string; icon: React.ReactNode }[] = [
  {
    key: "recommended",
    label: "Recommended",
    icon: <ArrowUpDown className="h-3.5 w-3.5" />,
  },
  { key: "newest", label: "Newest", icon: <Clock3 className="h-3.5 w-3.5" /> },
  { key: "az", label: "A – Z", icon: <ArrowDownAZ className="h-3.5 w-3.5" /> },
];

export default function CategoryChips({
  categories,
  active,
  onChange,
  sort,
  onSort,
}: Props) {
  return (
    <div className="mt-8">
      <div className="chip-rail overflow-x-auto px-4 py-1 sm:px-6">
        <div className="mx-auto flex w-max gap-2">
          {categories.map((c) => (
            <button
              key={c.value || "all"}
              onClick={() => onChange(c.value)}
              className={`chip shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${
                active === c.value
                  ? "chip-active border-transparent bg-[#6932E2] text-white"
                  : "border-background-light bg-white/70 text-[#6F6D6D] hover:border-primary-light hover:text-[#0F0F0F]"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {SORTS.map((s) => (
          <button
            key={s.key}
            onClick={() => onSort(s.key)}
            className={`chip flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
              sort === s.key
                ? "bg-primary-accent text-[#6932E2]"
                : "text-[#6F6D6D] hover:text-[#0F0F0F]"
            }`}
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
