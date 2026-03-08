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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setCues([]);
      setError(null);
      return;
    }

    console.log(`[Subtitle] Fetching: ${url}`);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then(text => {
        const parsed: SubtitleCue[] = [];
        const lines = text.split(/\r?\n/);
        console.log(`[Subtitle] Loaded ${lines.length} lines`);

        let i = 0;
        while (i < lines.length) {
          const line = lines[i].trim();

          // Skip header, index numbers, or empty lines
          if (!line || line === "WEBVTT" || /^\d+$/.test(line)) {
            i++;
            continue;
          }

          // Check for timestamp line (e.g., 00:00:12,734 --> 00:00:13,986)
          if (line.includes("-->")) {
            const parts = line.split("-->");
            if (parts.length < 2) {
              i++;
              continue;
            }

            const startStr = parts[0].trim();
            const endStr = parts[1].trim().split(/\s+/)[0]; // Take first part (ignore alignment settings)

            const start = parseVttTime(startStr);
            const end = parseVttTime(endStr);

            // Get text lines until next cue or empty line
            let cueText = "";
            i++;
            while (i < lines.length) {
              const nextLine = lines[i].trim();
              if (nextLine === "" || nextLine.includes("-->") || /^\d+$/.test(nextLine)) {
                break;
              }
              cueText += (cueText ? "\n" : "") + nextLine;
              i++;
            }

            if (cueText) {
              parsed.push({ start, end, text: cueText });
            }
          } else {
            i++;
          }
        }
        console.log(`[Subtitle] Parsed ${parsed.length} cues`);
        setCues(parsed);
        setError(null);
      })
      .catch(err => {
        console.error("[Subtitle] Error:", err.message);
        setError(err.message);
      });
  }, [url]);

  const activeCue = useMemo(() => {
    if (cues.length === 0) return null;
    const found = cues.find(cue => currentTime >= cue.start && currentTime <= cue.end);
    return found;
  }, [cues, currentTime]);

  if (!activeCue) {
    if (error) {
      // Don't show technical error UI, but it's logged to console
      return null;
    }
    return null;
  }

  return (
    <div className="absolute bottom-[25%] left-0 right-0 px-4 text-center pointer-events-none z-30 select-none">
      <div className="flex justify-center">
        <span
          className="bg-black/70 text-white text-base md:text-xl font-medium px-4 py-2 rounded-lg backdrop-blur-sm border border-white/10"
          style={{ textShadow: "0 1px 3px rgba(0,0,0,1)" }}
        >
          {activeCue.text.split('\n').map((line, idx) => (
            <span key={idx} className="block leading-relaxed">{line}</span>
          ))}
        </span>
      </div>
    </div>
  );
}
