# The Captain and the CFO: faceless video production

A 5-minute faceless explainer built from `../content/captain-and-cfo-script.md`.
Output target: **1920×1080, 30 fps, H.264 + AAC**, ~5:00 (the placeholder dry run came out at 5:16).

## Status

| Step | State |
|---|---|
| Fact-check and script fixes | ✅ done (see log below) |
| Style lock and 26 stills (GPT Image 2.5, 2K) | ✅ generated on Higgsfield |
| 4 hero clips (**Seedance 2.0, 1080p, std**, 28 s total) | ✅ generated on Higgsfield |
| Voiceover, 33 lines (Seed Audio, preset voice "Arthur") | ✅ generated on Higgsfield |
| Music bed (synthesized locally, royalty-free) | ✅ `work/make_music.py` |
| Edit script (Ken Burns, lower thirds, rule cards, ducking, SRT) | ✅ `work/build.py`, tested end to end on placeholder assets |
| **Download generated assets into this folder** | ⛔ blocked: this session's network policy denies the Higgsfield CDN `d8j0ntlcm91z4.cloudfront.net` |
| Final render `render/final.mp4` | ⏳ one command once the downloads work |

### Finish the render (once the CDN host is allowed)

```bash
cd video
bash work/fetch_assets.sh     # downloads 26 stills, 4 clips and 33 voice takes from work/urls.tsv
python3 work/build.py         # writes render/final.mp4, render/final.srt, render/timeline.tsv
```

To allow the host, add `d8j0ntlcm91z4.cloudfront.net` under Allowed domains in the environment's network settings (Edit → Network access → Custom). The change may only apply to new sessions.

## Folder layout

```
video/
  stills/   S01–S26 .png + style_ref.png   (2048×1152, from Higgsfield)
  clips/    H1–H4 .mp4                       (Seedance 2.0, 1080p)
  voice/    L01–L33 .wav                     (one take per narration line)
  music/    music_bed.wav                    (built by make_music.py to the cut's exact length)
  render/   segments/, overlays/, final.mp4, final.srt, timeline.tsv
  work/
    narration.tsv    fact-checked narration, one row per line (765 words)
    edit_plan.tsv    line → visual → on-screen text → pause after
    stills.tsv       still prompts;  style.txt = locked style suffix
    jobs.tsv         Higgsfield job IDs for every asset
    urls.tsv         Higgsfield result URL for every asset
    fetch_assets.sh  downloader;  build.py = editor;  make_music.py = music synth
```

## Visual style (locked)

Flat 2D editorial illustration, paper grain and light halftone. Palette: midnight navy, saffron gold and cream, with teal and brick-red accents.
Every person is a **faceless silhouette** with no real-person likeness, and there are no logos or broadcast footage, which avoids likeness and ICC copyright problems.
Every still uses `style_ref.png` as an image reference, and each Seedance clip is animated from one of the stills (start frame), so motion shots match the stills.
On-screen text (scores, dates, names) is added in the edit, never generated, so every number on screen matches the fact-checked figures.

## Clip breakdown

Lengths are the narration take plus a pause. Approximate times come from the placeholder dry run; `render/timeline.tsv` will hold the exact values.

| # | Time ≈ | Line | Visual | On-screen text |
|---|---|---|---|---|
| 1 | 0:00 | L01 hook | **H1 Seedance**: bowler at top of run-up, night final (8 s) | PAK NEED 13 OFF 6 · Johannesburg · 24 Sept 2007 |
| 2 | 0:09 | L02 | S01 captain hands the ball over | 7 internationals before the final |
| 3 | 0:20 | L03 | S02 spinning coin | GENIUS? OR LUCK? |
| 4 | 0:31 | Title | Navy title card | THE CAPTAIN & THE CFO |
| 5 | 0:34 | L04 | S03 captain/CFO split | — |
| 6 | 0:42 | L05 | S04 magnifier · scale · target | EDGE · DOWNSIDE · PROCESS |
| 7 | 0:49 | L06 | S05 coastal stadium | TARGET 275 · Mumbai · 2 Apr 2011 |
| 8 | 0:59 | L07 | S06 batsman walks off | INDIA 114/3 |
| 9 | 1:07 | L08 | **H2 Seedance**: batsman walks out (6 s) | DHONI PROMOTES HIMSELF |
| 10 | 1:14 | L09 | S07 nets, reading the spinner (2 shots) | THE INFORMATION EDGE |
| 11 | 1:26 | L10 | S08 winning six, fireworks | 91* (79) |
| 12 | 1:33 | L11 | S09 CFO with glowing folder (2 shots) | CIRCLE OF COMPETENCE |
| 13 | 1:47 | L12 | Rule card | RULE 1: Bet where you have an edge |
| 14 | 1:53 | L13 | S10 aerial stadium, sea of blue | 92,453 FANS · INDIA 10–0 |
| 15 | 2:05 | L14 | **H3 Seedance**: slow-motion coin toss (6 s) | AUSTRALIA WILL BOWL |
| 16 | 2:10 | L15 | S11 dry pitch + dew | DRY PITCH + EVENING DEW |
| 17 | 2:18 | L16 | S03 → S12 fork with cliff edge | CUT OFF THE WORST CASE |
| 18 | 2:36 | L17 | S13 batsman raises bat | INDIA 240 ALL OUT · Head 137 (120) |
| 19 | 2:45 | L18 | S14 tightrope over safety net | MORE CASH · LESS DEBT · STAGED BETS |
| 20 | 2:57 | L19 | S15 one-way vs two-way doors | Bezos · 2015 shareholder letter |
| 21 | 3:05 | L20 | Rule card | RULE 2: Avoid ruin before you chase return |
| 22 | 3:11 | L21 | S16 bowler from behind | 13 OFF 6 |
| 23 | 3:15 | L22 | S17 gold coins on 3 of 4 squares (2 shots) | OVERS 17–19 > OVER 20 |
| 24 | 3:28 | L23 | S18 six over midwicket | OVER 17: 3 SIXES, 19 RUNS |
| 25 | 3:36 | L24 | S19 release vs batsman | WIDE · DOT · SIX |
| 26 | 3:43 | L25 | **H4 Seedance**: scoop → catch at short fine leg (8 s) | INDIA WIN BY 5 RUNS |
| 27 | 3:53 | L26 | S20 hero / villain split (2 shots) | SAME DECISION. TWO STORIES. |
| 28 | 4:05 | L27 | S21 football on the 1-yard line → S02 coin | "RESULTING" · Annie Duke (2018) |
| 29 | 4:25 | L28 | S22 decision journal | DECISION JOURNAL |
| 30 | 4:35 | L29 | Rule card | RULE 3: Grade the process, not the scoreboard |
| 31 | 4:39 | L30 | S23 walking past warning lights | "TRUST THE PROCESS" ≠ AN EXCUSE |
| 32 | 4:45 | L31 | S24 crystal ball pre-mortem | THE PRE-MORTEM · Gary Klein, HBR 2007 |
| 33 | 4:54 | L32 | S25 → S04 recap | EDGE · DOWNSIDE · PROCESS |
| 34 | 5:07 | L33 | S26 empty stadium at dawn | GENIUS OR LUCK? Tell us in the comments |

**Edit treatment:** every still gets slow Ken Burns motion (alternating push-in and pull-out with a gentle pan). Lines over ~9.5 s are cut into two shots. Hero clips are fitted to the narration by slowing them by up to 1.35× and then holding the last frame. Lower thirds fade in at 0.4 s.
**Audio:** voice normalized to −16 LUFS. The music bed (tense drone and clock tick for the hook, then an Am–F–C–G pad with a soft pulse, resolving to C) ducks under the voice by sidechain compression and fades out at the end.

## Fact-check log

| Claim in the script | Result | Source |
|---|---|---|
| 2007 WT20 final, Johannesburg, 24 Sept 2007, India won by 5 runs | ✅ confirmed | Gulf News "This day, 2007"; Sportskeeda |
| Pakistan needed 13 off the last over | ✅ | Sportskeeda; Gujarat Giants (Joginder interview) |
| Last over: wide, dot, six, then scoop caught by Sreesanth at short fine leg | ✅. **Fixed**: the earlier script skipped the dot ball | Sportskeeda "Remembering Joginder Sharma" |
| Misbah hit Harbhajan for 3 sixes in the 17th over, 19 runs | ✅ | WION; Sportskeeda recap |
| Joginder's experience before the final | **Fixed**: 7 internationals (4 ODIs + 3 T20Is; final was his 4th T20I), not "4" | ESPNcricinfo player page; Republic World |
| Dhoni was 26 | ✅ (born 7 Jul 1981) | standard bio |
| Dhoni's "overs 17–19 matter more" reasoning | ⚠️ secondhand (Sreesanth and RP Singh interviews), so narrated as "according to teammates" | CricketAddictor; Sportskeeda |
| 2011 final, Wankhede, 2 Apr 2011, target 275 (SL 274/6) | ✅ | ESPNcricinfo match report |
| India 114/3 when Kohli fell (21.4 ov) | ✅ | ESPNcricinfo scorecard |
| Dhoni "poor form all tournament" | **Fixed**: he averaged ~30 across 7 innings before the final | Gulf News; Sportskeeda |
| Dhoni 91* off 79, won with a six, India won by 6 wickets | ✅ | ESPNcricinfo |
| Dhoni's Muralitharan/CSK-nets reasoning; Murali's "didn't have a clue" | ✅ quoted interviews | The Statesman; India TV |
| 2023 final, Ahmedabad, 19 Nov 2023, attendance 92,453 | ✅ | 2023 CWC final records (Wikipedia summary via search) |
| India unbeaten (10–0) before the final | ✅ | same |
| India 240 all out, Head 137 (120), Australia won by 6 wickets | ✅ | ESPNcricinfo match report |
| Cummins: bowling first, dew, "getting it wrong batting first would be fatal" | ⚠️ reported analysis of his thinking, so narrated as "reportedly" | SEN; ESPNcricinfo |
| Bezos Type 1/Type 2, one-way/two-way doors | ✅ 2015 shareholder letter (published Apr 2016) | Amazon IR PDF |
| Gary Klein, "Performing a Project Premortem", HBR | ✅ September 2007 | HBR archive |
| Super Bowl XLIX: pass on 2nd-and-goal from the 1-yard line, intercepted by Malcolm Butler | ✅ | ESPN; TIME; SI |
| Annie Duke, "resulting", *Thinking in Bets* | ✅ (2018) | book summaries; Ritholtz transcript |
| Buffett "circle of competence" | ✅ Berkshire letters (e.g. 1996) | — |

**Gaps filled in the narration:** the date, venue and target for each match; the dot ball in the last over; Joginder's exact caps; the 2023 attendance and India's 10–0 record; Head's 137; the year and source for Bezos and Klein; Butler's interception framed as "the one-yard line".

## Budget

Higgsfield credits used: about 310 of 383 (Seedance 2.0 1080p = 9 credits/s × 28 s = 252; stills about 27; voice about 31). An all-Seedance 5-minute version would have cost about 2,700 credits, hence the hybrid approach of hero clips plus animated stills.
