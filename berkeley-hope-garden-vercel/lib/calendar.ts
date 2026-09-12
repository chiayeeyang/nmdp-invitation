export const EVENT = {
  title: "NMDP Tabling Session - Berkeley Hope Garden",
  startUtc: "20260921T170000Z",
  endUtc: "20260921T190000Z",
  location: "Outside Amazon Hub Locker, 2495 Bancroft Way, Berkeley, CA 94720",
  description:
    "Meet Berkeley MDes student volunteers and learn about joining the NMDP blood stem cell donor registry. A calendar reminder is not an RSVP or registry signup.",
};
function escape(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
export function eventCalendar() {
  return (
    [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Berkeley Hope Garden//NMDP Event//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:berkeley-hope-garden-20260921@hope-garden.local",
      "DTSTAMP:20260911T000000Z",
      `DTSTART:${EVENT.startUtc}`,
      `DTEND:${EVENT.endUtc}`,
      `SUMMARY:${escape(EVENT.title)}`,
      `LOCATION:${escape(EVENT.location)}`,
      `DESCRIPTION:${escape(EVENT.description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ]
      .flatMap((line) =>
        line.match(/.{1,73}/g)!.map((chunk, i) => (i ? " " : "") + chunk),
      )
      .join("\r\n") + "\r\n"
  );
}
