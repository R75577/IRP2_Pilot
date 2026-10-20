/* Fixed consent/demographics, then randomized blocks and keyboard ratings.
 * Study responses stay in memory until the participant submits at the end. */
'use strict';
const CLIENT_VERSION = 'emotion-v6';
const CONSENT_VERSION = '2026-10-20-v4';
const CLOUDRESEARCH_COMPLETION_URL = 'https://connect.cloudresearch.com/participant/project/1EC415FF2C/complete';
const DEMOGRAPHICS = {
  age: { label: 'Age', options: ['18-21', '22-30', '31-40', '41-60', '60+'] },
  gender: { label: 'Gender Identity', options: ['Male', 'Female'] },
  ethnicity: { label: 'Ethnicity', options: ['European', 'Middle Eastern', 'Black, African, or Caribbean', 'Chinese', 'Indian', 'Indigenous'] },
  area_of_study: { label: 'Area of study', options: ['STEM', 'Social Sciences', 'Humanities', 'Other'] },
  education: { label: 'Highest level of education completed', options: ['High school diploma', 'Attending post-secondary', 'Post-secondary degree', 'Graduate degree', 'Prefer not to say'] }
};
const jsPsych = initJsPsych({ show_progress_bar: false });
const sessionId = crypto.randomUUID();
const params = new URLSearchParams(location.search);
const recruitment = Object.fromEntries(['pid', 'workerId', 'PROLIFIC_PID', 'participantId', 'assignmentId', 'projectId']
  .map(key => [key, params.get(key) || '']));
const startedAt = Date.now();
let consentRecord, demographicsRecord, savePromise, savePayload, responseRef;
const beforeUnloadHandler = event => { event.preventDefault(); event.returnValue = ''; };
window.addEventListener('beforeunload', beforeUnloadHandler);
function mode(name = '') { document.body.className = name; }
function page(html, button = 'Continue') {
  return { type: jsPsychInstructions, pages: [`<div class="page">${html}</div>`],
    show_clickable_nav: true, allow_keys: false, button_label_next: button,
    on_load: () => mode() };
}
const consent = {
  type: jsPsychSurveyHtmlForm,
  preamble: `<div class="page consent-copy">${window.CONSENT_HTML}</div>`,
  html: `<label class="option"><input type="checkbox" name="consent" value="agree" required>
    I Agree — I have read the information above and agree to participate in this study.</label>
    <p>You must check the consent box to continue. If you do not agree, you may close this page.</p>`,
  button_label: 'Continue to demographic questions',
  on_load: () => mode(),
  on_finish: data => {
    if (data.response.consent !== 'agree') throw new Error('Consent is required.');
    consentRecord = { agreed: true, version: CONSENT_VERSION, agreed_at: Date.now(), rt_ms: data.rt };
  }
};
const demographics = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<div class="page"><h2>Demographic questions</h2><p>All questions are required. Select one answer for each question.</p></div>',
  html: '<div class="demographics">' + Object.entries(DEMOGRAPHICS).map(([name, question]) =>
    `<fieldset><legend>${question.label} *</legend>` + question.options.map(value =>
      `<label class="option"><input type="radio" name="${name}" value="${value}" required>${value}</label>`).join('') + '</fieldset>'
  ).join('') + '</div>',
  button_label: 'Continue',
  on_finish: data => {
    for (const [name, question] of Object.entries(DEMOGRAPHICS)) {
      if (!question.options.includes(data.response[name])) throw new Error('All demographics are required.');
    }
    demographicsRecord = { ...data.response, rt_ms: data.rt };
  }
};
const files = window.IMAGE_FILES;
if (!Array.isArray(files) || new Set(files).size !== files.length ||
    !files.every(file => /^[MF]_[A-Za-z0-9_+]+\.(jpeg|jpg|png)$/.test(file))) {
  throw new Error('Invalid image manifest. Regenerate image-manifest.js.');
}
const blockOrder = jsPsych.randomization.shuffle(['Male', 'Female']);
let trialNumber = 0;
const ratingTrials = [];
const EMOTIONS = { b: 'angry', n: 'neutral', m: 'happy' };
function makeImageTrial(block, filename, blockIndex, withinBlockIndex, practice = false) {
  const imagePath = `all_images/${filename}`;
  const metadata = { phase: practice ? 'practice' : 'rating',
    trial_number: practice ? withinBlockIndex : ++trialNumber, block, block_index: blockIndex,
    within_block_index: withinBlockIndex, image: imagePath, filename,
    image_category: filename.split('_')[1] };
  let classification;
  const display = panel => `<div class="rating"><div class="image-wrap"><img class="stimulus-image" src="${imagePath}" alt="Face to rate"></div>
    <div class="rating-panel">${practice ? `<p>Practice ${withinBlockIndex} of 4</p>` : ''}${panel}</div></div>`;
  const categorize = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: display('<h2 class="classification-question">Angry, neutral or happy?</h2><p class="classification-keys">Press <strong>B</strong> for ANGRY, <strong>N</strong> for NEUTRAL, or <strong>M</strong> for HAPPY.</p>'),
    choices: ['b', 'n', 'm'], response_ends_trial: true,
    data: { ...metadata, phase: practice ? 'practice_classification' : 'classification' },
    on_load: () => mode('rating-mode'),
    on_finish: data => {
      classification = { selected_emotion: EMOTIONS[data.response.toLowerCase()],
        classification_key: data.response.toLowerCase(), classification_rt_ms: data.rt };
      Object.assign(data, classification);
    }
  };
  const rating = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: () => display(`<h2>How ${classification.selected_emotion} does the face appear?</h2>
      <div class="scale" aria-label="1 means not at all ${classification.selected_emotion}; 7 means very ${classification.selected_emotion}">
      <span>1<small>Not at all ${classification.selected_emotion}</small></span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7<small>Very ${classification.selected_emotion}</small></span></div>
      <p>Press a number key from 1 to 7.</p>`),
    choices: ['1', '2', '3', '4', '5', '6', '7'], response_ends_trial: true,
    data: metadata,
    on_load: () => mode('rating-mode'),
    on_finish: data => { data.rating = Number(data.response); Object.assign(data, classification); }
  };
  if (!practice) ratingTrials.push(rating);
  return { timeline: [categorize, rating] };
}
function makeITI() {
  return { type: jsPsychHtmlKeyboardResponse, stimulus: '', choices: 'NO_KEYS',
    trial_duration: 1000, response_ends_trial: false, data: { phase: 'iti' },
    on_load: () => mode('iti-mode') };
}
const timeline = [consent, demographics,
  page('<div class="study-instructions"><h2>Instructions</h2><p>For each image you are to determine <strong>whether the face is angry, neutral or happy</strong>. You will do so by using your keyboard. Press <strong>B</strong> for angry, <strong>N</strong> for neutral, <strong>M</strong> for happy.</p><p>You will also be asked to rate how strongly the face appears to show your selected emotion using a number key from <strong>1 (not at all)</strong> to <strong>7 (very)</strong>. The face stays visible with each question. After each completed rating, a blank gray screen will appear for one second.</p><p>You will first complete four practice trials. Practice responses are not included in your study results.</p><p>Please use a computer with a keyboard. You may stop before submitting by closing this page; your study responses will not be uploaded.</p></div>'),
  { type: jsPsychFullscreen, fullscreen_mode: true },
  { type: jsPsychPreload, images: files.map(file => `all_images/${file}`), continue_after_error: false, show_detailed_errors: true,
    error_message: 'Some images could not load. Please check your connection and reload the study.' }
];
const practiceFiles = jsPsych.randomization.shuffle(files).slice(0, 4);
practiceFiles.forEach((file, index) => timeline.push(
  makeImageTrial(file.startsWith('M') ? 'Male' : 'Female', file, 0, index + 1, true), makeITI()));
blockOrder.forEach((block, blockIndex) => {
  const prefix = block === 'Male' ? 'M' : 'F';
  const blockFiles = jsPsych.randomization.shuffle(files.filter(file => file.startsWith(prefix)));
  if (!blockFiles.length) throw new Error(`No images in ${block} block.`);
  timeline.push(page(`<h2>${block} Images</h2><p>Please view and rate the following ${block.toLowerCase()} images.</p>`));
  blockFiles.forEach((file, index) => timeline.push(makeImageTrial(block, file, blockIndex + 1, index + 1), makeITI()));
});
// Explicit submission preserves the option to withdraw without uploading responses.
const cloudResearchId = {
  type: jsPsychSurveyHtmlForm,
  preamble: '<div class="page"><h2>Ratings complete</h2><p>Please enter your CloudResearch Connect ID. This is required before you can submit your responses and receive the completion link.</p></div>',
  html: `<label for="cloudresearch-id">CloudResearch Connect ID *</label>
    <p><input id="cloudresearch-id" name="cloudresearch_id" type="text" required maxlength="128" autocomplete="off" spellcheck="false" aria-describedby="cloudresearch-id-help"></p>
    <p id="cloudresearch-id-help">Enter your participant ID from your CloudResearch Connect account.</p>
    <p>Click Submit responses to save your ID and study responses. To withdraw without submitting, close this page.</p>`,
  button_label: 'Submit responses',
  on_load: () => {
    mode();
    const input = document.getElementById('cloudresearch-id');
    const validate = () => input.setCustomValidity(input.value.trim() ? '' : 'Please enter your CloudResearch Connect ID.');
    input.addEventListener('input', validate);
    validate();
  },
  on_finish: data => {
    const id = data.response.cloudresearch_id.trim();
    if (!id || id.length > 128) throw new Error('CloudResearch ID is required.');
    recruitment.cloudresearch_id = id;
  }
};
timeline.push(cloudResearchId);
async function finalSave() {
  if (!savePayload) {
    const rows = jsPsych.data.get().filter({ phase: 'rating' }).values();
    if (!consentRecord?.agreed || !demographicsRecord || !recruitment.cloudresearch_id?.trim() || rows.length !== files.length ||
        rows.some(row => !Number.isInteger(row.rating) || row.rating < 1 || row.rating > 7 || EMOTIONS[row.classification_key] !== row.selected_emotion ||
          !Number.isFinite(row.classification_rt_ms) || row.classification_rt_ms < 0)) {
      throw new Error('Incomplete study responses.');
    }
    savePayload = { client_version: CLIENT_VERSION, session_id: sessionId,
      started_at: startedAt, completed_at: Date.now(), saved_at: firebase.database.ServerValue.TIMESTAMP,
      consent: consentRecord, demographics: demographicsRecord, recruitment,
      block_order: blockOrder, trial_count: rows.length,
      trials: Object.fromEntries(rows.map(row => [String(row.trial_number).padStart(3, '0'), {
        trial_number: row.trial_number, block: row.block, block_index: row.block_index,
        within_block_index: row.within_block_index, image: row.image, filename: row.filename,
        image_category: row.image_category, selected_emotion: row.selected_emotion,
        classification_key: row.classification_key, classification_rt_ms: row.classification_rt_ms, rating: row.rating, response_key: row.response, rt_ms: row.rt
      }])) };
  }
  if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
  const auth = firebase.auth();
  // Firebase authentication starts only when the participant submits.
  if (!auth.currentUser) await auth.signInAnonymously();
  if (!responseRef) responseRef = firebase.database().ref(`responses/${auth.currentUser.uid}/${sessionId}`);
  await responseRef.set(savePayload);
}
const saveGate = {
  type: jsPsychHtmlKeyboardResponse, choices: 'NO_KEYS',
  stimulus: '<div class="page"><h2>Saving your responses…</h2><p id="save-status" role="status">Please keep this page open until saving finishes.</p><button class="jspsych-btn" id="retry-save" hidden>Retry saving</button></div>',
  on_load: () => {
    mode();
    const status = document.getElementById('save-status');
    const retry = document.getElementById('retry-save');
    const attempt = () => {
      if (savePromise) return;
      retry.hidden = true;
      status.textContent = 'Saving your responses… Please keep this page open.';
      const slowNotice = setTimeout(() => {
        status.textContent = 'Saving is taking longer than expected. Check your connection and keep this page open; saving will continue automatically.';
      }, 15000);
      savePromise = finalSave().then(() => {
        window.removeEventListener('beforeunload', beforeUnloadHandler);
        jsPsych.finishTrial();
      }).catch(error => {
        console.error('Save failed:', error.code || error.message);
        const code = typeof error.code === 'string' ? error.code : 'save-error';
        status.textContent = 'Your responses have not been confirmed saved. Keep this page open to retain your answers. Please retry or report this error to the researcher: ' + code + '.';
        retry.hidden = false;
      }).finally(() => { clearTimeout(slowNotice); savePromise = null; });
    };
    retry.addEventListener('click', attempt);
    attempt();
  }
};
timeline.push(saveGate, { type: jsPsychHtmlKeyboardResponse, choices: 'NO_KEYS',
  stimulus: `<div class="page"><h2>Thank you!</h2><p>Your responses have been recorded.</p><a class="jspsych-btn" href="${CLOUDRESEARCH_COMPLETION_URL}" target="_blank" rel="noopener noreferrer">Continue to CloudResearch</a></div>`,
  on_load: () => mode() });
jsPsych.run(timeline);
