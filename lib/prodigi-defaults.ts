/**
 * Shared Prodigi defaults (no fetch clients — avoids import cycles).
 * Prefer env overrides: PRODIGI_STUDIO_TEMPLATE_ID, PRODIGI_DEFAULT_SKU.
 *
 * Studio has no separate “publish for API” step: a saved template + these env
 * vars is enough. Storefront embed / merchant snippet is NOT required.
 */

/** Henk’s saved Travel-app Studio template. */
export const DEFAULT_STUDIO_TEMPLATE_ID = "112004b7-199e-4be5-a5f9-e1043876f6c8";

/** Layflat A4 SKU. */
export const DEFAULT_PHOTO_BOOK_SKU = "BOOK-FE-A4-L-LF-G"; // pragma: allowlist secret
