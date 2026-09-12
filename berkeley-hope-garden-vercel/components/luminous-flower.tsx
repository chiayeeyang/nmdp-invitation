import type { CSSProperties } from "react";
import { flowerStyle } from "@/lib/flower-identity";
export function LuminousFlower({
  identity = 0,
  className = "",
  style = {},
}: {
  identity?: number;
  className?: string;
  style?: CSSProperties;
}) {
  const f = flowerStyle(identity);
  return (
    <span
      aria-hidden="true"
      className={`luminous-flower ${className}`}
      style={
        {
          "--flower-lean": `${f.lean}deg`,
          "--flower-bend": `${f.bend}deg`,
          "--flower-facing": f.facing,
          "--flower-height": f.height,
          "--flower-breeze": `${f.breeze}deg`,
          "--petal-nod": `${f.nod}deg`,
          "--sway-duration": `${f.sway}s`,
          "--sway-delay": `${f.delay}s`,
          "--petal-hue": `${f.hue}deg`,
          "--petal-saturation": f.saturation,
          "--petal-brightness": f.brightness,
          "--petal-turn": `${f.turn}deg`,
          "--bloom-scale": f.scale,
          "--petal-width": f.openness,
          ...style,
        } as CSSProperties
      }
    >
      <span className="stem-reveal">
        <img
          className="stem-asset"
          src="/luminous-stem.webp"
          alt=""
          width="384"
          height="768"
          draggable="false"
        />
      </span>
      <span className="bloom-aura" />
      <span className="flower-head">
        <img
          className="leaflet-bloom"
          src="/leaflet-bloom.webp"
          alt=""
          width="640"
          height="640"
          draggable="false"
        />
      </span>
    </span>
  );
}
