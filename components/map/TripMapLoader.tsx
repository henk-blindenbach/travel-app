"use client";

import dynamic from "next/dynamic";
import type { TripMapPin } from "../../lib/map-types";

const TripMap = dynamic(() => import("./TripMap").then((mod) => mod.TripMap), {
  ssr: false,
  loading: () => <div className="trip-map-shell trip-map-loading" aria-busy="true"><p>Kaart laden…</p></div>,
});

export function TripMapLoader({ pins }: { pins: TripMapPin[] }) {
  return <TripMap pins={pins} />;
}
