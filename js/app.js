// Reda: router, chrome (top bar + tab bar), theme, onboarding.
import { prefs } from './store.js';
import { t } from './i18n.js';
import { esc, icon, $ } from './ui.js';
import { renderToday, renderLog, todayIso } from './views/today.js';
import { renderPattern } from './views/pattern.js';
import { renderTests, renderTest, renderLook, stopTimer } from './views/tests.js';
import { renderCare } from './views/care.js';
import { renderReport, renderSettings, loadDemo } from './views/report.js';

const TABS = [
  { route: '', key: 'tabToday', icon: 'today' },
  { route: 'pattern', key: 'tabPattern', icon: 'pattern' },
  { route: 'tests', key: 'tabTests', icon: 'tests' },
  { route: 'care', key: 'tabCare', icon: 'care' },
];

function applyTheme() {
  const { theme, lang } = prefs.get();
  const dark = theme === 'dark' || (theme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.lang = lang;
  $('meta[name="theme-color"]').setAttribute('content', dark ? '#171513' : '#f6f1ea');
}

function chrome(route) {
  const top = route.split('/')[0];
  $('#topbar').innerHTML = `
    <a class="brand" href="#/" aria-label="Reda">
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--accent)"/><circle cx="11" cy="17" r="3.6" fill="var(--welt-1)"/><circle cx="18.5" cy="13" r="2.6" fill="var(--welt-1)" opacity=".8"/><circle cx="23" cy="19" r="1.7" fill="var(--welt-1)" opacity=".6"/></svg>
      <span>Reda</span>
    </a>
    <a class="icon-btn" href="#/settings" aria-label="${esc(t('settings'))}">${icon('gear')}</a>`;
  $('#tabbar').innerHTML = TABS.map((tab) => {
    const active = top === tab.route || (tab.route === '' && top === 'log') || (tab.route === 'tests' && top === 'look') || (tab.route === 'pattern' && top === 'report');
    return `<a href="#/${tab.route}" class="${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''}>${icon(tab.icon, 22)}<span>${esc(t(tab.key))}</span></a>`;
  }).join('');
  $('.skip-link').textContent = t('skip');
}

function onboarding(main) {
  document.body.classList.add('no-tabs');
  main.innerHTML = `
    <div class="onboard">
      <svg class="onboard-mark" width="88" height="88" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="14" fill="var(--accent)"/><circle cx="11" cy="17" r="3.6" fill="var(--welt-1)"/><circle cx="18.5" cy="13" r="2.6" fill="var(--welt-1)" opacity=".8"/><circle cx="23" cy="19" r="1.7" fill="var(--welt-1)" opacity=".6"/></svg>
      <h1>${esc(t('obTitle'))}</h1>
      <p class="lead">${esc(t('obLead'))}</p>
      <ol class="ob-steps">
        <li>${esc(t('ob1'))}</li>
        <li>${esc(t('ob2'))}</li>
        <li>${esc(t('ob3'))}</li>
      </ol>
      <div class="seg lang-seg" role="group" aria-label="${esc(t('lang'))}">
        <label><input type="radio" name="ob-lang" value="id" ${prefs.get().lang === 'id' ? 'checked' : ''}><span>Bahasa Indonesia</span></label>
        <label><input type="radio" name="ob-lang" value="en" ${prefs.get().lang === 'en' ? 'checked' : ''}><span>English</span></label>
      </div>
      <button class="btn primary wide" id="ob-start">${esc(t('obStart'))}</button>
      <button class="btn ghost wide" id="ob-demo">${esc(t('obDemo'))}</button>
      <p class="muted small">${esc(t('obNote'))}</p>
    </div>`;
  main.querySelectorAll('input[name="ob-lang"]').forEach((input) => input.addEventListener('change', () => {
    prefs.set({ lang: input.value });
    route();
  }));
  $('#ob-start').addEventListener('click', () => {
    prefs.set({ onboarded: true });
    location.hash = '#/';
    route();
  });
  $('#ob-demo').addEventListener('click', () => {
    loadDemo();
    location.hash = '#/';
    route();
  });
}

function route() {
  stopTimer();
  applyTheme();
  const main = $('#main');
  const path = location.hash.replace(/^#\/?/, '');
  const [top, arg] = path.split('/');
  if (!prefs.get().onboarded) {
    $('#topbar').innerHTML = '';
    $('#tabbar').innerHTML = '';
    onboarding(main);
    return;
  }
  document.body.classList.remove('no-tabs');
  chrome(path);
  switch (top) {
    case 'log':
      renderLog(main, /^\d{4}-\d{2}-\d{2}$/.test(arg || '') && arg <= todayIso() ? arg : todayIso());
      break;
    case 'pattern':
      renderPattern(main);
      break;
    case 'tests':
      if (arg) renderTest(main, arg);
      else renderTests(main);
      break;
    case 'look':
      renderLook(main);
      break;
    case 'care':
      renderCare(main);
      break;
    case 'report':
      renderReport(main);
      break;
    case 'settings':
      renderSettings(main, route);
      break;
    default:
      renderToday(main);
  }
  main.focus({ preventScroll: true });
  window.scrollTo(0, 0);
}

// ?demo=1 loads example data once (for the live demo link and screenshots).
const params = new URLSearchParams(location.search);
if (params.get('demo') === '1' && !prefs.get().onboarded) loadDemo();
if (params.get('lang') === 'en' || params.get('lang') === 'id') prefs.set({ lang: params.get('lang') });

window.addEventListener('hashchange', route);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
route();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
