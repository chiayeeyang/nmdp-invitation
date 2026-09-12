export const KINDS = ["visit", "plant", "calendar", "nmdp"] as const;
export type Kind = (typeof KINDS)[number];
export type Interaction = {
  kind: Kind;
  eventId: string;
  source: "leaflet" | "social" | "direct";
  flower?: number;
};
const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function sessionId(request: Request) {
  const value = request.headers
    .get("cookie")
    ?.split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("garden_session="))
    ?.slice(15);
  return value && uuid.test(value) ? value.toLowerCase() : null;
}
export function sessionCookie(id: string, request: Request) {
  return `garden_session=${id}; Path=/; HttpOnly; SameSite=Lax${new URL(request.url).protocol === "https:" ? "; Secure" : ""}`;
}
export function parseInteraction(value: unknown): Interaction {
  if (!value || typeof value !== "object") throw new Error("Invalid request");
  const p = value as Record<string, unknown>;
  if (
    !KINDS.includes(p.kind as Kind) ||
    typeof p.eventId !== "string" ||
    !uuid.test(p.eventId)
  )
    throw new Error("Invalid interaction");
  if (
    p.kind === "plant" &&
    (!Number.isInteger(p.flower) ||
      Number(p.flower) < 0 ||
      Number(p.flower) > 2147483647)
  )
    throw new Error("Invalid flower");
  return {
    kind: p.kind as Kind,
    eventId: p.eventId.toLowerCase(),
    source:
      p.source === "leaflet" || p.source === "social" ? p.source : "direct",
    flower: p.kind === "plant" ? Number(p.flower) : undefined,
  };
}
export async function readInteraction(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("Expected JSON");
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing body");
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 2048) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.length;
  }
  return parseInteraction(JSON.parse(new TextDecoder().decode(body)));
}
