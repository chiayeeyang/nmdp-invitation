import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import {
  recordInteraction,
  readGarden,
  readResults,
  type Query,
} from "../lib/garden-store";
import {
  parseInteraction,
  readInteraction,
  sessionCookie,
  sessionId,
} from "../lib/interactions";
import { eventCalendar } from "../lib/calendar";
import { POST } from "../app/api/garden/route";
const sid = "7a6f32bb-d68a-41bc-bb34-992afc280347";
const eid = "a49322ed-64e2-44b3-881a-381d2feb513f";
test("shared SQL counter deduplicates concurrent plants by session", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"),
    );
    const query: Query = async (text, params) =>
      (await db.query<Record<string, unknown>>(text, params)).rows;
    const plant = parseInteraction({
      kind: "plant",
      flower: 2147483647,
      source: "leaflet",
      eventId: eid,
    });
    await Promise.all(
      Array.from({ length: 5 }, () => recordInteraction(query, sid, plant)),
    );
    await recordInteraction(
      query,
      sid,
      parseInteraction({ kind: "visit", source: "leaflet", eventId: eid }),
    );
    await recordInteraction(
      query,
      sid,
      parseInteraction({
        kind: "visit",
        source: "social",
        eventId: crypto.randomUUID(),
      }),
    );
    await recordInteraction(query, crypto.randomUUID(), {
      ...plant,
      flower: 12,
      source: "social",
    });
    await recordInteraction(query, sid, {
      kind: "calendar",
      eventId: eid,
      source: "leaflet",
    });
    await recordInteraction(query, sid, {
      kind: "calendar",
      eventId: eid,
      source: "leaflet",
    });
    await recordInteraction(query, sid, {
      kind: "calendar",
      eventId: crypto.randomUUID(),
      source: "leaflet",
    });
    const snapshot = await readGarden(query, sid);
    assert.equal(snapshot.mine, 2147483647);
    assert.equal(snapshot.flowers.length, 2);
    assert.equal(snapshot.counts.find((c) => c.kind === "plant")?.total, 2);
    assert.equal(snapshot.counts.find((c) => c.kind === "visit")?.total, 1);
    assert.equal(snapshot.counts.find((c) => c.kind === "calendar")?.total, 2);
    assert.equal((await readGarden(query, crypto.randomUUID())).mine, null);
    const results = await readResults(query);
    assert.equal(
      results.find((r) => r.kind === "plant" && r.source === "social")?.total,
      1,
    );
    assert.match(results[0].day, /^\d{4}-\d{2}-\d{2}$/);
    await assert.rejects(
      query(
        "INSERT INTO interactions(id,kind,source,flower) VALUES ('bad','plant','direct',-1)",
      ),
    );
  } finally {
    await db.close();
  }
});
test("validation rejects invalid values and oversized bodies", async () => {
  for (const flower of [-1, 2147483648, 1.5, "2", null])
    assert.throws(() =>
      parseInteraction({ kind: "plant", flower, eventId: eid }),
    );
  assert.throws(() => parseInteraction({ kind: "erase", eventId: eid }));
  assert.throws(() => parseInteraction({ kind: "visit", eventId: "bad" }));
  assert.equal(
    parseInteraction({ kind: "visit", source: "unknown", eventId: eid }).source,
    "direct",
  );
  await assert.rejects(
    readInteraction(
      new Request("https://garden.test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: " ".repeat(2049),
      }),
    ),
  );
});
test("cookie is session-only, HttpOnly, SameSite and Secure on HTTPS", () => {
  const request = new Request("https://garden.test", {
    headers: { cookie: "other=x; garden_session=" + sid },
  });
  assert.equal(sessionId(request), sid);
  assert.equal(
    sessionId(
      new Request("https://garden.test", {
        headers: { cookie: "garden_session=bad" },
      }),
    ),
    null,
  );
  assert.match(sessionCookie(sid, request), /HttpOnly; SameSite=Lax; Secure$/);
  assert.doesNotMatch(sessionCookie(sid, request), /Max-Age|Expires/);
});
test("POST rejects cross-origin writes and missing sessions", async () => {
  assert.equal(
    (
      await POST(
        new Request("https://garden.test/api/garden", {
          method: "POST",
          headers: { origin: "https://other.test" },
        }),
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await POST(
        new Request("https://garden.test/api/garden", {
          method: "POST",
          headers: { origin: "https://garden.test" },
        }),
      )
    ).status,
    409,
  );
});
test("calendar has Pacific event times, escaped location, CRLF and folded lines", () => {
  const ics = eventCalendar(),
    unfolded = ics.replace(/\r\n /g, "");
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.match(unfolded, /DTSTART:20260921T170000Z\r\nDTEND:20260921T190000Z/);
  assert.ok(unfolded.includes("2495 Bancroft Way\\, Berkeley\\, CA 94720"));
  assert.ok(ics.split("\r\n").every((line) => Buffer.byteLength(line) <= 75));
  assert.equal(new Date("2026-09-21T17:00:00Z").getUTCDay(), 1);
});
