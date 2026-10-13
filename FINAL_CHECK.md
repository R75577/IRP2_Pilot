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

Completion URL: `https://connect.cloudresearch.com/participant/project/04018061B0/complete`.

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
