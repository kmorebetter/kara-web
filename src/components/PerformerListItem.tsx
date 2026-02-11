"use client";

import { PerformerEntry } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Check, X, AlertCircle } from "lucide-react";

interface PerformerListItemProps {
  entry: PerformerEntry;
  onRemove: (id: string) => void;
}

export function PerformerListItem({ entry, onRemove }: PerformerListItemProps) {
  if (entry.status === "error") {
    return (
      <li className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
        <div className="flex items-center gap-3 min-w-0">
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-destructive truncate">
              Failed to process
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {entry.error}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onRemove(entry.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </li>
    );
  }

  if (entry.status === "parsing" || entry.status === "generating") {
    return (
      <li className="flex items-center gap-3 rounded-lg border px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
        <p className="text-sm text-muted-foreground truncate">
          {entry.status === "parsing"
            ? "Parsing deal points..."
            : "Generating documents..."}
        </p>
      </li>
    );
  }

  // status === "ready"
  const name = entry.config?.performer.name ?? "Unknown";
  const role = entry.config?.deal.role ?? "";

  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
        <span className="text-sm font-medium truncate">{name}</span>
        {role && (
          <Badge variant="secondary" className="shrink-0 font-normal">
            {role}
          </Badge>
        )}
      </div>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => onRemove(entry.id)}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </li>
  );
}
