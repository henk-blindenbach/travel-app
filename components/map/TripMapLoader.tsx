"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { TripMapPin } from "../../lib/map-types";
import { dayRoutePins } from "../../lib/map-types";

const TripMap = dynamic(() => import("./TripMap").then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => <p className="trip-map-loading">Kaart laden…</p>,
});

export function TripMapLoader({
  pins,
  compact = false,
  showRouteToggle = true,
  defaultShowRoute = true,
}: {
  pins: TripMapPin[];
  compact?: boolean;
  showRouteToggle?: boolean;
  defaultShowRoute?: boolean;
}) {
  const [showRoute, setShowRoute] = useState(defaultShowRoute);
  const canToggleRoute = useMemo(() => dayRoutePins(pins).length >= 2, [pins]);

  return (
    <div className={compact ? "trip-map-loader is-compact" : "trip-map-loader"}>
      {showRouteToggle && canToggleRoute ? (
        <label className="trip-map-route-toggle" title="Lijn tussen dagen in volgorde">
          <input
            type="checkbox"
            checked={showRoute}
            onChange={(event) => setShowRoute(event.target.checked)}
            aria-label="Lijn tussen dagen tonen"
          />
          <span className="trip-map-route-toggle-text">Lijn</span>
        </label>
      ) : null}
      <TripMap pins={pins} showRoute={showRoute && canToggleRoute} compact={compact} />
    </div>
  );
}
