# Thailand Liveability Index

A standalone, methodology-first liveability index for Thailand's 77 provinces, with a zone-overlay layer that captures expat-dense and tourist-dense areas where province-level numbers obscure lived reality.

**Status:** In active development. MVP launch targeted for late August / early September 2026.

## What it is

The Thailand Liveability Index (TLI) measures and ranks how liveable each Thai province is across a transparent set of indicators — air quality, healthcare access, walkability, public safety, transport connectivity, and others. Where province-level data is too coarse to be useful (Bangkok's 50 districts vary enormously; the same is true of expat enclaves in Chiang Mai, Phuket, and Pattaya), TLI adds a zone-overlay layer that surfaces sub-provincial differences.

The methodology is built to be:

- **Auditable.** Every indicator's source, normalization method, and weighting decision is documented.
- **Reproducible.** Scoring code and schemas are open source.
- **Honest about granularity.** Where data is national or provincial, it's labeled as such, not silently extrapolated to a finer level.

## What it isn't

- Not a Numbeo clone. Underlying data is from official sources (TMD, OpenAQ, MOPH, ACLED, transport authorities) — not user-submitted reports.
- Not commercial. The index is published as a public utility. Methodology is open. There are no paid tiers.
- Not a tourism index. Liveability is not the same as visitability. TLI measures what it's like to live somewhere, not what it's like to visit.

## Methodology

Will be published in this repository at MVP launch. Methodology covers:

- Indicator selection and weighting
- Source-by-source provenance, refresh cadence, and license
- Normalization approach (z-scores, percentile bands)
- Zone-overlay logic and inheritance rules from province → zone
- Scoring formula and aggregation

## Data sources

TLI draws from official Thai government APIs (Thai Meteorological Department, Ministry of Public Health, Department of Land Transport, Tourism Authority of Thailand), Thai academic and civic sources, and international datasets where Thailand-specific equivalents don't exist or are unreliable (OpenAQ for air quality, ACLED for political stability, OpenStreetMap for amenity counts).

A complete data sources manifest with refresh cadence and license info will be published with the methodology at launch.

## Distribution

TLI is designed as a standalone resource (Walk Score-shaped) with embeddable widgets that other sites can use. The first widget consumer is [thailand-wanderer.com](https://thailand-wanderer.com).

## Repository status

This repository is currently a placeholder. Code, methodology, and data schemas land here as the MVP approaches launch. To follow progress, watch this repo on GitHub.

## License

- Code: MIT (see [`LICENSE`](LICENSE))
- Methodology and data outputs: CC BY 4.0 (see [`DATA-LICENSE`](DATA-LICENSE))
