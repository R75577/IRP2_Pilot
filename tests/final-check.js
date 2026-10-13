(async () => {
  const checks = [];
  const assert = (ok, label) => { if (!ok) throw Error(label); checks.push(label); };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const until = async predicate => {
    for (let i = 0; i < 300; i++) { if (predicate()) return; await wait(100); }
    throw Error('Timed out: ' + predicate.toString());
  };
  const press = key => {
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    document.body.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true }));
  };
  try {
    await until(() => document.querySelector('form'));
    let form = document.querySelector('form');
    assert(!form.checkValidity(), 'Consent required');
    form.querySelector('[name=consent]').checked = true; form.requestSubmit();
    await wait(20); form = document.querySelector('form');
    assert(!form.checkValidity(), 'Demographics required');
    Object.keys(DEMOGRAPHICS).forEach(name => { form.querySelector(`[name=${name}]`).checked = true; });
    form.requestSubmit(); await wait(20);
    document.querySelector('#jspsych-instructions-next').click(); await wait(20);
    document.querySelector('#jspsych-fullscreen-btn').click();
    await until(() => document.querySelector('#jspsych-instructions-next'));
    assert(true, 'All 165 images preloaded');
    const seen = [], sizes = [], intervals = [];
    let lastAnswer = null;
    for (let i = 0; i < files.length; i++) {
      const intro = document.querySelector('#jspsych-instructions-next');
      if (intro) intro.click();
      await until(() => document.querySelector('.rating'));
      if (lastAnswer !== null && ratingTrials[i].data.block === ratingTrials[i-1].data.block) intervals.push(performance.now()-lastAnswer);
      const img = document.querySelector('.stimulus-image');
      assert(img.complete && img.naturalWidth > 0, 'Decoded image ' + ratingTrials[i].data.filename);
      seen.push(img.getAttribute('src'));
      const rect = document.querySelector('.rating-panel').getBoundingClientRect();
      if (!(rect.top >= 0 && rect.bottom <= innerHeight + 1)) throw Error('Question/scale clipped');
      sizes.push(img.getBoundingClientRect().height);
      if (i === 0) { press('8'); await wait(20); assert(!!document.querySelector('.rating'), 'Key 8 rejected'); }
      press(String(i % 7 + 1)); lastAnswer = performance.now();
      await wait(20);
      if (document.body.className !== 'iti-mode' || document.querySelector('.jspsych-content').textContent.trim()) throw Error('ITI is not blank');
      if (getComputedStyle(document.body).backgroundColor !== 'rgb(128, 128, 128)') throw Error('ITI is not gray');
      await wait(990);
    }
    assert(new Set(seen).size === 165, 'All images shown once');
    assert(intervals.every(ms => ms >= 1000), 'Within-block intervals at least 1000ms');
    assert(testWrites.length === 0 && saveAttempts === 0, 'No upload before explicit submission');
    assert(jsPsych.data.get().filter({phase:'rating'}).values().length === 165, '165 actual keyboard responses recorded');
    await until(() => document.querySelector('#cloudresearch-id'));
    form = document.querySelector('form');
    const idInput = document.querySelector('#cloudresearch-id');
    assert(!form.checkValidity(), 'Empty CloudResearch ID blocked');
    idInput.value = '   '; idInput.dispatchEvent(new Event('input'));
    assert(!form.checkValidity(), 'Whitespace-only CloudResearch ID blocked');
    assert(!document.querySelector('a[href*="/complete"]') && saveAttempts === 0, 'No save or completion link before ID');
    idInput.value = '  ENTERED_TEST_ID  '; idInput.dispatchEvent(new Event('input'));
    assert(form.checkValidity(), 'Entered CloudResearch ID accepted');
    form.requestSubmit();
    await until(() => document.querySelector('#retry-save') && !document.querySelector('#retry-save').hidden);
    assert(!document.querySelector('a[href*="/complete"]'), 'Failed save blocks completion link');
    document.querySelector('#retry-save').click();
    await until(() => document.querySelector('a[href*="/complete"]'));
    assert(saveAttempts === 2 && testWrites.length === 1, 'Save retry succeeds with one saved record');
    assert(document.querySelector('a').href === 'https://connect.cloudresearch.com/participant/project/04018061B0/complete', 'Correct CloudResearch completion link');
    const payload = testWrites[0].payload;
    assert(payload.recruitment.participantId === 'FINAL_TEST' && payload.recruitment.assignmentId === 'ASSIGN_TEST' && payload.recruitment.projectId === 'PROJECT_TEST', 'CloudResearch URL IDs preserved');
    assert(payload.recruitment.cloudresearch_id === 'ENTERED_TEST_ID', 'Typed ID saved separately and trimmed');
    assert(payload.block_order.join(',') === blockOrder.join(','), 'Block order saved');
    // Evaluate local rule expressions against real output. This is a schema test,
    // not the Firebase emulator and not proof of deployed Firebase behavior.
    const rules = await (await fetch('database.rules.json')).json();
    String.prototype.matches = function(regex) { return regex.test(String(this)); };
    class Snapshot {
      constructor(root, path=[]) { this.root=root; this.path=path; }
      val() { return this.path.reduce((value,key)=>value?.[key],this.root) ?? null; }
      child(path) { return new Snapshot(this.root,this.path.concat(path.split('/'))); }
      parent() { return new Snapshot(this.root,this.path.slice(0,-1)); }
      exists() { return this.val() !== null; }
      isString() { return typeof this.val()==='string'; }
      isNumber() { return typeof this.val()==='number'; }
      hasChildren(keys) { return keys.every(key=>this.child(key).exists()); }
    }
    const schema=rules.rules.responses.$uid.$session;
    const evaluate=(expression,snap,auth,trial)=>{
      if(typeof expression==='boolean') return expression;
      // Firebase treats == and != as strict comparisons.
      expression=expression.replace(/(?<![=!])==(?!=)/g,'===').replace(/!=(?!=)/g,'!==');
      return Function('newData','auth','$uid','$session','$trial','now','return ('+expression+');')(snap,auth,'test-user',sessionId,trial,1791800000000);
    };
    const valid=(value,auth={uid:'test-user'})=>{
      const root=new Snapshot(value);
      if(!evaluate(schema['.write'],root,auth)) return false;
      const walk=(node,snap,trial)=>{
        if(node['.validate']!==undefined && !evaluate(node['.validate'],snap,auth,trial)) return false;
        if(snap.val() && typeof snap.val()==='object') return Object.keys(snap.val()).every(key=>{
          let rule=node[key],nextTrial=trial;
          if(!rule) { const wildcard=Object.keys(node).find(k=>k.startsWith('$')); rule=node[wildcard]; if(wildcard==='$trial') nextTrial=key; }
          return rule && walk(rule,snap.child(key),nextTrial);
        });
        return true;
      };
      return walk(schema,root);
    };
    assert(valid(payload),'Local rule expressions accept complete payload');
    assert(!valid(payload,null) && !valid(payload,{uid:'other'}),'Local authorization rejects unauthenticated and other-user writes');
    const invalidCases = [
      p=>{delete p.recruitment.cloudresearch_id;}, p=>{p.recruitment.cloudresearch_id='   ';},
      p=>{p.consent.agreed=false;}, p=>{delete p.demographics.age;},
      p=>{p.trials['001'].rating=8;}, p=>{delete p.trials['165'];},
      p=>{p.trials['001'].filename='missing.jpeg';}, p=>{p.trials['001'].response_key='7'; p.trials['001'].rating=1;},
      p=>{p.extra='unexpected';}, p=>{p.trials['001'].trial_number=2;}
    ];
    invalidCases.forEach((mutate,i)=>{const p=structuredClone(payload);mutate(p);assert(!valid(p),'Local rules reject malformed payload '+(i+1));});
    const summary = ['PASS', 'Block order: '+blockOrder.join(' → '), 'Viewport: '+innerWidth+'×'+innerHeight,
      'Smallest image element height: '+Math.round(Math.min(...sizes))+'px', ...checks.filter(c=>!c.startsWith('Decoded image'))];
    document.body.innerHTML='<pre id="result"></pre>';
    document.querySelector('#result').textContent=summary.join('\n');
  } catch(error) {
    document.body.innerHTML='<pre id="result"></pre>';
    document.querySelector('#result').textContent='FAIL: '+error.message+'\n'+checks.filter(c=>!c.startsWith('Decoded image')).join('\n');
  }
})();
