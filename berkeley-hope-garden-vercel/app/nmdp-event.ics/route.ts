import { eventCalendar } from "@/lib/calendar";
export function GET() {
  return new Response(eventCalendar(), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="nmdp-event.ics"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
