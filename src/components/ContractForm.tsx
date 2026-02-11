"use client";

import { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ContractConfig, PerformerEntry } from "@/lib/types";
import { useContractGenerator } from "@/hooks/useContractGenerator";
import { PerformerListItem } from "./PerformerListItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Loader2,
  Download,
  Plus,
  FileText,
  X,
} from "lucide-react";

export function ContractForm() {
  const [dealPoints, setDealPoints] = useState("");
  const [productionTitle, setProductionTitle] = useState("EFFIGY");
  const [files, setFiles] = useState<File[]>([]);
  const [performers, setPerformers] = useState<PerformerEntry[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { templatesLoaded, templateError, generate } = useContractGenerator();

  const updateEntry = useCallback(
    (id: string, updates: Partial<PerformerEntry>) => {
      setPerformers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
    },
    []
  );

  const handleAddPerformer = async () => {
    if (!dealPoints.trim()) return;

    const entryId = Date.now().toString();
    const currentDealPoints = dealPoints;
    const currentFiles = files;
    const currentTitle = productionTitle;

    setPerformers((prev) => [
      ...prev,
      {
        id: entryId,
        config: null,
        files: null,
        status: "parsing",
        error: null,
      },
    ]);
    setDealPoints("");
    setFiles([]);
    setIsAdding(true);

    try {
      const formData = new FormData();
      formData.append("dealPoints", currentDealPoints);
      for (const file of currentFiles) {
        formData.append("files", file);
      }

      const res = await fetch("/api/parse", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Parse failed (${res.status})`);
      }

      const config: ContractConfig = await res.json();
      config.production_title =
        currentTitle || config.production_title || "EFFIGY";

      updateEntry(entryId, { config, status: "generating" });

      const generatedFiles = await generate(config);

      updateEntry(entryId, { files: generatedFiles, status: "ready" });
    } catch (e) {
      updateEntry(entryId, {
        status: "error",
        error: e instanceof Error ? e.message : "Something went wrong.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = useCallback((id: string) => {
    setPerformers((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const readyPerformers = performers.filter((p) => p.status === "ready");

  const handleDownloadAll = async () => {
    if (readyPerformers.length === 0) return;

    const zip = new JSZip();

    for (const performer of readyPerformers) {
      if (performer.files) {
        zip.file(
          performer.files.dealMemo.filename,
          performer.files.dealMemo.blob
        );
        zip.file(
          performer.files.contract.filename,
          performer.files.contract.blob
        );
      }
    }

    const title = productionTitle.replace(/[^a-zA-Z0-9]/g, "_");
    const date = new Date().toISOString().split("T")[0];
    const blob = await zip.generateAsync({ type: "blob" });
    saveAs(blob, `${title}_Contracts_${date}.zip`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Kara</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Set the production, add performers one at a time, then download
          everything as a ZIP.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Performer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Production Title */}
          <div className="space-y-2">
            <Label htmlFor="production-title">Production Title</Label>
            <Input
              id="production-title"
              value={productionTitle}
              onChange={(e) => setProductionTitle(e.target.value)}
              placeholder="e.g. EFFIGY"
              className="font-mono uppercase"
            />
          </div>

          <Separator />

          {/* Deal Points */}
          <div className="space-y-2">
            <Label htmlFor="deal-points">Deal Points</Label>
            <Textarea
              id="deal-points"
              value={dealPoints}
              onChange={(e) => setDealPoints(e.target.value)}
              placeholder={`Paste deal points here, e.g.:\n\nPerformer: Jane Smith\nRole: DETECTIVE WELLS\nRate: $2,500 CAD/day\nDates: March 10 & 12, 2026\nTravel: Economy Return YYZ/YVR/YYZ\n...`}
              rows={10}
              className="font-mono text-sm resize-vertical"
            />
          </div>

          {/* File Uploads */}
          <div className="space-y-2">
            <Label>
              Supporting Documents{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                Upload PDFs
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  if (newFiles.length)
                    setFiles((prev) => [...prev, ...newFiles]);
                  e.target.value = "";
                }}
              />
            </div>
            {files.length > 0 && (
              <ul className="space-y-1.5">
                {files.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() =>
                        setFiles((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              Passport, DOB, address, etc. will be extracted automatically.
            </p>
          </div>

          {/* Add Performer Button */}
          <Button
            onClick={handleAddPerformer}
            disabled={isAdding || !templatesLoaded || !dealPoints.trim()}
            className="w-full"
            size="lg"
          >
            {!templatesLoaded ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading templates...
              </>
            ) : isAdding ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Adding performer...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Add Performer
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Template Error */}
      {templateError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {templateError}
        </div>
      )}

      {/* Performer List */}
      {performers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Performers{" "}
              <span className="text-muted-foreground font-normal">
                ({readyPerformers.length}
                {readyPerformers.length !== performers.length &&
                  ` of ${performers.length}`}
                )
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-80">
              <ul className="space-y-2">
                {performers.map((entry) => (
                  <PerformerListItem
                    key={entry.id}
                    entry={entry}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Download All */}
      {readyPerformers.length > 0 && (
        <Button
          onClick={handleDownloadAll}
          size="lg"
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          <Download className="h-4 w-4" />
          Download All ({readyPerformers.length} performer
          {readyPerformers.length !== 1 ? "s" : ""})
        </Button>
      )}
    </div>
  );
}
