"use client";

import { useState, useRef } from "react";
import { ContractConfig } from "@/lib/types";
import { useContractGenerator } from "@/hooks/useContractGenerator";
import { DownloadCard } from "./DownloadCard";

export function ContractForm() {
  const [dealPoints, setDealPoints] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedConfig, setParsedConfig] = useState<ContractConfig | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { templatesLoaded, isGenerating, results, error, generate, download } =
    useContractGenerator();

  const handleGenerate = async () => {
    if (!dealPoints.trim()) return;

    setIsParsing(true);
    setParseError(null);
    setParsedConfig(null);

    try {
      const formData = new FormData();
      formData.append("dealPoints", dealPoints);
      for (const file of files) {
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
      setParsedConfig(config);
      await generate(config);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setIsParsing(false);
    }
  };

  const busy = isParsing || isGenerating;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Kara</h1>
        <p className="text-sm text-zinc-500">
          Paste the deal points below. The deal memo and contract will be generated automatically.
        </p>
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
          <span className="font-normal text-zinc-400">(optional — traveler info, deal memos, etc.)</span>
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
              <li key={`${file.name}-${i}`} className="flex items-center gap-2 text-sm text-zinc-600">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  className="text-zinc-400 hover:text-zinc-600 text-xs"
                >
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-zinc-400 mt-1">
          Details like passport, DOB, address, etc. will be extracted automatically from any uploaded PDFs.
        </p>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerate}
        disabled={busy || !templatesLoaded || !dealPoints.trim()}
        className="w-full py-3 text-sm font-medium bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 disabled:bg-zinc-300 disabled:cursor-not-allowed transition-colors"
      >
        {!templatesLoaded
          ? "Loading templates..."
          : isParsing
          ? "Parsing deal points..."
          : isGenerating
          ? "Generating documents..."
          : "Generate Documents"}
      </button>

      {/* Errors */}
      {(parseError || error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {parseError || error}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">
            Documents for {parsedConfig?.performer.name}
          </h2>
          {results.dealMemo && (
            <DownloadCard
              label="Deal Memo"
              filename={results.dealMemo.filename}
              onDownload={() =>
                download(results.dealMemo!.blob, results.dealMemo!.filename)
              }
            />
          )}
          {results.contract && (
            <DownloadCard
              label="UBCP Contract"
              filename={results.contract.filename}
              onDownload={() =>
                download(results.contract!.blob, results.contract!.filename)
              }
            />
          )}
        </div>
      )}
    </div>
  );
}
