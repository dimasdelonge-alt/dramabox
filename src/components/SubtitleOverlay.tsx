"use client";

import { useState, useEffect, useMemo } from "react";

interface SubtitleOverlayProps {
  url: string;
  currentTime: number;
}

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

// Convert VTT/SRT time string to seconds
// Formats: "00:00:01.000", "00:00:01,000", "01:02.000", etc.
function parseVttTime(timeStr: string): number {
  if (!timeStr) return 0;

  // Normalize: replace comma with dot, then split by colon or dot
  const cleanStr = timeStr.trim().replace(',', '.');
  const parts = cleanStr.split(/[:.]/);

  if (parts.length === 4) {
    // HH:MM:SS.ms
    return parseInt(parts[0]) * 3600 +
      parseInt(parts[1]) * 60 +
      parseInt(parts[2]) +
      parseInt(parts[3]) / 1000;
  } else if (parts.length === 3) {
    // MM:SS.ms
    return parseInt(parts[0]) * 60 +
      parseInt(parts[1]) +
      parseInt(parts[2]) / 1000;
  } else if (parts.length === 2) {
    // SS.ms
    return parseInt(parts[0]) +
      parseInt(parts[1]) / 1000;
  }

  return 0;
}

export default function SubtitleOverlay({ url, currentTime }: SubtitleOverlayProps) {
  const [cues, setCues] = useState<SubtitleCue[]>([]);

  useEffect(() => {
    if (!url) {
      setCues([]);
      return;
    }

    fetch(url)
      .then(res => res.text())
      .then(text => {
        const parsed: SubtitleCue[] = [];
        const lines = text.split(/\r?\n/);

        let i = 0;
        while (i < lines.length) {
          const line = lines[i].trim();

          // Skip header/empty
          if (!line || line === "WEBVTT") {
            i++;
            continue;
          }

          // Check for timestamp line
          if (line.includes("-->")) {
            const [startStr, endStr] = line.split("-->").map(s => s.trim());
            const start = parseVttTime(startStr);
            // Remove visual settings if any (e.g., align:start line:0%)
            const end = parseVttTime(endStr.split(' ')[0]);

            // Get text lines until empty line
            let text = "";
            i++;
            while (i < lines.length && lines[i].trim() !== "") {
              text += (text ? "\n" : "") + lines[i].trim();
              i++;
            }

            parsed.push({ start, end, text });
          } else {
            i++;
          }
        }
        setCues(parsed);
      })
      .catch(console.error);
  }, [url]);

  const activeCue = useMemo(() => {
    return cues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
  }, [cues, currentTime]);

  if (!activeCue) return null;

  return (
    <div className="absolute bottom-[25%] left-0 right-0 px-4 text-center pointer-events-none z-30">
      <span
        className="inline-block bg-black/50 text-white text-base md:text-xl font-medium px-4 py-2 rounded-lg backdrop-blur-sm"
        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
      >
        {activeCue.text.split('\n').map((line, idx) => (
          <span key={idx} className="block">{line}</span>
        ))}
      </span>
    </div>
  );
}
