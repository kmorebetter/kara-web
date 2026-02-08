"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { saveAs } from "file-saver";
import { ContractConfig } from "@/lib/types";
import { generateDealMemo } from "@/lib/generate-deal-memo";
import { generateContract } from "@/lib/generate-contract";

interface GeneratedFiles {
  dealMemo: { blob: Blob; filename: string } | null;
  contract: { blob: Blob; filename: string } | null;
}

export function useContractGenerator() {
  const dmTemplate = useRef<ArrayBuffer | null>(null);
  const contractTemplate = useRef<ArrayBuffer | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<GeneratedFiles | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/templates/deal_memo_template.xlsx").then((r) => r.arrayBuffer()),
      fetch("/templates/contract_template.docx").then((r) => r.arrayBuffer()),
    ])
      .then(([dm, c]) => {
        dmTemplate.current = dm;
        contractTemplate.current = c;
        setTemplatesLoaded(true);
      })
      .catch(() => setError("Failed to load document templates."));
  }, []);

  const generate = useCallback(async (config: ContractConfig) => {
    if (!dmTemplate.current || !contractTemplate.current) {
      setError("Templates not loaded yet.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResults(null);

    try {
      const performerName = config.performer.name.replace(/ /g, "_");

      const [dmBlob, cBlob] = await Promise.all([
        generateDealMemo(dmTemplate.current, config),
        generateContract(contractTemplate.current, config),
      ]);

      setResults({
        dealMemo: { blob: dmBlob, filename: `${performerName}_DM.xlsx` },
        contract: { blob: cBlob, filename: `${performerName}_C.docx` },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const download = useCallback((blob: Blob, filename: string) => {
    saveAs(blob, filename);
  }, []);

  return { templatesLoaded, isGenerating, results, error, generate, download };
}
