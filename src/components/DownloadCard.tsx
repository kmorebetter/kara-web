"use client";

interface DownloadCardProps {
  label: string;
  filename: string;
  onDownload: () => void;
}

export function DownloadCard({ label, filename, onDownload }: DownloadCardProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-zinc-200 rounded-lg bg-zinc-50">
      <div>
        <p className="text-sm font-medium text-zinc-900">{label}</p>
        <p className="text-xs text-zinc-500 font-mono">{filename}</p>
      </div>
      <button
        onClick={onDownload}
        className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
      >
        Download
      </button>
    </div>
  );
}
