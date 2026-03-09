# HubSpot Form Loading UX

## Problem

Content layout shift when HubSpot form loads. "Loading form..." text renders briefly, then gets replaced by the iframe form with a different height, causing a jarring jump.

## Solution

Skeleton placeholder with configurable height + crossfade transition.

## Schema Change

Add optional `formHeight` (integer, default 300) to `forms.hubspot-form`:

```json
"formHeight": {
  "type": "integer",
  "default": 300
}
```

## Frontend Behavior

1. **SSR/Initial render:** Show skeleton at `formHeight` px (or 300px default) — 3-4 animated pulse bars mimicking form fields (label + input pairs, a wider textarea bar, a button bar).

2. **Form loading:** HubSpot form renders in an overlaid div with `opacity-0` on top of the skeleton, same container height.

3. **Transition (300ms):** Once iframe is detected, crossfade — skeleton fades out (`opacity-0`), form fades in (`opacity-100`). Uses CSS `transition-opacity duration-300`.

4. **After transition:** Remove skeleton from DOM, let form container height be natural (no longer constrained to `formHeight`).

## Layout Structure

The container uses `position: relative` with `min-height` set to `formHeight`. Skeleton is positioned normally. Form div is `absolute inset-0` with `opacity-0` initially. On load, form gets `opacity-100` and skeleton gets `opacity-0`, then after transition ends, skeleton unmounts and form becomes `static`.

## Implementation Steps

1. Add `formHeight` attribute to Strapi schema, regenerate types
2. Create `FormSkeleton` component — animated pulse bars mimicking form fields
3. Refactor `HubSpotFormEmbed` — overlay pattern with crossfade transition
4. Update `StrapiHubspotForm` to pass `formHeight` through
