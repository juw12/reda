"""Reda test suite: logic unit tests + browser smoke flows + layout gates.

Run:  python tests/run_tests.py            (from the repo root)
      python tests/run_tests.py --shots    (also save screenshots to docs/shots/)
Needs: playwright (pip install playwright; it falls back to installed Chrome/Edge).
"""
import functools
import http.server
import json
import os
import socketserver
import sys
import threading
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SHOTS = ROOT / "docs" / "shots"
for key in ("HTTP_PROXY", "HTTPS_PROXY", "http_proxy", "https_proxy"):
    os.environ.pop(key, None)
os.environ["NO_PROXY"] = "*"

results = []


def check(name, ok, detail=""):
    results.append({"name": name, "ok": bool(ok), "detail": str(detail)[:300]})
    mark = "PASS" if ok else "FAIL"
    print(f"[{mark}] {name}" + (f" :: {detail}" if detail and not ok else ""))


def serve():
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args):
            pass

    handler = functools.partial(Quiet, directory=str(ROOT))
    server = socketserver.ThreadingTCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server, f"http://127.0.0.1:{server.server_address[1]}"


TIMEOUT_MS = 120000  # this PC is often shared with other heavy jobs


def launch(p):
    for kwargs in ({}, {"channel": "chrome"}, {"channel": "msedge"}):
        try:
            browser = p.chromium.launch(**kwargs)
            original = browser.new_context

            def new_context(**options):
                context = original(**options)
                context.set_default_timeout(TIMEOUT_MS)
                return context

            browser.new_context = new_context
            return browser
        except Exception:  # try the next browser
            continue
    raise RuntimeError("no chromium browser available")


LOGIC_JS = """
async () => {
  const m = await import('/js/logic.js');
  const out = {};
  const today = '2026-11-10';
  out.daily = [m.dailyScore({wheals: 2, itch: 3}), m.dailyScore({wheals: 9, itch: -1}), m.dailyScore({})];
  const full = {};
  for (let i = 0; i < 7; i++) full[m.addDays(today, -i)] = {wheals: 1, itch: 2, factors: []};
  out.uasFull = m.uas7(full, today);
  const gap = {...full}; delete gap[m.addDays(today, -3)];
  out.uasGap = m.uas7(gap, today);
  out.bands = [0, 1, 6, 7, 15, 16, 27, 28, 42].map((s) => m.band(s).id);
  // Trigger: factor x present on 5 days with score 6, absent on 5 days with score 1.
  const trig = {};
  for (let i = 0; i < 10; i++) trig[m.addDays(today, -i)] = i < 5 ? {wheals: 3, itch: 3, factors: ['x']} : {wheals: 0, itch: 1, factors: []};
  out.suspect = m.factorStats(trig, 'x').verdict;
  const few = {[today]: {wheals: 3, itch: 3, factors: ['y']}, [m.addDays(today, -1)]: {wheals: 0, itch: 0, factors: []}};
  out.moreData = m.factorStats(few, 'y').verdict;
  const flat = {};
  for (let i = 0; i < 10; i++) flat[m.addDays(today, -i)] = {wheals: 1, itch: 1, factors: i % 2 ? ['z'] : []};
  out.noLink = m.factorStats(flat, 'z').verdict;
  // Next-day (lag 1) effect: food on day d, flare on d+1.
  const lag = {};
  for (let i = 0; i < 12; i++) {
    const has = i % 3 === 0;
    lag[m.addDays(today, -i)] = {wheals: 0, itch: 0, factors: [], foods: has ? 'udang' : 'nasi'};
  }
  for (let i = 0; i < 12; i++) if (i % 3 === 0 && i > 0) { const d = m.addDays(today, -(i - 1)); lag[d].wheals = 3; lag[d].itch = 3; }
  const lagStats = m.factorStats(lag, 'food:udang', 1);
  out.lag = [lagStats.verdict, m.factorStats(lag, 'food:udang', 0).verdict];
  out.foods = m.foodTokens({foods: 'Nasi, Udang ;sambal\\n a'});
  out.steps = [m.currentStep(null), m.currentStep({drug: 'c', perDay: 1}), m.currentStep({drug: 'c', perDay: 3}), m.currentStep({drug: 'c', perDay: 4, omalizumab: true}), m.currentStep({drug: 'c', ciclosporin: true})];
  const bad = {};
  for (let i = 0; i < 7; i++) bad[m.addDays(today, -i)] = {wheals: 2, itch: 2, factors: []};
  out.advNext = m.stepAdvice({plan: {drug: 'c', perDay: 1, since: m.addDays(today, -20)}, entries: bad, todayIso: today}).code;
  out.advWait = m.stepAdvice({plan: {drug: 'c', perDay: 1, since: m.addDays(today, -5)}, entries: bad, todayIso: today}).code;
  out.advUp = m.stepAdvice({plan: {drug: 'c', perDay: 2, doctorOk: false, since: m.addDays(today, -20)}, entries: bad, todayIso: today}).code;
  out.advNoPlan = m.stepAdvice({plan: null, entries: bad, todayIso: today}).code;
  out.advLog = m.stepAdvice({plan: {drug: 'c', perDay: 1, since: today}, entries: {}, todayIso: today});
  const good = {};
  for (let i = 0; i < 14; i++) good[m.addDays(today, -i)] = {wheals: 0, itch: 0, factors: []};
  out.advSteady = m.stepAdvice({plan: {drug: 'c', perDay: 1, since: m.addDays(today, -30)}, entries: good, todayIso: today}).code;
  out.emergency = [m.needsEmergency({throat: true}), m.needsEmergency({angio: true})];
  out.dates = [m.addDays('2026-02-28', 1), m.addDays('2026-01-01', -1), m.daysBetween('2026-10-01', '2026-11-10')];
  const demo = m.demoEntries(today);
  out.demoDays = Object.keys(demo).length;
  out.demoValid = Object.values(demo).every((e) => e.wheals >= 0 && e.wheals <= 3 && e.itch >= 0 && e.itch <= 3);
  return out;
}
"""


def logic_tests(page, base):
    page.goto(base + "/index.html")
    r = page.evaluate(LOGIC_JS)
    check("daily score sums and clamps", r["daily"] == [5, 3, None], r["daily"])
    check("UAS7 complete week = 21", r["uasFull"]["sum"] == 21 and r["uasFull"]["complete"], r["uasFull"]["sum"])
    check("UAS7 with a gap is not complete", not r["uasGap"]["complete"] and r["uasGap"]["logged"] == 6)
    check("UAS7 band edges", r["bands"] == ["free", "well", "well", "mild", "mild", "moderate", "moderate", "severe", "severe"], r["bands"])
    check("clear trigger flagged suspect", r["suspect"] == "suspect", r["suspect"])
    check("too few days -> more data", r["moreData"] == "more-data", r["moreData"])
    check("no difference -> no link", r["noLink"] == "no-link", r["noLink"])
    check("next-day food effect found at lag 1 only", r["lag"][0] == "suspect" and r["lag"][1] != "suspect", r["lag"])
    check("food tokens normalised", r["foods"] == ["food:nasi", "food:udang", "food:sambal"], r["foods"])
    check("treatment step mapping", r["steps"] == [0, 1, 2, 3, 4], r["steps"])
    check("uncontrolled after 14+ days -> next step", r["advNext"] == "next-step", r["advNext"])
    check("uncontrolled early -> wait", r["advWait"] == "wait", r["advWait"])
    check("up-dose without doctor flagged", r["advUp"] == "updose-unconfirmed", r["advUp"])
    check("no plan advice", r["advNoPlan"] == "no-plan")
    check("needs logs advice counts days", r["advLog"]["code"] == "log-more" and r["advLog"]["need"] == 7, r["advLog"])
    check("two good weeks -> steady", r["advSteady"] == "controlled-steady", r["advSteady"])
    check("emergency only for red flags", r["emergency"] == [True, False])
    check("date arithmetic", r["dates"] == ["2026-03-01", "2025-12-31", 40], r["dates"])
    check("demo data valid", r["demoDays"] >= 28 and r["demoValid"], r["demoDays"])


ROUTES = ["#/", "#/log", "#/pattern", "#/tests", "#/tests/dermo", "#/tests/cold", "#/tests/heat", "#/look", "#/care", "#/report", "#/settings"]


VIEWPORTS = ((390, 844, "phone"), (1280, 860, "desktop"))


def gates(browser, base, shots, viewports=VIEWPORTS):
    for width, height, label in viewports:
        context = browser.new_context(viewport={"width": width, "height": height})
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda exc: errors.append(str(exc)))
        page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
        page.goto(base + "/index.html?demo=1#/")
        page.wait_for_selector(".ribbon")
        overflow = []
        small_text = []
        for route in ROUTES:
            page.evaluate(f"location.hash = '{route}'")
            page.wait_for_timeout(350)
            if page.evaluate("document.documentElement.scrollWidth > window.innerWidth + 1"):
                overflow.append(route)
            tiny = page.evaluate("""() => [...document.querySelectorAll('body *')].filter(el => {
                if (!el.childNodes.length || ![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return false;
                const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
                return r.width > 0 && parseFloat(cs.fontSize) < 11.5 && !el.closest('svg');
            }).map(el => el.className || el.tagName).slice(0, 3)""")
            if tiny:
                small_text.append((route, tiny))
            if shots:
                SHOTS.mkdir(parents=True, exist_ok=True)
                name = route.replace("#/", "").replace("/", "-") or "today"
                target = str(SHOTS / f"{label}-{name}.png")
                try:
                    page.screenshot(path=target, full_page=True, animations="disabled", timeout=15000)
                except Exception:  # full-page capture can hang when the desktop is locked
                    page.screenshot(path=target, animations="disabled", timeout=15000)
        check(f"[{label}] no horizontal overflow", not overflow, overflow)
        check(f"[{label}] no text under 12px", not small_text, small_text)
        check(f"[{label}] no console/page errors", not errors, errors[:3])
        if label == "phone":
            page.evaluate("location.hash = '#/'")
            page.wait_for_timeout(200)
            taps = page.evaluate("""() => [...document.querySelectorAll('a, button, label.chip, .seg label, .choice')].filter(el => {
                const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 32 || r.width < 32);
            }).map(el => (el.textContent || el.className).trim().slice(0, 30))""")
            check("[phone] tap targets >= 32px on Today", not taps, taps[:5])
        context.close()


def flows(browser, base):
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.goto(base + "/index.html")
    check("onboarding shows on first open", page.locator(".onboard").is_visible())
    page.click("#ob-start")
    page.wait_for_selector(".checkin")
    check("today empty state offers log", page.locator(".checkin a.btn.primary").count() == 1)

    page.click(".checkin a.btn.primary")
    page.wait_for_selector("#log-form")
    page.click("button[type=submit]")
    check("save blocked without scores", page.locator("fieldset.need").count() == 1)
    page.click("input[name=wheals][value='2'] + .choice-body")
    page.click("input[name=itch][value='3'] + .choice-body")
    page.click("label.chip:has(input[value='heat'])")
    page.fill("input[name=foods]", "nasi, udang")
    page.click("button[type=submit]")
    page.wait_for_selector(".checkin.done")
    check("logged score shows 5/6", page.locator(".big-score").inner_text().startswith("5"), page.locator(".big-score").inner_text())
    check("ribbon shows today's welt", page.locator(".welt.s5").count() == 1)
    stored = page.evaluate("JSON.parse(localStorage.getItem('reda:v1:entries'))")
    entry = list(stored.values())[0]
    check("entry stored with factor and foods", entry["factors"] == ["heat"] and entry["foods"] == "nasi, udang", entry)

    page.evaluate("location.hash = '#/log'")
    page.wait_for_selector("#log-form")
    page.click("label.toggle:has(input[name=throat])")
    page.click("button[type=submit]")
    page.wait_for_selector(".card.emergency")
    check("red flag shows emergency banner", page.locator(".card.emergency a[href='tel:112']").count() == 1)

    page.evaluate("location.hash = '#/care'")
    page.wait_for_selector("#plan-form")
    page.select_option("select[name=drug]", "fexofenadine")
    page.click("#plan-form .seg label:has(input[value='2'])")
    check("up-dose warning appears", page.locator("#up-warn").is_visible())
    page.click("#plan-form button[type=submit]")
    page.wait_for_timeout(200)
    plan = page.evaluate("JSON.parse(localStorage.getItem('reda:v1:plan'))")
    check("plan saved", plan and plan["drug"] == "fexofenadine" and plan["perDay"] == 2, plan)
    check("ladder marks step 2", page.locator(".rung.here .rung-n").inner_text() == "2")

    page.evaluate("location.hash = '#/'")
    page.wait_for_selector(".dose")
    page.click("[data-dose='1']")
    page.wait_for_timeout(150)
    check("dose tap records 1 tablet", page.locator("[data-dose='1'].on").count() == 1)

    page.evaluate("location.hash = '#/tests/dermo'")
    page.wait_for_selector(".ref img")
    page.wait_for_function("[...document.querySelectorAll('.ref img')].every(i => i.complete && i.naturalWidth > 0)")
    check("reference photos load", page.locator(".ref img").count() == 2)
    check("photo credit shown", "Wikimedia Commons" in page.locator(".credit").first.inner_text())
    page.click("#timer-start")
    page.wait_for_timeout(1300)
    check("timer counts down", page.locator("#timer-clock").inner_text() != "10:00", page.locator("#timer-clock").inner_text())
    page.click("[data-result='positive']")
    page.wait_for_timeout(150)
    check("test result saved", "r-positive" in page.locator("#last-result").inner_html())

    page.evaluate("location.hash = '#/look'")
    page.wait_for_function("[...document.querySelectorAll('.ref img')].length === 5 && [...document.querySelectorAll('.ref img')].every(i => i.complete && i.naturalWidth > 0)")
    check("hives vs angioedema gallery loads 5 photos", True)

    page.evaluate("location.hash = '#/settings'")
    page.wait_for_selector("input[name=lang]")
    page.click(".seg label:has(input[value='en'])")
    page.wait_for_timeout(200)
    check("language switch to English", "Today" in page.locator(".tabbar").inner_text())
    page.click(".seg label:has(input[value='dark'])")
    page.wait_for_timeout(100)
    check("dark theme applies", page.evaluate("document.documentElement.dataset.theme") == "dark")
    check("no page errors in flows", not errors, errors[:3])
    context.close()

    # Demo dataset: patterns + report.
    context = browser.new_context(viewport={"width": 390, "height": 844})
    page = context.new_page()
    page.goto(base + "/index.html?demo=1#/pattern")
    page.wait_for_selector(".factors")
    suspects = page.locator(".factor.v-suspect strong").all_inner_texts()
    check("demo: painkiller surfaces as possible trigger", any("ibuprofen" in s.lower() or "painkiller" in s.lower() or "nyeri" in s.lower() for s in suspects), suspects)
    page.evaluate("location.hash = '#/report'")
    page.wait_for_selector(".sheet")
    check("report shows UAS7 table", page.locator(".uas-table td").count() == 4)
    page.evaluate("location.hash = '#/tests'")
    page.wait_for_selector(".test-row")
    check("six self-tests listed", page.locator(".test-row").count() == 6)
    context.close()


def with_retry(p, step, attempts=3):
    """Run step(browser) with a fresh browser; relaunch if something outside kills it."""
    for attempt in range(attempts):
        browser = launch(p)
        mark = len(results)
        try:
            step(browser)
            browser.close()
            return
        except Exception as error:  # browser killed or crashed under load
            del results[mark:]
            print(f"[retry {attempt + 1}] {type(error).__name__}: {str(error)[:120]}")
            try:
                browser.close()
            except Exception:
                pass
    check("step completed after retries", False, "browser kept closing")


def main():
    shots = "--shots" in sys.argv
    server, base = serve()
    with sync_playwright() as p:
        def logic_step(browser):
            page = browser.new_context().new_page()
            logic_tests(page, base)

        with_retry(p, logic_step)
        with_retry(p, lambda browser: flows(browser, base))
        for viewport in VIEWPORTS:
            with_retry(p, lambda browser, vp=viewport: gates(browser, base, shots, (vp,)))
    server.shutdown()
    passed = sum(r["ok"] for r in results)
    print(f"\n{passed}/{len(results)} passed")
    (ROOT / "tests" / "last_run.json").write_text(json.dumps(results, indent=1), encoding="utf-8")
    sys.exit(0 if passed == len(results) else 1)


if __name__ == "__main__":
    main()
