# Reda design system

Reda is a calm daily tool for people with chronic hives (biduran / urticaria). It should feel like a
well-kept clinic notebook: warm paper, one deep calamine-green accent, and data drawn in skin tones.

## References (what we took)
- **Paper symptom diaries handed out by allergy clinics** — one question per block, big tap areas, 0–3 scales.
- **UAS7 score sheet (EAACI/GA²LEN guideline)** — the exact wheal and itch wording, 7-day grid.
- **Jeda (juw12)** — warm paper background, serif headings, bottom tab bar, local-only, ID/EN.
- **Pharmacy dose cards** — dose as a row of tickable circles.

## Palette
| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#f6f1ea` | `#171513` | page |
| `--surface` | `#fffdf9` | `#211e1b` | cards |
| `--text` | `#231e1a` | `#efe8df` | body (AA on bg and surface) |
| `--muted` | `#5f554c` | `#b3a89a` | secondary text, ≥ 4.5:1 |
| `--accent` | `#1f5f55` | `#7cc4b5` | the one accent: primary buttons, active tab, links |
| `--danger` | `#a8281f` | `#ff8a7a` | red flags only |
| `--welt-0…4` | `#e7dfd5 → #9e3b2a` | dark ramp | data only: daily score 0→6 |

Contrast pairs that pass AA: text/bg, muted/bg, accent-ink on accent, white on danger.

## Type
- Display: `Charter, Bitstream Charter, Sitka Text, Cambria, Georgia, serif` (headings, big numbers).
- Body: system UI stack (`system-ui, Segoe UI, Roboto, Noto Sans`). No Inter, no web fonts (offline first).
- Floor 12 px; body 16 px; line-height 1.55.

## Spacing, radius, motion
- 4 px base; card padding 16; gaps 8 / 12 / 14.
- Radius: cards 18, controls 12, pills 999.
- One soft shadow token. Motion: toast fade only; `prefers-reduced-motion` respected.

## Signature element
The **welt ribbon**: seven rounded welts whose height and skin tone show each day's score (0–6),
with the UAS7 total and band beside it. Reused as the calendar and history tones.

## Voice
Plain, kind, specific. Indonesian first, English second. Every medical claim traceable to the guideline.
Banned: "cure", "miracle", "revolutionary", "AI-powered", exclamation marks, fake testimonials.

## Banned defaults
Purple/indigo gradients, Inter-only, emoji as icons, glow blobs, glassmorphism, gradient text,
six identical icon cards, centred-everything layouts, "Get started" as the only action, stock 3D art.
