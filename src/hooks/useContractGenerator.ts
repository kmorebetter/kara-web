"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ContractConfig, GeneratedFiles } from "@/lib/types";
import { generateDealMemo } from "@/lib/generate-deal-memo";
import { generateContract } from "@/lib/generate-contract";

export function useContractGenerator() {
  const dmTemplate = useRef<ArrayBuffer | null>(null);
  const contractTemplate = useRef<ArrayBuffer | null>(null);
  const [templatesLoaded, setTemplatesLoaded] = useState(false);
  const [templateError, setTemplateError] = useState<string | null>(null);

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
      .catch(() => setTemplateError("Failed to load document templates."));
  }, []);

  const generate = useCallback(
    async (config: ContractConfig): Promise<GeneratedFiles> => {
      if (!dmTemplate.current || !contractTemplate.current) {
        throw new Error("Templates not loaded yet.");
      }

      const performerName = config.performer.name.replace(/ /g, "_");

      const [dmBlob, cBlob] = await Promise.all([
        generateDealMemo(dmTemplate.current, config),
        generateContract(contractTemplate.current, config),
      ]);

      return {
        dealMemo: { blob: dmBlob, filename: `${performerName}_DM.xlsx` },
        contract: { blob: cBlob, filename: `${performerName}_C.docx` },
      };
    },
    []
  );

  return { templatesLoaded, templateError, generate };
}
