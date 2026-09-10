# Verified job source policy

Job Radar only enables automated ingestion where the source exposes a public feed/API or the operator has approved partner/API access. Every imported role must preserve an original or official application destination.

## Enabled automated sources

### Remote OK
- Public JSON feed.
- Job Radar credits Remote OK and links back to the source listing.
- Remote-only source.

### Arbeitnow
- Public job API with no API key required.
- The feed aggregates roles from employer ATS systems such as Greenhouse, SmartRecruiters, Join.com, Teamtailor, Recruitee and Comeet.
- Remote and non-remote roles may be returned; user matching preferences filter them.

## LinkedIn

Direct unrestricted LinkedIn job ingestion is **not enabled**. LinkedIn API access is product/enterprise gated. Job Radar must not bypass authentication, anti-bot controls or platform terms. A LinkedIn adapter may be enabled later only when an approved LinkedIn/API partner feed or another lawful source provides the listing and official application URL.

## Instagram

Direct Instagram scraping is **not enabled**. A social-source adapter may be added only when the operator has an approved API/partner data path and can verify that the post is an actual job opening with a legitimate application destination.

## Freshness rules

- The Supabase scheduler runs ingestion every day at 05:15 UTC.
- A listing seen again is refreshed and kept active.
- A listing with an explicit deadline is closed after that deadline passes.
- A listing without an explicit deadline is kept active while it remains visible in the supported feed; if it disappears, Job Radar uses a seven-day grace period before closing it as stale.
- If a previously closed source listing reappears, ingestion can reactivate it.

## Verification principles

- Preserve source attribution and canonical/application URLs.
- Do not fabricate deadlines, salaries, requirements, companies or contact details.
- Prefer employer/ATS destinations when available.
- De-duplicate source records using stable external identifiers and canonical URLs.
- Treat an aggregation source as verified only for provenance, not as a guarantee that the employer or posting is scam-free; users should verify unusual requests at the original destination.
