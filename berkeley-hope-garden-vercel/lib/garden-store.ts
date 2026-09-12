import type { Interaction } from "./interactions";
import type { Garden } from "./garden-types";
export type Query = (
  statement: string,
  params?: unknown[],
) => Promise<Record<string, unknown>[]>;
export async function recordInteraction(
  query: Query,
  sid: string,
  p: Interaction,
) {
  const id =
    p.kind === "visit" || p.kind === "plant"
      ? `${p.kind}:${sid}`
      : `${p.kind}:${p.eventId}`;
  await query(
    "INSERT INTO interactions (id,kind,source,flower) VALUES ($1,$2,$3,$4) ON CONFLICT (id) DO NOTHING",
    [id, p.kind, p.source, p.flower ?? null],
  );
}
export async function readGarden(query: Query, sid: string): Promise<Garden> {
  const [counts, flowers, mine] = await Promise.all([
    query("SELECT kind,COUNT(*)::int AS total FROM interactions GROUP BY kind"),
    query(
      "SELECT flower FROM interactions WHERE kind='plant' ORDER BY created_at DESC,id DESC LIMIT 48",
    ),
    query("SELECT flower FROM interactions WHERE id=$1", ["plant:" + sid]),
  ]);
  return {
    counts: counts.map((r) => ({
      kind: String(r.kind),
      total: Number(r.total),
    })),
    flowers: flowers.map((r) => ({ flower: Number(r.flower) })),
    mine: mine.length ? Number(mine[0].flower) : null,
  };
}
export async function readResults(query: Query) {
  const rows = await query(
    "SELECT to_char(created_at AT TIME ZONE 'UTC','YYYY-MM-DD') AS day,source,kind,COUNT(*)::int AS total FROM interactions GROUP BY day,source,kind ORDER BY day DESC,source,kind",
  );
  return rows.map((r) => ({
    day: String(r.day),
    source: String(r.source),
    kind: String(r.kind),
    total: Number(r.total),
  }));
}
