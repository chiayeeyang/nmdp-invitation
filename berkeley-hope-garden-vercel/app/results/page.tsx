"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
type Row = { day: string; source: string; kind: string; total: number };
export default function Results() {
  const [rows, setRows] = useState<Row[]>([]),
    [error, setError] = useState(""),
    [loaded, setLoaded] = useState(false);
  async function load() {
    setError("");
    try {
      const r = await fetch("/api/results", { cache: "no-store" });
      if (!r.ok) throw Error();
      setRows(((await r.json()) as { rows: Row[] }).rows);
      setLoaded(true);
    } catch {
      setError("Results are unavailable. Please try again.");
    }
  }
  useEffect(() => {
    load();
  }, []);
  function download() {
    const csv =
      "Date (UTC),Source,Interaction,Count\r\n" +
      rows
        .map((r) => [r.day, r.source, r.kind, r.total].join(","))
        .join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "berkeley-garden-activity.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <main className="results-page">
      <a className="back-link" href="/">
        ← Back to the garden
      </a>
      <p className="eyebrow">BERKELEY HOPE GARDEN / ACTIVITY</p>
      <h1>
        Little actions.
        <br />
        Real numbers.
      </h1>
      <p>
        Anonymous interaction totals for this student invitation. No names or
        donor information are collected here.
      </p>
      <div className="metric-grid">
        {[
          ["visit", "Garden visits"],
          ["plant", "Flowers planted"],
          ["calendar", "Calendar clicks"],
          ["nmdp", "NMDP link clicks"],
        ].map(([key, label]) => (
          <div className="metric" key={key}>
            <strong>
              {loaded
                ? rows
                    .filter((r) => r.kind === key)
                    .reduce((s, r) => s + r.total, 0)
                    .toLocaleString()
                : "—"}
            </strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <div className="result-actions">
        <Button className="primary" onClick={download} disabled={!loaded}>
          Download CSV
        </Button>
        <Button variant="outline" onClick={load}>
          Refresh totals
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date (UTC)</th>
              <th>Source</th>
              <th>Interaction</th>
              <th>Count</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.day}</td>
                <td>{r.source}</td>
                <td>{r.kind}</td>
                <td>{r.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loaded && !rows.length && (
          <p>No activity yet. Your first visitor starts the story.</p>
        )}
      </div>
      <p className="results-note">
        Visits and flowers are limited to one per browser session; clearing
        cookies or using another browser can count again. Calendar and NMDP
        clicks count actions and may repeat. Automated traffic can also affect
        totals. These are not verified unique people, completed calendar saves,
        event attendance, or registry registrations. Visiting this results page
        does not add a garden visit.
      </p>
    </main>
  );
}
