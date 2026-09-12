"use client";
import { useEffect, useRef, useState } from "react";
import { createGardenSoundscape } from "./garden-soundscape";

// Quiet synthesized soundscape: no downloads, microphone, or audio tracking.
export function useGardenAudio() {
  const [enabled, setEnabled] = useState(true);
  const dispose = useRef<(() => void) | null>(null);
  const enabledRef = useRef(true),
    ctx = useRef<AudioContext | null>(null),
    master = useRef<GainNode | null>(null);
  useEffect(() => {
    try {
      enabledRef.current = localStorage.getItem("hope-garden-sound") !== "off";
      setEnabled(enabledRef.current);
    } catch {}
    const visibility = () => {
      const a = ctx.current;
      if (!a) return;
      if (document.hidden) void a.suspend().catch(() => {});
      else if (enabledRef.current) void a.resume().catch(() => {});
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      dispose.current?.();
      dispose.current = null;
      void ctx.current?.close();
      ctx.current = null;
    };
  }, []);
  function start() {
    if (!enabledRef.current) return;
    try {
      if (!ctx.current) {
        const a = new AudioContext();
        ctx.current = a;
        const gain = a.createGain();
        gain.gain.value = 0;
        gain.connect(a.destination);
        master.current = gain;
        dispose.current = createGardenSoundscape(a, gain);
        gain.gain.linearRampToValueAtTime(0.26, a.currentTime + 3);
      }
      void ctx.current.resume().catch(() => {});
    } catch {
      /* Audio is an enhancement; planting remains available. */
    }
  }
  function chime(kind: "plant" | "bloom") {
    if (!enabledRef.current || !ctx.current || !master.current) return;
    const a = ctx.current,
      notes = kind === "plant" ? [261.63, 392] : [523.25, 659.25, 783.99];
    notes.forEach((frequency, i) => {
      const osc = a.createOscillator(),
        gain = a.createGain(),
        t = a.currentTime + i * 0.18;
      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, t);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(
        kind === "plant" ? 0.17 : 0.1,
        t + 0.04,
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);
      osc.connect(gain);
      gain.connect(master.current!);
      osc.start(t);
      osc.stop(t + 3);
      osc.onended = () => {
        osc.disconnect();
        gain.disconnect();
      };
    });
  }
  function toggle() {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    try {
      localStorage.setItem("hope-garden-sound", next ? "on" : "off");
    } catch {}
    if (next) start();
    else if (ctx.current && master.current) {
      const a = ctx.current;
      master.current.gain.cancelScheduledValues(a.currentTime);
      master.current.gain.setTargetAtTime(0, a.currentTime, 0.06);
      setTimeout(() => {
        if (!enabledRef.current) void a.suspend().catch(() => {});
      }, 250);
    }
    if (next && ctx.current && master.current)
      master.current.gain.setTargetAtTime(0.26, ctx.current.currentTime, 0.3);
  }
  return { enabled, start, chime, toggle };
}
