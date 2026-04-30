# Thailand Liveability Index

A standalone, methodology-first liveability index for Thailand's 77 provinces, with a zone-overlay layer that captures expat-dense and tourist-dense areas where province-level numbers obscure lived reality.

**Status:** In active development. MVP launch targeted for late August / early September 2026.
**Site:** [thailandliveabilityindex.com](https://thailandliveabilityindex.com) (reserved; goes live at MVP launch)

## What it is

The Thailand Liveability Index (TLI) measures and ranks how liveable each Thai province is across a transparent set of indicators — air quality, healthcare access, walkability, public safety, transport connectivity, and others. Where province-level data is too coarse to be useful (Bangkok's 50 districts vary enormously; the same is true of expat enclaves in Chiang Mai, Phuket, and Pattaya), TLI adds a zone-overlay layer that surfaces sub-provincial differences.

The methodology is built to be:

- **Auditable.** Every indicator's source, normalization method, and weighting decision is documented.
- **Reproducible.** Scoring code and schemas are open source.
- **Honest about granularity.** Where data is national or provincial, it's labeled as such, not silently extrapolated to a finer level.

## Why a Thailand-specific index

Several global liveability indices already exist — EIU's Global Liveability Index, Mercer Quality of Living, InterNations Expat Insider, Numbeo. None of them work for the questions a Thailand resident or prospective resident actually has:

- **They cover only one or two Thai cities.** EIU and Mercer score Bangkok and stop. A retiree comparing Yasothon to Khon Kaen, or a remote worker choosing between Chiang Mai's Old City and Nimman, gets nothing useful.
- **They're calibrated for cross-country comparison, not within-country differentiation.** Indicators are designed to make Singapore vs. Lagos legible. The variance that matters when choosing between two Thai provinces — air quality during burning season, distance to a tertiary hospital, English-language signage density, BTS/MRT access, flood exposure — is invisible at that resolution.
- **Numbeo is user-submitted with severe sample bias.** Bangkok has thousands of submissions; most provinces have fewer than ten, are gameable, and go stale.
- **Most are paywalled.** Mercer and EIU charge for access. The Thailand-specific indices that do exist (NESDC indicators, HDR subnational reports) are policy-oriented, lag by years, and aren't built for consumer comparison.

TLI fills the gap by being Thailand-specific, sub-provincial where it matters, and transparently methodology-first.

## What it isn't

- **Not a Numbeo clone.** Underlying data is from official sources (TMD, OpenAQ, MOPH, ACLED, transport authorities) — not user-submitted reports.
- **Not a tourism index.** Liveability is not the same as visitability. TLI measures what it's like to live somewhere, not what it's like to visit.
- **Not a finished product.** It's in active development; the methodology is being refined and the data pipelines are being built.

## Methodology

The full methodology document will be published in this repository at MVP launch. It will cover:

- Indicator selection, definitions, and weighting
- Source-by-source provenance, refresh cadence, and license
- Normalization approach (z-scores, percentile bands)
- Zone-overlay logic and inheritance rules from province to zone
- Scoring formula and aggregation

## Data sources

TLI draws from official Thai government APIs (Thai Meteorological Department, Ministry of Public Health, Department of Land Transport, Tourism Authority of Thailand), Thai academic and civic sources, and international datasets where Thailand-specific equivalents don't exist or are unreliable (OpenAQ for air quality, ACLED for political stability, OpenStreetMap for amenity counts).

A complete data sources manifest with refresh cadence and license info will be published with the methodology at launch.

## Distribution

TLI is designed as a standalone resource — a public-facing site at [thailandliveabilityindex.com](https://thailandliveabilityindex.com), with embeddable widgets that third-party sites can use to surface province- or zone-level scores in context. The shape is closer to Walk Score than to a traditional report-style index.

## Roadmap

- **Phase 1 — Foundations** *(closed)*: Data source inventory, methodology v1.0, indicator dictionary, Phase 1 output documents.
- **Phase 2 — Data normalization** *(current)*: Build the ingestion pipeline, normalize indicators across all 77 provinces, validate Phase 1 hypotheses against real data, lock the zone slate.
- **Phase 3 — Scoring and validation**: Compute provincial and zone scores, run sensitivity analysis on weights, peer-review the methodology before MVP launch.
- **Phase 4 — Site and widgets**: Public-facing site at the canonical domain, embeddable widgets for third-party use, public API.
- **MVP launch**: Late August / early September 2026.

Future work after MVP may include premium services (real-time API access, data feeds, custom segmentation, white-label embeds) to fund continued development. The core index, methodology, and historical scores stay openly published regardless.

## Repository status

This repository contains the public site source for [thailandliveabilityindex.com](https://thailandliveabilityindex.com) — the site shell, design system, page templates, and a sample scores file. The methodology document, scoring code, and full data-sources manifest publish here at MVP launch (late August / early September 2026); until then, that material lives in a private working repository while it stabilizes. The canonical site is reserved and goes live at MVP launch. To follow progress, watch this repo on GitHub.

## License and trademark

Three layers, on purpose:

- **Code**: MIT (see [`LICENSE`](LICENSE)). Anyone may use, modify, and redistribute the source code, including in commercial products.
- **Methodology and data outputs**: CC BY 4.0 (see [`DATA-LICENSE`](DATA-LICENSE)). Anyone may use, adapt, and republish the methodology and aggregated scores, including commercially, with attribution.
- **Names and marks**: "Thailand Liveability Index", "TLI", and associated visual marks are trademarks of the project maintainer. They are **not** covered by the MIT or CC BY 4.0 licenses. See [`TRADEMARK.md`](TRADEMARK.md) for the boundary — what's open, what's protected, what counts as an acceptable or unacceptable use of the name.

The methodology and data are openly licensed so the index can be cited, embedded, and built on. The brand is held closed so users can trust that "TLI" identifies the official source.
