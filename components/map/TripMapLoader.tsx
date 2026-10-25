"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { TripMapPin } from "../../lib/map-types";
import { dayRoutePins } from "../../lib/map-types";
import type { MapChromeLabels } from "../../lib/i18n/map-labels";

const DEFAULT_CHROME: MapChromeLabels = {
  loading: "Kaart laden…",
  routeToggleTitle: "Lijn langs foto’s met GPS (of geplande dagen)",
  routeToggleAria: "Routelijn tonen",
  routeToggleLabel: "Lijn",
  open: "Openen →",
  ariaLabel: "Reiskaart",
  empty: "Nog geen kaartpunten. Vul een plaats in bij een reisdag of planningonderdeel om een pin te krijgen.",
};

const TripMap = dynamic(() => import("./TripMap").then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => <p className="trip-map-loading">{DEFAULT_CHROME.loading}</p>,
});

export function TripMapLoader({
  pins,
  compact = false,
  showRouteToggle = true,
  defaultShowRoute = true,
  labels = DEFAULT_CHROME,
}: {
  pins: TripMapPin[];
  compact?: boolean;
  showRouteToggle?: boolean;
  defaultShowRoute?: boolean;
  labels?: MapChromeLabels;
}) {
  const [showRoute, setShowRoute] = useState(defaultShowRoute);
  const canToggleRoute = useMemo(() => dayRoutePins(pins).length >= 2, [pins]);

  return (
    <div className={compact ? "trip-map-loader is-compact" : "trip-map-loader"}>
      {showRouteToggle && canToggleRoute ? (
        <label className="trip-map-route-toggle" title={labels.routeToggleTitle}>
          <input
            type="checkbox"
            checked={showRoute}
            onChange={(event) => setShowRoute(event.target.checked)}
            aria-label={labels.routeToggleAria}
          />
          <span className="trip-map-route-toggle-text">{labels.routeToggleLabel}</span>
        </label>
      ) : null}
      <TripMap
        pins={pins}
        showRoute={showRoute && canToggleRoute}
        compact={compact}
        labels={{ open: labels.open, ariaLabel: labels.ariaLabel, empty: labels.empty }}
      />
    </div>
  );
}
