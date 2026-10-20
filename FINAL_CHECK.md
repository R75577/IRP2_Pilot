# Renamed image update — October 20, 2026

Five happy image filenames changed from F_Hp_37/38/39/40+/41+ to M_Hp_37/38/39/40+/41+. The manifest and Firebase filename allowlist now match the current folder. Counts are 82 male (41 An, 36 Nu, 5 Hp) and 84 female (44 An, 35 Nu, 5 Hp), 166 total. Firebase block limits and second-block trial offsets were updated. Manifest cache version updated.

Full local Chrome tests passed in both block orders, loading all images, completing four practices and 166 main trials, and validating the mocked saved payload against local rule expressions. No live data was uploaded. Publish the changed manifest, index.html, database.rules.json, and renamed image files together.

---

# Keyboard and instruction update — October 20, 2026

Instructions now use the requested wording and bold B/N/M. Classification accepts B for angry, N for neutral, M for happy (case insensitive; saved as lowercase). The question is now “Angry, neutral or happy?” in a smaller font. The larger response prompt uses bold uppercase key badges. Firebase validation uses b/n/m. Cache versions updated for experiment.js and study.css.

Validation: full local Chrome test passed at 1024×681 in Female → Male order, covering four practice trials, all 166 main trials, rejection of old a/h keys, emotion-dependent rating questions, viewport fit, and mocked save/retry with local database rule validation. No live responses were uploaded. Publish updated database.rules.json alongside the changed site files.

---

# Emotion trial update — October 16, 2026

Current version: `emotion-v6`. This update supersedes the earlier attractiveness-study checks below.

- Each face first asks “Is this face neutral, angry or happy?” Only a/n/h accepts a classification.
- The same face then asks “How angry/neutral/happy does the face appear?” according to the participant’s choice, with keys 1–7 and endpoints Not at all / Very.
- Four distinct randomly sampled practice images appear after instructions and fullscreen/preloading, before the main blocks. Practice is labeled and excluded from the submitted study data. Practice images remain in the full main image set.
- Current exact filenames: 166 images, 77 male and 89 female; categories An, Nu, Hp. Manifest and Firebase filename allowlist regenerated; counts, slots and block offsets updated.
- Main trial records include selected_emotion, classification_key, classification_rt_ms, rating, response_key and rt_ms.
- Consent, demographics, block randomization, one-second blank gray intervals, explicit submission, retry behavior and completion link are retained.

Validation: full local headless Chrome runs passed in Male → Female and Female → Male order. All four practices and all 166 main trials were answered through keyboard events. Checks covered rejected keys, all three question variants, image loading, viewport fit, practice exclusion, main-image uniqueness, intervals, no upload before submission, ID validation, simulated save failure/retry, complete payload acceptance and malformed payload rejection by local rule expressions. Firebase was mocked; no real responses were uploaded. Local rule-expression checks are not Firebase emulator or deployed-rule verification.

Deployment: publish the changed site files and database.rules.json together. Hosting and Firebase rules have not been deployed by this update.

---

## Earlier check record (superseded)

# Final study check — 12 October 2026

**Historical check of the pre-ID version: PASS after repairs. Live publication readiness remains unverified.**

Update: the current version now states 12 minutes/$2.00 USD and requires a manually entered CloudResearch ID before saving. See FIREBASE_SETUP.md for the current flow. No real Firebase responses or CloudResearch completions were submitted during these checks.

## Repairs made

- Rebuilt the stale image manifest against the current folder: 165 images, 81 male and 84 female. Exact `.jpg`, `.jpeg`, `.png` extensions and `+` characters are preserved.
- Synchronized the Firebase filename allowlist with those images.
- Updated the rebuild script to update both files and stop for incompatible counts or filename formats before writing them.
- Replaced string-multiplication conversions in two Firebase validation expressions with explicit number-to-string comparisons.
- Updated script version parameters in `index.html` so browsers request the new files.

## Verification evidence

Full local HTTP Chrome runs completed in both Male → Female and Female → Male orders. Each run loaded and decoded every image, entered all 165 answers through keyboard events using keys 1–7, and reached completion through the real survey timeline. No trial data was substituted in these full-run tests.

Checks passed for required consent/demographics, rejection of key 8, unique image presentation, visible question/scale, blank gray intervals of at least 1000 ms between consecutive images within blocks, no writes before explicit submission, failed-save withholding of the completion link, successful retry, recruitment URL ID capture, and the exact completion URL. Every rating is followed by a configured 1000 ms ITI, including the last rating in each block; block introductions add participant-controlled time between blocks.

Tested content viewports: 1366×625 and 1024×625. Image element height was 492 px in both; the visible image keeps its original aspect ratio. All 165 files also passed macOS image metadata checks. Total image download size: approximately 78.4 MiB. No images were compressed or changed.

Local rule-expression checks accepted each actual completed payload and rejected eight malformed payload cases, unauthenticated writes, and writes under another UID. **These checks use a local expression evaluator, not the Firebase rules compiler/emulator or deployed Firebase.** Actual Authentication settings, rules deployment, and backend acceptance remain unverified.

## Survey structure

1. Full consent text with mandatory affirmative consent checkbox.
2. Fixed mandatory demographics, one choice per question:
   - Age: 18–21, 22–30, 31–40, 41–60, 60+.
   - Gender identity: Male, Female.
   - Ethnicity: European; Middle Eastern; Black, African, or Caribbean; Chinese; Indian; Indigenous.
   - Area of study: STEM, Social Sciences, Humanities, Other.
   - Highest completed education: High school diploma; Attending post-secondary; Post-secondary degree; Graduate degree; Prefer not to say.
3. Instructions, fullscreen request, then image preloading. Failed image loading blocks progress.
4. Two blocks in random order, each with an introduction. Male block: 81 `M` images (41 `At`, 40 `Un`). Female block: 84 `F` images (44 `At`, 40 `Un`). All images are shuffled within their respective block and shown once.
5. Every trial shows one large image, “How attractive is this person?”, and the 1–7 scale together. 1 = Not at all attractive; 7 = Very attractive. A valid number key ends the trial; there is no response timeout. A blank gray 1000 ms interval follows.
6. Participant clicks **Submit responses**. Successful Firebase saving unlocks the thank-you page and CloudResearch completion link. Failure offers retry; an offline pending write waits for reconnection.

## Firebase

Project: `irp2-6d8c6`.
Realtime Database: `https://irp2-6d8c6-default-rtdb.firebaseio.com`.
Record location: `responses/<anonymous Firebase UID>/<session UUID>`.

Collected: affirmative consent and version/time; all five demographics; consent/demographic page response times; recruitment IDs from URL parameters; random session ID; study version; start/completion/server-save timestamps; block order; trial count; each image's filename/path/category, presentation and block positions, 1–7 rating, pressed key, and response time in milliseconds.

No study-response upload occurs before final submission. Closing/reloading before submission discards page-memory answers. There is no resume feature. Anonymous Firebase authentication begins at submission. Recruitment IDs can link records to platform accounts, so records are not fully anonymous. Analytics is not loaded despite the configured measurement ID.

Rules deny client reads and deletion, restrict writes to the authenticated user's UID, and validate the expected schema. They allow the owner to replace a session with another valid record for retries; they do not prevent repeated participation or guarantee that a client submitted genuine responses.

## CloudResearch Connect

Completion URL: `https://connect.cloudresearch.com/participant/project/1EC415FF2C/complete`.

The experiment captures `participantId`, `assignmentId`, and `projectId` from the incoming URL, plus optional `pid`, `workerId`, and `PROLIFIC_PID`. Missing values remain empty strings. Configure the Connect launch link to supply the IDs; collection is not mandatory in the code.

After a successful save, participants must click **Continue to CloudResearch**. The link opens a new tab; it is not an automatic redirect and does not itself approve payment. This check verified the exact configured URL without visiting the completion endpoint. Project activity, payment, and completion credit must be confirmed in Connect.

Official integration guidance: https://connect-researcher-help.cloudresearch.com/hc/en-us/articles/21181529476500-How-to-Integrate-your-Survey-with-Connect
Firebase rule reference: https://firebase.google.com/docs/reference/security/database

## Before participant recruitment

- Publish the latest `database.rules.json`, enable Firebase Anonymous Authentication, and deploy the updated site/assets over HTTPS. Exclude `tests/` from the participant deployment.
- Run one full hosted pilot through the Connect preview/test workflow. Confirm the saved Firebase record contains all 165 trials and the expected Connect ID, then confirm the completion link credits the correct Connect project.
- Consent duration/payment have since been updated to **12 minutes** and **$2.00 USD**.
- Requested age choices overlap at 60 (`41–60` and `60+`). Review which boundary you intend; changing labels also requires updating Firebase rules.
- Consent wording allows refusal of individual questions, while the implemented flow requires answers to continue. It also describes immediate destruction upon withdrawal; the application implements non-upload before submission, but no participant deletion mechanism after submission. Review these statements against your intended study procedure with the study team.

Re-run the manifest builder and final checks whenever images change. The tested local files are not a guarantee that a later deployment contains the same assets or rules.
