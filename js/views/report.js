// Doctor report (print-friendly) + settings.
import { entries as entryStore, plan as planStore, tests as testStore, prefs, exportAll, importAll, wipeAll } from '../store.js';
import { isoDate, addDays, dailyScore, uas7, rankFactors, latestTests, currentStep, demoEntries } from '../logic.js';
import { DRUGS, FACTOR_IDS, factorLabel, TESTS, SOURCES, PHOTOS, BAND_TEXT } from '../content.js';
import { t, L, lang, fmtDate } from '../i18n.js';
import { esc, icon, toast, download, $ } from '../ui.js';
import { trendChart } from './pattern.js';
import { bandPill } from './parts.js';

const RESULT_KEY = { positive: 'rPositive', negative: 'rNegative', unsure: 'rUnsure' };

function reportData(days = 28) {
  const today = isoDate(new Date());
  const from = addDays(today, -(days - 1));
  const all = entryStore.all();
  const inRange = Object.keys(all).filter((iso) => iso >= from && iso <= today).sort();
  const scores = inRange.map((iso) => dailyScore(all[iso])).filter((s) => s != null);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const angioDays = inRange.filter((iso) => all[iso].angio).length;
  const weeks = [0, 1, 2, 3].map((w) => ({ end: addDays(today, -7 * w), ...uas7(all, addDays(today, -7 * w)) })).reverse();
  const plan = planStore.get();
  const drug = plan && DRUGS.find((d) => d.id === plan.drug);
  const suspects = rankFactors(all, FACTOR_IDS).filter((row) => row.verdict === 'suspect' || row.verdict === 'maybe');
  const latest = latestTests(testStore.all());
  const notes = inRange.filter((iso) => all[iso].note).map((iso) => ({ iso, note: all[iso].note }));
  return { today, from, all, inRange, avg, angioDays, weeks, plan, drug, suspects, latest, notes };
}

function planLine(data) {
  if (!data.drug) return t('rNone');
  const extras = [data.plan.omalizumab ? 'omalizumab' : '', data.plan.ciclosporin ? 'ciclosporin' : ''].filter(Boolean).join(' + ');
  return `${data.drug.name} ${data.drug.dose} × ${data.plan.perDay}/hari${extras ? ' + ' + extras : ''} (step ${currentStep(data.plan)})`.replace('/hari', lang() === 'id' ? '/hari' : '/day');
}

function summaryText(data) {
  const lines = [
    `${t('reportTitle')} — ${t('reportRange', { a: fmtDate(data.from), b: fmtDate(data.today) })}`,
    `${t('rLogged')}: ${data.inRange.length}/28`,
    `${t('rAvg')}: ${data.avg == null ? '-' : data.avg.toFixed(1)}/6`,
    `UAS7: ${data.weeks.map((w) => (w.complete ? w.sum : `(${w.logged}/7)`)).join(' → ')}`,
    `${t('rAngio')}: ${data.angioDays}`,
    `${t('rPlan')}: ${planLine(data)}`,
    `${t('rFactors')}: ${data.suspects.map((r) => factorLabel(r.factorId, lang())).join(', ') || '-'}`,
    `${t('rTests')}: ${TESTS.filter((x) => data.latest[x.id]).map((x) => `${L(x.name)} = ${t(RESULT_KEY[data.latest[x.id].result])}`).join('; ') || '-'}`,
    t('rDisclaimer'),
  ];
  return lines.join('\n');
}

function csv(data) {
  const rows = [['date', 'wheals', 'itch', 'uas', 'angioedema', 'doses', 'factors', 'foods', 'note']];
  for (const iso of Object.keys(data.all).sort()) {
    const e = data.all[iso];
    rows.push([iso, e.wheals, e.itch, dailyScore(e), e.angio ? 1 : 0, e.doses ?? '', (e.factors || []).join('|'), e.foods || '', e.note || '']);
  }
  return rows.map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
}

export function renderReport(main) {
  const data = reportData();
  main.innerHTML = `
    <div class="page report">
      <header class="page-head with-back no-print">
        <a class="icon-btn" href="#/pattern" aria-label="${esc(t('back'))}">${icon('back')}</a>
        <div><p class="eyebrow">${esc(t('tabPattern'))}</p><h1>${esc(t('reportTitle'))}</h1></div>
      </header>
      <div class="actions no-print">
        <button class="btn primary" id="print">${icon('print', 18)} ${esc(t('reportPrint'))}</button>
        <button class="btn ghost" id="copy">${icon('copy', 18)} ${esc(t('reportCopy'))}</button>
        <button class="btn ghost" id="csv">${icon('download', 18)} ${esc(t('reportCsv'))}</button>
      </div>
      <article class="card sheet">
        <h2 class="sheet-title">${esc(t('reportTitle'))}</h2>
        <p class="muted">${esc(t('reportRange', { a: fmtDate(data.from, { day: 'numeric', month: 'long', year: 'numeric' }), b: fmtDate(data.today, { day: 'numeric', month: 'long', year: 'numeric' }) }))}</p>
        <dl class="facts">
          <div><dt>${esc(t('rLogged'))}</dt><dd>${data.inRange.length}/28</dd></div>
          <div><dt>${esc(t('rAvg'))}</dt><dd>${data.avg == null ? '–' : data.avg.toFixed(1)}/6</dd></div>
          <div><dt>${esc(t('rAngio'))}</dt><dd>${data.angioDays}</dd></div>
          <div><dt>${esc(t('rPlan'))}</dt><dd>${esc(planLine(data))}</dd></div>
        </dl>
        <h3 class="sub">UAS7</h3>
        <table class="uas-table">
          <thead><tr>${data.weeks.map((w) => `<th>${esc(fmtDate(addDays(w.end, -6)))}–${esc(fmtDate(w.end))}</th>`).join('')}</tr></thead>
          <tbody><tr>${data.weeks.map((w) => `<td>${w.complete ? `<strong>${w.sum}</strong> ${bandPill(w.sum)}` : `<span class="muted">${w.logged}/7</span>`}</td>`).join('')}</tr></tbody>
        </table>
        ${trendChart(data.all, data.today, 8)}
        <h3 class="sub">${esc(t('rFactors'))}</h3>
        <p>${data.suspects.length ? data.suspects.map((r) => `${esc(factorLabel(r.factorId, lang()))} (${r.withMean.toFixed(1)} vs ${r.withoutMean.toFixed(1)})`).join(', ') : '–'}</p>
        <h3 class="sub">${esc(t('rTests'))}</h3>
        <p>${TESTS.filter((x) => data.latest[x.id]).map((x) => `${esc(L(x.name))}: <strong>${esc(t(RESULT_KEY[data.latest[x.id].result]))}</strong>`).join(' · ') || '–'}</p>
        ${data.notes.length ? `<h3 class="sub">${esc(t('rNotes'))}</h3><ul class="plain notes">${data.notes.map((n) => `<li><span class="muted">${esc(fmtDate(n.iso))}</span> ${esc(n.note)}</li>`).join('')}</ul>` : ''}
        <p class="muted small">${esc(t('rDisclaimer'))}</p>
      </article>
    </div>`;

  $('#print', main).addEventListener('click', () => window.print());
  $('#copy', main).addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(summaryText(data));
      toast(t('copied'));
    } catch {
      download('reda-ringkasan.txt', summaryText(data), 'text/plain');
    }
  });
  $('#csv', main).addEventListener('click', () => download(`reda-${data.today}.csv`, csv(data), 'text/csv'));
}

export function renderSettings(main, onChange) {
  const p = prefs.get();
  main.innerHTML = `
    <div class="page">
      <header class="page-head with-back">
        <a class="icon-btn" href="#/" aria-label="${esc(t('back'))}">${icon('back')}</a>
        <h1>${esc(t('settings'))}</h1>
      </header>
      <section class="card stack">
        <div class="field"><span>${esc(t('lang'))}</span>
          <div class="seg">
            <label><input type="radio" name="lang" value="id" ${p.lang === 'id' ? 'checked' : ''}><span>Bahasa Indonesia</span></label>
            <label><input type="radio" name="lang" value="en" ${p.lang === 'en' ? 'checked' : ''}><span>English</span></label>
          </div>
        </div>
        <div class="field"><span>${esc(t('theme'))}</span>
          <div class="seg">
            ${['auto', 'light', 'dark'].map((v) => `<label><input type="radio" name="theme" value="${v}" ${p.theme === v ? 'checked' : ''}><span>${esc(t(v === 'auto' ? 'themeAuto' : v === 'light' ? 'themeLight' : 'themeDark'))}</span></label>`).join('')}
          </div>
        </div>
      </section>
      <section class="card stack">
        <h2 class="card-title">${esc(t('backup'))}</h2>
        <button class="btn ghost" id="export">${icon('download', 18)} ${esc(t('exportJson'))}</button>
        <label class="btn ghost">${esc(t('importJson'))}<input type="file" accept="application/json,.json" id="import" hidden></label>
        <button class="btn ghost" id="demo">${esc(t('demo'))}</button>
        <button class="btn danger-outline" id="wipe">${esc(t('wipe'))}</button>
      </section>
      <section class="card">
        <h2 class="card-title">${esc(t('privacy'))}</h2>
        <p>${esc(t('privacyBody'))}</p>
        <h2 class="card-title">${esc(t('about'))}</h2>
        <p>${esc(t('aboutBody'))}</p>
        <h3 class="sub">${esc(t('sources'))}</h3>
        <ul class="plain links">${SOURCES.map((s) => `<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.label)}</a></li>`).join('')}</ul>
        <h3 class="sub">${esc(t('credits'))}</h3>
        <ul class="plain links small">${Object.values(PHOTOS).map((ph) => `<li><a href="${ph.page}" target="_blank" rel="noopener">${esc(ph.author)}</a> · ${esc(ph.license)}</li>`).join('')}</ul>
        <p class="muted small">Reda v1.0.0 · MIT · <a href="https://github.com/juw12/reda" target="_blank" rel="noopener">github.com/juw12/reda</a></p>
      </section>
    </div>`;

  main.querySelectorAll('input[name="lang"], input[name="theme"]').forEach((input) => {
    input.addEventListener('change', () => {
      prefs.set({ [input.name]: input.value });
      onChange();
    });
  });
  $('#export', main).addEventListener('click', async () => {
    const data = await exportAll();
    download(`reda-backup-${isoDate(new Date())}.json`, JSON.stringify(data));
  });
  $('#import', main).addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      await importAll(JSON.parse(await file.text()));
      toast(t('imported'));
      onChange();
    } catch {
      toast(t('badFile'));
    }
  });
  $('#demo', main).addEventListener('click', () => {
    loadDemo();
    toast(t('demoDone'));
    location.hash = '#/';
  });
  $('#wipe', main).addEventListener('click', async () => {
    if (!confirm(t('wipeConfirm'))) return;
    await wipeAll();
    toast(t('wiped'));
    location.hash = '#/';
    onChange();
  });
}

export function loadDemo() {
  const today = isoDate(new Date());
  entryStore.replace(demoEntries(today));
  planStore.set({ drug: 'cetirizine', perDay: 1, doctorOk: true, since: addDays(today, -13), omalizumab: false, ciclosporin: false });
  testStore.replace([
    { test: 'dermo', result: 'positive', at: Date.now() - 5 * 86400000 },
    { test: 'cold', result: 'negative', at: Date.now() - 4 * 86400000 },
  ]);
  prefs.set({ onboarded: true });
}

export { BAND_TEXT };
