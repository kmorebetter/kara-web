"use client";

import { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ContractConfig, PerformerEntry } from "@/lib/types";
import { useContractGenerator } from "@/hooks/useContractGenerator";
import { PerformerListItem } from "./PerformerListItem";

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

    // Add pending entry and clear input immediately
    setPerformers((prev) => [
      ...prev,
      { id: entryId, config: null, files: null, status: "parsing", error: null },
    ]);
    setDealPoints("");
    setFiles([]);
    setIsAdding(true);

    try {
      // 1. Parse
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
      config.production_title = currentTitle || config.production_title || "EFFIGY";

      updateEntry(entryId, { config, status: "generating" });

      // 2. Generate
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
        zip.file(performer.files.dealMemo.filename, performer.files.dealMemo.blob);
        zip.file(performer.files.contract.filename, performer.files.contract.blob);
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
        <h1 className="text-2xl font-bold text-zinc-900">Kara</h1>
        <p className="text-sm text-zinc-500">
          Set the production title, then add performers one at a time. Download
          all documents as a ZIP when you&apos;re done.
        </p>
      </div>

      {/* Production Title */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Production Title
        </label>
        <input
          type="text"
          value={productionTitle}
          onChange={(e) => setProductionTitle(e.target.value)}
          placeholder="e.g. EFFIGY"
          className="w-full px-4 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 font-mono uppercase"
        />
      </div>

      {/* Deal Points Input */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Deal Points
        </label>
        <textarea
          value={dealPoints}
          onChange={(e) => setDealPoints(e.target.value)}
          placeholder={`Paste deal points here, e.g.:\n\nPerformer: Jane Smith\nRole: DETECTIVE WELLS\nRate: $2,500 CAD/day\nDates: March 10 & 12, 2026\nTravel: Economy Return YYZ/YVR/YYZ\nHotel: Accommodations in Vancouver\nPer Diem: Per UBCP\nDressing: Private room\n...`}
          rows={12}
          className="w-full px-4 py-3 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-vertical font-mono"
        />
      </div>

      {/* File Uploads */}
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">
          Supporting Documents{" "}
          <span className="font-normal text-zinc-400">
            (optional — traveler info, deal memos, etc.)
          </span>
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 text-sm border border-zinc-300 rounded-lg text-zinc-600 hover:text-zinc-900 hover:border-zinc-400 transition-colors"
          >
            Upload PDFs
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple
            className="hidden"
            onChange={(e) => {
              const newFiles = Array.from(e.target.files || []);
              if (newFiles.length) setFiles((prev) => [...prev, ...newFiles]);
              e.target.value = "";
            }}
          />
        </div>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center gap-2 text-sm text-zinc-600"
              >
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setFiles((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="text-zinc-400 hover:text-zinc-600 text-xs"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-zinc-400 mt-1">
          Details like passport, DOB, address, etc. will be extracted
          automatically from any uploaded PDFs.
        </p>
      </div>

      {/* Add Performer Button */}
      <button
        onClick={handleAddPerformer}
        disabled={isAdding || !templatesLoaded || !dealPoints.trim()}
        className="w-full py-3 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
      >
        {!templatesLoaded
          ? "Loading templates..."
          : isAdding
          ? "Adding performer..."
          : "Add Performer"}
      </button>

      {/* Template Error */}
      {templateError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {templateError}
        </div>
      )}

      {/* Performer List */}
      {performers.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">
            Performers ({readyPerformers.length}
            {readyPerformers.length !== performers.length &&
              ` of ${performers.length}`}
            )
          </h2>
          <ul className="space-y-2 max-h-96 overflow-y-auto">
            {performers.map((entry) => (
              <PerformerListItem
                key={entry.id}
                entry={entry}
                onRemove={handleRemove}
              />
            ))}
          </ul>
        </div>
      )}

      {/* Download All */}
      {readyPerformers.length > 0 && (
        <button
          onClick={handleDownloadAll}
          className="w-full py-3 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Download All ({readyPerformers.length} performer
          {readyPerformers.length !== 1 ? "s" : ""})
        </button>
      )}
    </div>
  );
}
