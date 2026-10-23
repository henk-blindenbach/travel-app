import type { PublicDictionary } from "./dictionary";

export type MapChromeLabels = {
  loading: string;
  routeToggleTitle: string;
  routeToggleAria: string;
  routeToggleLabel: string;
  open: string;
  ariaLabel: string;
  empty: string;
};

export function mapChromeLabels(map: PublicDictionary["map"]): MapChromeLabels {
  return {
    loading: map.loading,
    routeToggleTitle: map.routeToggleTitle,
    routeToggleAria: map.routeToggleAria,
    routeToggleLabel: map.routeToggleLabel,
    open: map.open,
    ariaLabel: map.ariaLabel,
    empty: map.empty,
  };
}
