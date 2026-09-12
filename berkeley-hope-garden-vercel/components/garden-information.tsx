"use client";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CalendarDays, MapPin, RefreshCw } from "lucide-react";
import type { Garden } from "@/lib/garden-types";
type Props = {
  garden: Garden | null;
  selected: number;
  setSelected: (value: number) => void;
  busy: boolean;
  error: string;
  shareNote: string;
  plant: () => void;
  share: () => void;
  reload: () => void;
  track: (kind: string) => Promise<void>;
};
export function GardenInformation({
  garden,
  busy,
  error,
  plant,
  reload,
  track,
}: Props) {
  const planted = garden?.mine !== null && garden?.mine !== undefined;
  return (
    <div className="information-inner">
      <section id="event" className="event-section combined-event">
        <div className="event-heading">
          <span className="eyebrow">YOUR NEXT SMALL STEP</span>
          <h2>
            Now, let’s meet
            <br />
            on Bancroft.
          </h2>
          <Button asChild className="primary calendar-button">
            <a
              href="/nmdp-event.ics"
              download
              onClick={() => {
                track("calendar").catch(() => {});
              }}
            >
              Add to my calendar <CalendarDays size={18} />
            </a>
          </Button>
          <p className="micro">
            A calendar reminder, not an RSVP or registry signup.
          </p>
        </div>
        <div className="event-details">
          <div className="detail-row">
            <CalendarDays />
            <div>
              <strong>Monday, September 21, 2026</strong>
              <span>10 AM–12 PM Pacific Time</span>
            </div>
          </div>
          <div className="detail-row">
            <MapPin />
            <div>
              <strong>Outside Amazon Hub Locker</strong>
              <span>2495 Bancroft Way, Berkeley, CA 94720</span>
              <a
                href="https://www.google.com/maps/search/?api=1&query=2495+Bancroft+Way+Berkeley+CA+94720"
                target="_blank"
                rel="noreferrer"
              >
                Get directions <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
          <h3>
            Bring a friend.
            <br />
            Be a potential match.
          </h3>
          <p>
            Stop by the NMDP table. Meet Berkeley MDes student volunteers, ask
            questions, and learn how to join the blood stem cell donor registry.
          </p>
        </div>
        {!planted && (
          <div className="participation-note">
            <p>
              Plant a flower for people affected by blood cancer. Then take your
              next small step with NMDP.
            </p>
            <Button
              className="primary plant-button"
              disabled={busy || !garden}
              onClick={plant}
            >
              {busy ? "Planting your flower…" : "Plant my flower"}
            </Button>
            <p className="micro">
              No account. No download. Just a little hope.
            </p>
          </div>
        )}
        <p className="disclosure">
          Planting is a gesture of support, not donor registration or a
          donation.
        </p>
        {error && (
          <div className="error" role="alert">
            {error}
            <button onClick={reload}>
              <RefreshCw size={16} /> Reload garden
            </button>
          </div>
        )}
      </section>
      <section className="learn">
        <div>
          <span className="eyebrow">CURIOUS IS A GOOD PLACE TO START</span>
          <h2>A swab starts a possibility.</h2>
        </div>
        <div className="faq-list">
          <details>
            <summary>What does joining the registry mean?</summary>
            <p>
              You join as a potential blood stem cell donor. A cheek swab helps
              identify your tissue type. If you’re a potential match, NMDP
              contacts you about next steps. Joining is a commitment to consider
              donating if called; the swab itself is not a stem cell donation.
            </p>
          </details>
          <details>
            <summary>Who can join?</summary>
            <p>
              NMDP registry eligibility includes ages 18–35, U.S. residency
              (including its territories and freely associated states), and
              health guidelines. Already registered? You don’t need to join
              again. Everyone is welcome to stop by and learn.
            </p>
          </details>
          <details>
            <summary>What does this garden track?</summary>
            <p>
              This student project records garden visits, flowers planted,
              calendar clicks, and NMDP link clicks, grouped by date and
              invitation source. A random session cookie limits visits and
              flowers to one per browser session. We don’t ask for your name,
              contact details, or health information. Counts measure
              interactions, not unique people, attendance, or donor
              registrations. No advertising trackers are added.
            </p>
          </details>
          <a
            className="nmdp-link"
            href="https://www.nmdp.org/get-involved/join-the-registry"
            target="_blank"
            rel="noreferrer"
            onClick={() => track("nmdp").catch(() => {})}
          >
            Learn about joining at NMDP <ArrowUpRight size={18} />
          </a>
        </div>
      </section>
      <footer>
        <span>
          SEPTEMBER IS BLOOD CANCER & PEDIATRIC CANCER AWARENESS MONTH
        </span>
        <p>
          Student-created invitation · Berkeley MDes volunteers ·{" "}
          <a href="/results">Garden activity</a>
        </p>
        <p>
          This garden is an independent student project, not an official NMDP or
          UC Berkeley website.
        </p>
      </footer>
    </div>
  );
}
