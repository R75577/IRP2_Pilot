# Firebase setup and collected data

The page now uses project `irp2-6d8c6`. The configuration is in `index.html`.

1. In Firebase Console → Authentication → Sign-in method, enable **Anonymous** authentication.
2. In **Realtime Database** → Rules, paste the entire contents of `database.rules.json` and publish. These are Realtime Database rules, not Firestore rules.
3. Serve the study over HTTPS (or localhost for testing). Upload `index.html`, `study.css`, `experiment.js`, `consent.js`, `image-manifest.js`, `jspsych.js`, `jspsych.css`, `plugins/`, and `all_images/` with the same directory structure.
4. Complete a pilot submission and verify a record in Realtime Database before recruitment. Rules have not been deployed by this code change.

The completion link is https://connect.cloudresearch.com/participant/project/1EC415FF2C/complete. The consent states approximately **15 minutes** and **$2.50 USD**. Its collection-method paragraph uses the researcher-requested jsPsych and secured-account wording (consent version `2026-10-20-v4`).

## Data stored

One completed session is saved at `responses/<anonymous Firebase UID>/<random session UUID>` only after the participant enters the required CloudResearch Connect ID and clicks **Submit responses**. Consent, demographics, and image responses remain in page memory before submission; closing or reloading the page discards them. Firebase authentication starts at submission. A failed save stays on the saving screen with a retry option; an offline pending write waits for reconnection. The success page and completion link appear only after the write is acknowledged.

| Field | Contents |
|---|---|
| `client_version`, `session_id` | Study version and random session ID |
| `started_at`, `completed_at`, `saved_at` | Page start and submission times from the participant's clock; Firebase server save timestamp. Milliseconds since Unix epoch. |
| `consent` | Affirmative consent, consent-text version, client consent timestamp, and consent-page response time in milliseconds |
| `demographics` | Age range, gender identity, ethnicity, area of study, highest completed education, and demographic-page response time |
| `recruitment.cloudresearch_id` | Required manually entered CloudResearch Connect ID, trimmed of surrounding whitespace; stored separately from URL IDs |
| Other `recruitment` fields | `pid`, `workerId`, `PROLIFIC_PID`, `participantId`, `assignmentId`, `projectId` copied from the study URL; absent values are empty strings |
| `block_order` | Randomized Male/Female order |
| `trial_count` | 166 |
| `trials/001` … `trials/166` | Presentation number, block name and position, position within block, exact image path/filename, filename category (`An`, `Nu`, or `Hp`), selected emotion, classification key and time, numeric emotion rating (1–7), rating key, and rating response time in milliseconds |

Recruitment IDs can link a record to a platform account: treat these records as potentially identifiable, and remove IDs before public data sharing. No name, email, free-text answers, image binary data, or answers to the old height/athleticism/intelligence questions are collected by the experiment. No Analytics SDK is loaded; `measurementId` is configuration only. Hosting/Firebase services may maintain their own operational logs outside this response schema.

## Rule behavior

Client database reads are denied. Authenticated users can write only under their own UID, cannot delete records, and must supply the complete required schema. Rules reject unexpected fields, missing consent/demographics, invalid answer options, invalid ratings, wrong filename prefixes, mismatched block ordering, and missing trial slots. A retry writes to the same session location rather than adding a duplicate. Users can replace their own session with another valid payload; these rules do not make client-submitted research data tamper-proof or prevent repeated participation. Authorized project administrators can inspect/export data through Firebase Console or an Admin SDK.

Rules are tailored to the current 82 male / 84 female images. If images change, run `python3 scripts/build-image-manifest.py`, which updates both the image manifest and Firebase filename allowlist. The script stops if total/block counts change; review rule counts, trial slots, and block offsets in that case. Republish the updated rules with the study. Exact filenames (including `+` characters and mixed `.jpg`, `.jpeg`, `.png` extensions) are preserved.

The age choices preserve the requested `41-60` and `60+` labels, which overlap at age 60.

Firebase references: [Realtime Database rules](https://firebase.google.com/docs/database/security), [validation and authorization conditions](https://firebase.google.com/docs/database/security/rules-conditions).

## Local verification

`tests/browser-check.html` uses the real local jsPsych plugins and a Firebase mock; it never sends study data to Firebase. Open it through a local server in Chrome to exercise mandatory fields, image/block membership, keyboard acceptance, gray ITI, viewport layout, and payload structure. It does not validate deployed Firebase rules or real authentication. Exclude `tests/` from the participant deployment.

A complete automated check is also available at `tests/final-check.html?first=Male&participantId=FINAL_TEST&assignmentId=ASSIGN_TEST&projectId=PROJECT_TEST` (repeat with `first=Female`). It runs every real keyboard trial, tests save failure/retry with a mock, and evaluates local rule expressions against the resulting payload. This expression evaluator is not the Firebase emulator; a real hosted pilot is still required. See `FINAL_CHECK.md`.

The ID form appears after all image ratings. Empty and whitespace-only IDs are rejected; IDs are limited to 128 characters. This checks that an ID is provided, not that it belongs to a valid CloudResearch account. The completion URL is shown only after saving succeeds. The latest rules require the typed ID and updated study/consent versions; republish them before running the revised study. The previously reported live saving error remains undiagnosed pending its Firebase error code.

Four random practice trials precede the main blocks and are excluded from the submitted trial data. Deploy the updated database.rules.json with emotion-v6 before collecting responses.
