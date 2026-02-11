"use client";

import { PerformerEntry } from "@/lib/types";

interface PerformerListItemProps {
  entry: PerformerEntry;
  onRemove: (id: string) => void;
}

export function PerformerListItem({ entry, onRemove }: PerformerListItemProps) {
  if (entry.status === "error") {
    return (
      <li className="flex items-center justify-between px-4 py-3 border border-red-200 rounded-lg bg-red-50">
        <div className="min-w-0">
          <p className="text-sm text-red-700 truncate">
            Failed to process performer
          </p>
          <p className="text-xs text-red-500 truncate">{entry.error}</p>
        </div>
        <button
          onClick={() => onRemove(entry.id)}
          className="ml-3 shrink-0 text-red-400 hover:text-red-600 text-xs"
        >
          remove
        </button>
      </li>
    );
  }

  if (entry.status === "parsing" || entry.status === "generating") {
    return (
      <li className="flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-lg bg-zinc-50">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            className="animate-spin h-4 w-4 text-zinc-400 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              className="opacity-25"
            />
            <path
              d="M4 12a8 8 0 018-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <p className="text-sm text-zinc-500 truncate">
            {entry.status === "parsing"
              ? "Parsing deal points..."
              : "Generating documents..."}
          </p>
        </div>
      </li>
    );
  }

  // status === "ready"
  const name = entry.config?.performer.name ?? "Unknown";
  const role = entry.config?.deal.role ?? "";

  return (
    <li className="flex items-center justify-between px-4 py-3 border border-zinc-200 rounded-lg bg-zinc-50">
      <div className="flex items-center gap-2 min-w-0">
        <svg
          className="h-4 w-4 text-emerald-500 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <p className="text-sm text-zinc-900 truncate">
          {name}
          {role && (
            <span className="text-zinc-400"> — {role}</span>
          )}
        </p>
      </div>
      <button
        onClick={() => onRemove(entry.id)}
        className="ml-3 shrink-0 text-zinc-400 hover:text-zinc-600 text-xs"
      >
        remove
      </button>
    </li>
  );
}
