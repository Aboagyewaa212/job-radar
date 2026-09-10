# Job Radar launch checklist

This file maps the UI/legal checklist requested during the v0.2 review to the current implementation. It is an engineering/product audit, not a legal certification.

| Check | Status | Implementation |
| --- | --- | --- |
| Colour contrast | Addressed | Dark sidebar/light surfaces, readable muted text, visible focus ring and high-contrast primary actions in `global.css`. Re-test with automated accessibility tooling before a public commercial launch. |
| Alt text on images | Addressed / currently not applicable | Job Radar currently uses no meaningful content images. Icons accompany text or have accessible control labels. Future meaningful images must include descriptive `alt`; decorative images should use empty `alt`. |
| Refund policy | Addressed | `/refunds` explains that there is currently no paid plan and therefore no customer payment to refund. It states what must be added before payments launch. |
| Privacy policy page | Addressed | `/privacy` documents collected data, use, private storage, AI processing and user choices. |
| Accessibility | Addressed | Skip links, semantic headings, keyboard focus styling, labelled controls and an `/accessibility` statement are included. |
| Remove fake reviews | Passed | The product displays no testimonials, star ratings or fabricated reviews. |
| Terms & Conditions | Addressed | `/terms` covers service purpose, job data, generated documents, acceptable use and changing sources. |
| Third-party embeds | Addressed | The Google Fonts remote import was removed. The UI uses no social widgets, advertising pixels or embedded third-party frames. Job links open the original destination directly. |
| Copyright on images | Passed / currently not applicable | No third-party content images are bundled into the UI. Lucide icons are used as code dependencies. |
| Cookies policy | Addressed | `/cookies` documents the current browser-storage behavior. |
| Tracking | Passed | No advertising or analytics tracker is configured in the current frontend. |
| Form consent | Addressed | Account creation requires Terms/Privacy acceptance. CV upload during onboarding requires explicit resume-processing consent. |
| Local laws | Needs deployment-owner review | Product text avoids claiming universal legal compliance. Before commercial launch, the operator must review privacy, employment and consumer law for each operating market. |
| Clear button labels | Addressed | Text buttons use action verbs; icon-only controls use accessible labels such as Save job / Remove saved job and Sign out. |
| Cookie consent | Correctly scoped | Because no non-essential tracking cookies are enabled, there is no fake opt-in toggle. An informational essential-storage notice links to the policy. If optional tracking is introduced, add opt-in controls before loading it where required. |
| Real business details | Addressed without fabrication | The landing page identifies Job Radar as an independent software project and does not claim a registered company that does not exist. Add registered entity/contact details if the project becomes a business. |
| Only collect necessary data | Addressed | Current product data is limited to account data, career profile/preferences, CV/resume, job matches, application progress and generated documents. |
| Keyboard-friendly forms | Addressed | Native inputs/selects/buttons/links are used, focus is visible, and skip links are available. |
| Remove unsupported claims | Addressed | Landing/Terms avoid guarantees about hiring outcomes and do not claim unrestricted LinkedIn/Instagram coverage. |

## Before a public commercial launch

Run an automated accessibility scan (axe/Lighthouse), complete a jurisdiction-specific privacy/legal review, implement self-service account deletion/data export, add a real support/contact channel, and re-run this checklist whenever analytics, payments, ads, social embeds or new AI providers are introduced.
