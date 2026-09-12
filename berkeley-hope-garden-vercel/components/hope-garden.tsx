"use client";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { GardenInformation } from "@/components/garden-information";
import { LuminousFlower } from "@/components/luminous-flower";
import { useGardenAudio } from "@/lib/use-garden-audio";
import { createFlowerIdentity } from "@/lib/flower-identity";
import type { Garden } from "@/lib/garden-types";
type Phase =
  | "idle"
  | "generating"
  | "landing"
  | "shoot"
  | "stem"
  | "leaves"
  | "bud"
  | "bloom"
  | "solo"
  | "reveal";
const positions = [
  [-31, 6, 0.64],
  [28, 10, 0.74],
  [-14, 16, 0.48],
  [42, 21, 0.42],
  [-43, 23, 0.38],
  [14, 24, 0.37],
  [-24, 32, 0.29],
  [34, 34, 0.26],
  [-6, 29, 0.32],
  [46, 37, 0.24],
  [-45, 38, 0.23],
  [22, 42, 0.2],
];
export function HopeGarden() {
  const [garden, setGarden] = useState<Garden | null>(null),
    [phase, setPhase] = useState<Phase>("idle"),
    [identity, setIdentity] = useState(0),
    [selected, setSelected] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [shareNote, setShareNote] = useState(""),
    [open, setOpen] = useState(false),
    [reduced, setReduced] = useState(false);
  const audio = useGardenAudio();
  const began = useRef(false),
    active = useRef(false),
    alive = useRef(true),
    eventId = useRef(""),
    ready = useRef<Promise<Garden> | null>(null),
    info = useRef<HTMLElement>(null),
    seed = useRef<HTMLButtonElement>(null);
  const source = () =>
    new URLSearchParams(location.search).get("from") || "direct";
  const track = useCallback(
    async (kind: string, flower?: number, id?: string) => {
      const r = await fetch("/api/garden", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          flower,
          eventId: id || crypto.randomUUID(),
          source: source(),
        }),
        keepalive: true,
      });
      if (!r.ok)
        throw new Error("Please try again. Your action hasn’t been saved.");
    },
    [],
  );
  const refresh = useCallback(async () => {
    const r = await fetch("/api/garden", { cache: "no-store" });
    if (!r.ok) throw new Error("The garden couldn’t load. Please try again.");
    const g = (await r.json()) as Garden;
    if (alive.current) setGarden(g);
    return g;
  }, []);
  useEffect(() => {
    alive.current = true;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(mq.matches);
    change();
    mq.addEventListener("change", change);
    if (!began.current) {
      began.current = true;
      ready.current = refresh();
      ready.current
        .then((g) => {
          if (g.mine !== null) setIdentity(g.mine);
          return track("visit");
        })
        .catch((e) => setError(e.message));
    }
    const poll = setInterval(() => {
      if (document.visibilityState === "visible" && !active.current)
        refresh().catch(() => {});
    }, 30000);
    return () => {
      alive.current = false;
      mq.removeEventListener("change", change);
      clearInterval(poll);
    };
  }, [refresh, track]);
  useEffect(() => {
    if (["#event", "#information"].includes(location.hash)) setOpen(true);
  }, []);
  useEffect(() => {
    if (!open) return;
    if (["#event", "#information"].includes(location.hash))
      requestAnimationFrame(() =>
        document
          .querySelector(location.hash)
          ?.scrollIntoView({ behavior: "instant" }),
      );
    const elements = info.current?.querySelectorAll(
      ".masthead,.plant-panel,.garden-panel,.event-section,.learn,footer",
    );
    if (!elements) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.08 },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [open]);
  async function pause(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return alive.current;
  }
  async function enter(preset?: number) {
    if (active.current || phase !== "idle") return;
    audio.start();
    active.current = true;
    setBusy(true);
    setError("");
    setPhase("generating");
    const newIdentity =
      garden?.mine ??
      (preset === undefined
        ? createFlowerIdentity()
        : createFlowerIdentity() ^ ((preset + 1) * 1000003));
    setIdentity(newIdentity);
    const minimal = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    try {
      // Animation and asset preparation overlap; the planting is recorded before growth.
      await Promise.all([
        pause(minimal ? 0 : 2100),
        ...[
          "/luminous-seed.webp",
          "/luminous-stem.webp",
          "/leaflet-bloom.webp",
        ].map(
          (src) =>
            new Promise<void>((resolve, reject) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () =>
                reject(
                  new Error("The garden couldn’t load. Please try again."),
                );
              img.src = src;
            }),
        ),
      ]);
      const g = await (ready.current ?? refresh()).catch(() => refresh());
      if (!alive.current) return;
      await track("visit");
      if (g.mine !== null) setIdentity(g.mine);
      else {
        eventId.current ||= crypto.randomUUID();
        await track("plant", newIdentity, eventId.current);
        await refresh();
      }
      if (minimal) {
        audio.chime("plant");
        setPhase("reveal");
        setOpen(true);
        return;
      }
      const steps: [Phase, number][] = [
        ["landing", 650],
        ["shoot", 550],
        ["stem", 850],
        ["leaves", 650],
        ["bud", 550],
        ["bloom", 1400],
        ["solo", 1100],
      ];
      for (const [next, duration] of steps) {
        if (!alive.current) return;
        setPhase(next);
        if (next === "shoot") audio.chime("plant");
        if (next === "bloom") audio.chime("bloom");
        if (!(await pause(duration))) return;
      }
      setPhase("reveal");
      setOpen(true);
    } catch (e) {
      if (alive.current) {
        setError((e as Error).message);
        setPhase("idle");
      }
    } finally {
      active.current = false;
      if (alive.current) setBusy(false);
    }
  }
  function skip() {
    setOpen(true);
    requestAnimationFrame(() => {
      info.current?.scrollIntoView({ behavior: "instant" });
      info.current?.focus({ preventScroll: true });
    });
  }
  function alternativePlant() {
    window.scrollTo({ top: 0, behavior: "instant" });
    void enter(selected);
  }
  async function share() {
    const url = location.origin + "/?from=social";
    try {
      if (navigator.share)
        await navigator.share({
          title: "Your flower is missing",
          text: "Plant a flower in the Berkeley Hope Garden. Meet us at the NMDP event on Sept. 21!",
          url,
        });
      else {
        await navigator.clipboard.writeText(url);
        setShareNote("Link copied. Send a little hope.");
      }
    } catch (e) {
      if ((e as Error).name !== "AbortError")
        setShareNote("Share this link: " + url);
    }
  }
  function reload() {
    setError("");
    ready.current = refresh();
    ready.current.then(() => track("visit")).catch((e) => setError(e.message));
  }
  const companions = (garden?.flowers ?? []).filter(
    (f, i, all) =>
      !(
        f.flower === garden?.mine &&
        i === all.findIndex((p) => p.flower === garden?.mine)
      ),
  );
  const phaseNumber = [
    "idle",
    "generating",
    "landing",
    "shoot",
    "stem",
    "leaves",
    "bud",
    "bloom",
    "solo",
    "reveal",
  ].indexOf(phase);
  return (
    <main
      className={`immersive-app ${open ? "is-open" : ""} ${reduced ? "reduced-motion" : ""}`}
    >
      <section
        className="installation"
        data-phase={phase}
        aria-label="Hope Garden interactive experience"
      >
        <div className="night-veil" aria-hidden="true" />
        <div className="ambient-light" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className="ground-plane" aria-hidden="true" />
        <div className="light-path" aria-hidden="true" />
        <button
          className="sound-toggle"
          onClick={audio.toggle}
          aria-pressed={audio.enabled}
          aria-label={
            audio.enabled ? "Mute garden sounds" : "Enable garden sounds"
          }
        >
          <span aria-hidden="true">{audio.enabled ? "♫" : "♪"}</span> Sound{" "}
          {audio.enabled ? "on" : "off"}
        </button>
        <button className="skip-interaction" onClick={skip}>
          Skip to information <span aria-hidden="true">↘</span>
        </button>
        <div className="installation-title" aria-hidden={phase !== "reveal"}>
          <span>BERKELEY</span>
          <h1>
            HOPE
            <br />
            GARDEN
          </h1>
          <p>NMDP BLOOD CANCER AWARENESS</p>
        </div>
        <div className="collective-scene" aria-hidden="true">
          {companions.slice(0, 12).map((f, i) => {
            const [x, y, scale] = positions[i];
            return (
              <div
                key={i}
                className="distant-flower"
                style={
                  {
                    "--x": `${x}vw`,
                    "--depth": `${y}vh`,
                    "--size": scale,
                    "--delay": `${i * 0.11}s`,
                  } as CSSProperties
                }
              >
                <LuminousFlower identity={f.flower} />
              </div>
            );
          })}
        </div>
        <div className="planting-location">
          <div className="ground-ripple" aria-hidden="true" />
          <div className="landing-light" aria-hidden="true" />
          <div className="personal-flower" aria-hidden="true">
            <LuminousFlower identity={identity} />
          </div>
          <button
            ref={seed}
            className="seed-control"
            aria-label="Plant my flower"
            aria-disabled={busy || phase !== "idle"}
            tabIndex={phase === "idle" ? 0 : -1}
            onClick={() => void enter()}
          >
            <span className="seed-orbit" />
            <img
              src="/luminous-seed.webp"
              width="160"
              height="160"
              alt=""
              draggable="false"
            />
            <span className="seed-shadow" />
          </button>
          <div className="light-motes" aria-hidden="true">
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} style={{ "--i": i } as CSSProperties} />
            ))}
          </div>
        </div>
        <div className="interaction-status" role="status" aria-live="polite">
          {phase === "generating"
            ? "Generating a flower unique to you…"
            : phaseNumber >= 2 && phaseNumber <= 7
              ? "Planting your flower…"
              : phase === "solo"
                ? "One small flower. A little more hope. Thanks for growing this garden with us."
                : phase === "idle"
                  ? "Plant my flower"
                  : ""}
        </div>
        {error && (
          <div className="installation-error" role="alert">
            {error}
            <button onClick={reload}>Reload garden</button>
          </div>
        )}
        <div className="garden-reveal-actions" aria-hidden={phase !== "reveal"}>
          <p className="reveal-count">
            <strong>
              {garden?.counts
                .find((c) => c.kind === "plant")
                ?.total.toLocaleString() ?? "—"}
            </strong>{" "}
            flowers planted
          </p>
          <button
            className="invite-friends"
            onClick={share}
            tabIndex={phase === "reveal" ? 0 : -1}
          >
            Invite a friend <span aria-hidden="true">↗</span>
          </button>
          {shareNote && (
            <p className="share-note" role="status">
              {shareNote}
            </p>
          )}
        </div>
        <a
          className="continue-garden"
          href="#information"
          aria-hidden={!open}
          tabIndex={open ? 0 : -1}
          onClick={() => setOpen(true)}
        >
          <span>Now, let’s meet on Bancroft.</span>
          <span aria-hidden="true">↓</span>
        </a>
      </section>
      <section
        ref={info}
        id="information"
        tabIndex={-1}
        className="information"
        aria-label="NMDP event and garden information"
      >
        <GardenInformation
          garden={garden}
          selected={selected}
          setSelected={setSelected}
          busy={busy}
          error={error}
          shareNote={shareNote}
          plant={alternativePlant}
          share={share}
          reload={reload}
          track={track}
        />
      </section>
      <noscript>
        <style>
          {
            ".information{display:block!important}.installation{display:none!important}.information-inner section,.information-inner footer,.masthead{opacity:1!important;transform:none!important}"
          }
        </style>
      </noscript>
    </main>
  );
}
