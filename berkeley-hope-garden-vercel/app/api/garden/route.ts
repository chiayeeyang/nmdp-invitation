import { database } from "@/lib/database";
import { sessionId, sessionCookie, readInteraction } from "@/lib/interactions";
import { readGarden, recordInteraction } from "@/lib/garden-store";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };
export async function GET(request: Request) {
  try {
    const sid = sessionId(request) ?? crypto.randomUUID();
    return Response.json(await readGarden(database(), sid), {
      headers: { ...headers, "Set-Cookie": sessionCookie(sid, request) },
    });
  } catch {
    console.error(
      "Garden database read failed. Check DATABASE_URL and run db:setup.",
    );
    return Response.json(
      { error: "The garden is taking a little rest. Please try again." },
      { status: 503, headers },
    );
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Invalid origin" }, { status: 403, headers });
  const sid = sessionId(request);
  if (!sid)
    return Response.json(
      { error: "Initialize your garden session first." },
      { status: 409, headers },
    );
  let p;
  try {
    p = await readInteraction(request);
  } catch {
    return Response.json(
      { error: "Invalid request" },
      { status: 400, headers },
    );
  }
  try {
    await recordInteraction(database(), sid, p);
    return Response.json({ ok: true }, { headers });
  } catch {
    console.error(
      "Garden database write failed. Check DATABASE_URL and run db:setup.",
    );
    return Response.json(
      { error: "Your flower could not be planted. Please try again." },
      { status: 503, headers },
    );
  }
}
