"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TripMapPin } from "../../lib/map-types";

const OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxzoom: 19,
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const KIND_CLASS: Record<TripMapPin["kind"], string> = {
  planned: "trip-map-marker planned",
  visited: "trip-map-marker visited",
  published: "trip-map-marker published",
};

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function popupHtml(pin: TripMapPin) {
  const thumb = pin.thumbnailUrl
    ? `<img class="trip-map-popup-thumb" src="${escapeHtml(pin.thumbnailUrl)}" alt="" />`
    : "";
  const link = pin.href
    ? `<a class="trip-map-popup-link" href="${escapeHtml(pin.href)}">Openen →</a>`
    : "";
  return `<div class="trip-map-popup">${thumb}<div><strong>${escapeHtml(pin.label)}</strong>${
    pin.subtitle ? `<small>${escapeHtml(pin.subtitle)}</small>` : ""
  }${link}</div></div>`;
}

export function TripMap({ pins, className }: { pins: TripMapPin[]; className?: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [5.2, 52.1],
      zoom: 3,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const markers: maplibregl.Marker[] = [];
    const bounds = new maplibregl.LngLatBounds();

    const render = () => {
      markers.forEach((marker) => marker.remove());
      markers.length = 0;
      if (!pins.length) return;

      pins.forEach((pin) => {
        const el = document.createElement("button");
        el.type = "button";
        el.className = KIND_CLASS[pin.kind];
        el.setAttribute("aria-label", pin.label);
        if (pin.thumbnailUrl && pin.kind === "visited") {
          el.style.backgroundImage = `url(${pin.thumbnailUrl})`;
          el.classList.add("has-thumb");
        }
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([pin.longitude, pin.latitude])
          .setPopup(new maplibregl.Popup({ offset: 16, maxWidth: "240px" }).setHTML(popupHtml(pin)))
          .addTo(map);
        markers.push(marker);
        bounds.extend([pin.longitude, pin.latitude]);
      });

      if (pins.length === 1) {
        map.flyTo({ center: [pins[0].longitude, pins[0].latitude], zoom: 10, essential: true });
      } else if (pins.length > 1) {
        map.fitBounds(bounds, { padding: 56, maxZoom: 11, duration: 700 });
      }
    };

    if (map.loaded()) render();
    else map.once("load", render);

    return () => {
      markers.forEach((marker) => marker.remove());
    };
  }, [pins]);

  return (
    <div className={className ? `trip-map-shell ${className}` : "trip-map-shell"}>
      <div ref={containerRef} className="trip-map-canvas" role="region" aria-label="Reiskaart" />
      {!pins.length ? (
        <p className="trip-map-empty">Nog geen kaartdpunten. Vul een plaats in bij een reisdag om een pin te krijgen.</p>
      ) : null}
    </div>
  );
}
