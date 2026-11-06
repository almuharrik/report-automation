# Marketing Report Narrative Playbook

> **Purpose:** Training reference for an AI agent that writes marketing performance report narratives (weekly / monthly reports, campaign recaps, channel deep dives) to consultant standard.
> **Built from:** 13 consulting and research decks in `Data-Archieve/Deck Reference MD/` (McKinsey, BCG, Bain/Google/Temasek, Accenture, EY, KPMG, IAB/PwC, plus one internal guideline). Learnings were distilled on 2026-11-05.
> **How to use:** Parts 1–5 are the instructions and templates (load them into the agent's system prompt or skill). Part 6 is a worked example. Part 7 summarises each source deck and what we took from it.
> **Note on examples:** All Rupiah / campaign numbers in the examples are **illustrative**, not real data.

---

## Contents
1. [Core principles (the 12 rules)](#part-1--core-principles-the-12-rules)
2. [Standard report structure](#part-2--standard-report-structure)
3. [Writing formulas: titles, summaries, numbers](#part-3--writing-formulas)
4. [Section templates](#part-4--section-templates)
5. [Phrase bank, anti-patterns and QA checklist](#part-5--phrase-bank-anti-patterns-and-qa-checklist)
6. [Worked example](#part-6--worked-example)
7. [Source deck summaries and learnings](#part-7--source-deck-summaries-and-learnings)

---

## Part 1 — Core principles (the 12 rules)

These are the habits that showed up in almost every good deck. If the agent only remembers one part of this document, it should be this one.

1. **A report is a decision tool, not a data dump.** Every number shown must move the reader closer to a choice and answer "what should we do next?" If a chart doesn't support a decision, move it to the appendix. *(Guidelines doc, EY, BCG)*

2. **Headline = finding with a number. Caption = neutral label.** Every section or slide title is a full sentence stating the conclusion: metric + direction + magnitude + period + driver. The chart or table caption underneath is a plain label: metric, unit, period. Topic titles ("Channel Performance") are only allowed on dividers and reference tables. *(All 13 decks)*

3. **Open with the verdict.** The executive summary stands alone. A reader who reads only that page should know what happened, why, and what we will do. *(McKinsey credit card, e-Conomy, Guidelines)*

4. **Every number gets at least two anchors.** Prior period (WoW / MoM / YoY), plus one of: target/plan, trailing average, long-run norm, peer/benchmark, or a record ("lowest since March"). A number with no comparator is not an insight. *(McKinsey credit card, IAB, Moneyball)*

5. **Fact → insight → action.** Never stop at the fact. "CTR fell 0.4 pp" (fact) → "creative fatigue: frequency hit 4.1" (insight) → "rotate 3 new hooks by Thursday" (action). *(Guidelines doc: "a fact" vs "a strategic judgment")*

6. **Show the spread behind the average.** "ROAS 3.1x overall, but this hides variation: retargeting 6.2x vs prospecting 1.4x." If there is no meaningful variance, say so explicitly. *(EY, BCG, Guidelines)*

7. **Separate size from intensity.** The biggest absolute contributor and the most efficient one are often different. Name both: "Meta drove the most leads, but TikTok had the lowest CPL." *(McKinsey Norway, Guidelines "Specificity Pivot")*

8. **Explain change with drivers.** Decompose the headline KPI change (waterfall / bridge: volume × rate × mix). Use plan-vs-actual and unit economics to explain divergence. *(McKinsey USPS, BCG)*

9. **Balance: misses get the same prominence as wins.** Use concession framing ("Despite…", "…but…", "However…"). Sponsor-style reports that only show good news are the main thing **not** to copy. *(Weakness of e-Conomy, Moneyball, Accenture Niche)*

10. **Hedge honestly.** Actuals are exact. Forecasts are ranges with stated assumptions. Leading indicators use "could indicate". Label confidence (High / Medium / Low + why), and mark slides as Preliminary / Estimate / Illustrative where relevant. *(McKinsey NHS, BCG, Norway)*

11. **Disclose method on the page.** Source system, date range, attribution window, definitions, exclusions, sample size, tracking changes. Use "Source:" lines on every chart. *(e-Conomy, IAB, BCG, KPMG)*

12. **Close with numbered actions.** 3–5 prioritised actions, each with: From → To, expected impact, effort, owner, date. Recommendations map back 1:1 to the insights. *(Moneyball calls to action, NHS From→To, USPS coded levers. Most decks were weak here, so the agent must do better.)*

---

## Part 2 — Standard report structure

### 2.1 Recurring report skeleton (weekly / monthly)
Keep the **same order every period** so readers learn where to look and can compare reports side by side (IAB, McKinsey quarterly tracker).

| # | Section | What it contains | Source pattern |
|---|---|---|---|
| 0 | **Header** | Report name, exact period, date pulled, owner, data sources | Guidelines: exact timestamps signal freshness |
| 1 | **Executive summary** | Verdict headline + 2-sentence tension + 3–5 bullets + top 3 actions | McKinsey credit card, KPMG |
| 2 | **Context** | What changed outside our control: seasonality (Ramadan, Harbolnas, payday), platform/algorithm changes, tracking breaks, budget changes | McKinsey macro slides, IAB "sample change first" |
| 3 | **KPI dashboard** | One table: rows = channels/campaigns, metric + Δ columns, total/weighted-avg row, better/worse flags | McKinsey dashboard slide |
| 4 | **Headline KPI deep dive** | Trend chart + driver bridge (what moved revenue/leads) | USPS waterfall |
| 5 | **Channel / campaign sections** | Same mini-template per channel (see 4.4) | e-Conomy country spotlights |
| 6 | **Segment / audience / creative cuts** | Where the growth came from, what held it back | e-Conomy cohorts, EY personas |
| 7 | **Qualitative evidence** (optional) | 3–5 verbatim customer comments, sales feedback, ad comments, mapped to the KPI they explain | McKinsey earnings-call quotes, BCG quotes |
| 8 | **Rotating deep dive** (optional) | One theme per period (a creative test, a new audience, a funnel stage) | McKinsey credit card thematic add-on |
| 9 | **Outlook and risks** | Next-period forecast as a range + assumptions, upside/downside risks | USPS risk register, Norway scenarios |
| 10 | **Recommendations / next steps** | 3–5 numbered actions with owner, date, impact | Moneyball, NHS, BCG pilots |
| 11 | **Appendix** | Definitions, methodology, full tables, backup charts | IAB definitions appendix |

### 2.2 Campaign recap skeleton (one-off)
1. **Situation / Ambition / Approach**: what was happening, what the campaign set out to achieve (targets), and what this report covers (budget, dates, channels, data sources). *(Moneyball opener)*
2. **Executive summary**: verdict vs target + 3–5 numbered insights.
3. **One chapter per insight**: divider headline (insight + implication) → 1–3 evidence sections → bold so-what lines.
4. **What worked / what didn't**: balanced, with numbers on both sides.
5. **Learnings to carry forward**: framed as reusable rules.
6. **Calls to action**: numbered, mapped 1:1 to the insights.
7. **Appendix**: definitions, full results.

### 2.3 Length discipline
- Weekly report: exec summary + dashboard + 3–5 insight sections + actions. Everything else goes in the appendix.
- Monthly report: the full skeleton in 2.1, with one rotating deep dive.
- Cap the main body at **3–5 recommendations** (NHS had 22, which is too many).
- "Borrow the mechanics, not the length." The sources ran 14–129 slides; marketing reports should not.

---

## Part 3 — Writing formulas

### 3.1 Title / headline formulas
Every section headline is a full sentence. Pick a formula:

| Formula | Example (illustrative) | Source |
|---|---|---|
| **[Metric] [verb] [magnitude] [to value] [period], [driver]** | "Leads rose 34% WoW to 1,240, largely fueled by Reels creatives" | e-Conomy 2023 |
| **[Finding]; [sharpest sub-finding]** | "Retargeting ROAS 4.2x vs prospecting 1.6x; widest gap on mobile" | e-Conomy 2023 "HVUs spend 6.8X…; highest delta in travel" |
| **[Good news], but/yet [caveat]** | "Leads up 30% WoW, yet only 12% qualified, down from 19%" | BCG, e-Conomy 2021 |
| **While [X], [Y]** | "While Meta delivered the most leads (1,240), TikTok had the lowest CPL (−35% vs Meta)" | Guidelines "Specificity Pivot", Norway |
| **Despite [headwind], [net outcome]** | "Despite a 22% CPM spike during Harbolnas, ROAS held at 3.4x" | e-Conomy 2023 |
| **[Decline in X] offset by [growth elsewhere]** | "Large drop in Google Search offset by double-digit growth in every social channel" | e-Conomy 2021 (Vietnam) |
| **Topic \| Conclusion** (for deep dives) | "Meta Prospecting \| CPL rose 22% as frequency passed 3.5; creative refresh needed" | BCG |
| **Scope word in title** | "CPA improved for all channels except TikTok" / "Results mixed across campaigns" | McKinsey credit card ("for all issuers except Citi PLCC") |
| **Momentum / streak** | "Third consecutive week of CPA decline, with the pace accelerating" | McKinsey credit card ("sixth consecutive quarter") |
| **Leading indicator** | "Rising frequency (3.8, +0.9 WoW) could indicate creative fatigue and higher CPA next week" | McKinsey credit card (delinquency → charge-offs) |
| **Ellipsis chain across sections** | "Revenue grew across all categories…" → "…but two audiences drove >50% of the growth" | Norway, EY, BCG |

**Title rules**
- 1–2 lines maximum. Sentence case, not ALL CAPS.
- Must contain a number. Banned: "Watch out for", "Performance overview", "Channel update".
- Use vivid but precise verbs ("sprints ahead", "remains subdued", "stalls"), always next to a number. At most one metaphor per report.
- The caption under the chart stays neutral: "CPA by channel (Rp '000), weekly, 1–28 Oct".

### 3.2 Executive summary formulas

**Format A — Verdict + tension + bullet tree** (McKinsey credit card; best for weekly/monthly)
```
Executive summary: [3–6 word verdict, e.g. "Efficient growth, softening reach"]

[Bold 2-sentence tension] This [week/month] saw [pressure on X from A, B and C].
However, [Y] is driving [outcome].

• [Top KPI verdict vs target and vs long-run norm]
   » [driver 1 with number + comparison]
   » [driver 2 with number + comparison]
• [Second KPI verdict]
   » [evidence]
• However, [counterweight bullet: the main thing going the other way]
• Next: [top 3 actions, one line each]
```

**Format B — Three bullet archetypes** (Guidelines doc)
- **Monetary lead:** value (or range) plus timing. "The campaign drove Rp 120–140M attributed revenue (range = 7-day vs 28-day attribution), ~70% of it in week 1."
- **Risk lead:** % of people/spend × multiplier vs benchmark × named business risk. "Retargeting frequency hit 6.2, 2x our fatigue threshold, putting next week's CTR at risk."
- **Specificity pivot:** "While [biggest absolute], [most efficient / most disruptive relative]…"

**Format C — Two-column storyline table** (e-Conomy 2021; best for monthly/quarterly)
| Storyline headline (= section name) | Evidence (2–3 sentences with numbers) |
|---|---|
| Paid social carried the month | … |
| Search efficiency eroded | … |
| Returning buyers drove profit | … |
Then reuse these exact headlines as the section dividers, so the whole report reads as one argument.

**Format D — Bold claim + supporting stats** (KPMG, EY)
"**Retargeting is now our most profitable lever.** It drove 61% of purchases on 18% of spend; ROAS 6.2x vs 1.4x for prospecting."

**Exec summary rules**
- Every bullet carries a number. KPMG's "risk mitigation is a major focus" with no number is the example of what not to do.
- 3–6 bullets maximum.
- Pick **one "disruptive anchor"**: the single comparison stat that sums up the period ("share of spend on fatigued creatives went from 1 in 5 to 1 in 2"). Put it in the headline or the first line.
- Cross-check every summary number against the body. KPMG, EY, Norway and BCG all had mismatches.

### 3.3 Number framing rules

| Situation | Rule | Example |
|---|---|---|
| Any actual | Absolute **and** relative, with the base | "Revenue Rp 420M, +18% WoW from Rp 356M" (IAB "+34% from $257.4M") |
| Volume metrics (spend, revenue, leads, sessions) | % change | "+12%" |
| Rate metrics (CTR, CVR, share of spend, churn) | **pp / bps** change, never % | "CTR 1.9%, +0.4 pp". Never "CTR up 27%" without the pp. Moneyball's "5% gap" really meant +5 pts. |
| Ratios / comparisons | Multipliers | "Video CTR is 1.8x static"; "returning buyers spend 3.1x new buyers" |
| Rates for non-technical readers | Natural frequencies | "7 in 10 leads came from Meta"; "1 in 4 visitors now organic, up from 1 in 7" |
| Seasonal business | Like-for-like comparison | Same week last year, Ramadan vs Ramadan, Q4 vs Q4, MTD vs same days last month |
| Multi-period trend | CAGR / average weekly growth, **state the period** | "Leads +9% avg weekly growth (W36–W44)" |
| Recovery from a dip | % of baseline | "CTR back to 85% of pre-change level" |
| Records | Historic extremes / period records | "Lowest CPA since March"; "this week alone exceeded all of September" |
| Momentum | Second derivative | "Still growing, but decelerating: +8% WoW vs +15% avg of prior 3 weeks" |
| Small base | Flag it, or suppress the % | "+150% from a low base of 20 leads". Never "+500%" on 0.1% → 0.6%. |
| Concentration | Top-N share | "Top 3 creatives = 64% of spend"; ">50% of conversions from 2 of 9 campaigns" |
| Two diverging growth rates | Name the gap | "Traffic +20% vs conversions +8%: a 12-pt conversion gap" (Moneyball "Market Disconnect") |
| Cost lines | % of revenue | "Ad spend = 14% of GMV, up from 11%" |
| Shares | Show the absolute too | A declining share can still be growing in Rupiah (IAB weakness) |
| Forecasts | Range + assumption | "Next-month leads 1,800–2,100, assuming flat CPM" |
| Estimates | "~" prefix, and label them | "~Rp 45M (estimate, conversions still settling)" |
| Negatives | Explicit minus or parentheses | "−12%" or "(12)%" |
| Denominator | Always state it | "% of total leads", not "% of a sector" (KPMG weakness) |
| Top-box / soft numbers | Split the total from the strong subset | "78% of leads MQL-eligible, but only 11% high-intent" (KPMG "78% confident, incl. 11% highly") |
| Indonesian audience | Localise the number format | "Rp 1,2 miliar", "6,8x", decimal comma (e-Conomy Bahasa version) |

### 3.4 So-what language
Give every finding an explicit implication, marked with one consistent label so readers can scan for it ("**So what:**", "**Implication:**", "**Next:**"; Accenture used "The strategic impetus lies in…").

Prescriptive phrasings:
- "We need to double down on… / shift budget to… / pause…"
- "Opportunity: [X] is underpenetrated at 2% vs a 10% benchmark, blocked by [Y]." *(e-Conomy online grocery)*
- "Headroom remains in…" / "Whitespace:…"
- "If [assumption] holds, [outcome]; if not, [fallback]."
- "Even if [optimistic case], we would still [miss target by X]." *(USPS sensitivity sentence)*

---

## Part 4 — Section templates

### 4.1 Evidence section (the core unit)
Three layers, used in Moneyball, e-Conomy, the credit card deck and BCG:
```
## [Action title: finding + number + driver]
[Chart/table]   Caption: [Metric (unit), granularity, period]
**So what:** [1–2 bold lines: who should do what, or what it means]
Source: [Platform], pulled [date]; [attribution window]. Note: [definitions / exclusions]
```
Optional: a **"Comments" side panel** (Norway) with 2–4 bullets on what changed, why, and what it means.

### 4.2 KPI dashboard table (McKinsey credit card)
| Channel | Spend (Rp M) | Δ vs LW | Revenue (Rp M) | Δ vs LW | ROAS | Δ (x) | CPA (Rp k) | Δ vs LW | CVR | Δ (pp) |
|---|---|---|---|---|---|---|---|---|---|---|
| Meta | … | … | … | … | … | … | … | … | … | … |
| TikTok | … | | | | | | | | | |
| Google | … | | | | | | | | | |
| **Total / weighted avg** | … | | | | | | | | | |

Rules: rows ranked by spend (say so in a footnote). Every metric column is paired with a Δ column, using % for volumes and pp for rates. Flag cells **better / worse than the weighted average** with text or an arrow, not colour alone. Footnote scope differences ("Meta excludes Advantage+ catalog"). Split sub-entities into their own rows.

### 4.3 Driver bridge / waterfall (USPS, BCG)
"Revenue +Rp 120M MoM = +Rp 90M volume (more orders) + Rp 45M AOV − Rp 15M refunds."
Annotate each bar with 1–3 cause bullets. Ask "is any single lever enough?", then show the combined effect.

### 4.4 Per-channel / per-campaign mini-template (e-Conomy country spotlights)
Identical for every unit, so units can be compared side by side:
1. **Takeaway paragraph**: 2–4 sentences: result, driver, implication. The title must be specific to this unit, not boilerplate.
2. **Volume trend**: spend, results, with Δ.
3. **Efficiency**: CPA / ROAS / CTR vs target and average.
4. **Breakdown**: by audience / creative / placement. Top and bottom performer.
5. **Next step**: one line.

### 4.5 Breakdown page (IAB)
Title: "Spend by [dimension] — [prev] vs [curr]". Italic takeaway subtitle naming the leader, the biggest mover and a status word ("continues to dominate", "no longer significant", "not far behind").
| Item | Prev share | Curr share | Δ (pp) | Curr absolute (Rp M) |
|---|---|---|---|---|
Sorted by the current period, with a concentration callout ("Top 3 = 72%").

### 4.6 Positioning chart (McKinsey credit card)
Scatter of growth on KPI A vs growth on KPI B (e.g. spend growth vs conversion growth), with total-account averages as crosshairs. Then two sentences: who beat the average on both, and who lagged.

### 4.7 Spend share vs efficiency (Moneyball)
Show ROAS/CPA per channel **with its % of budget printed underneath**, so over- and under-investment is visible. Frame mix as a current vs optimal gap in **pts**, then translate it to money: "Shifting 5 pts of budget to Search ≈ +Rp X revenue at current ROAS." Note average vs marginal returns: "CPA has risen 3 weeks straight as spend scaled, a sign of diminishing returns."

### 4.8 Segment / persona cards (EY, e-Conomy)
Define 2–4 segments (new vs returning, metro vs non-metro, high-value vs discount seekers). Give each an **identical metric card**, compared against "overall". Write one sentence on where the growth came from and one on what held it back.

### 4.9 Option evaluation table (BCG, Guidelines)
| Option | Suitable because | Reason for concern / risk | Expected impact | Effort |
|---|---|---|---|---|
| Scale UGC creatives 2x | … | … | +Rp 30–45M | Low |
The **risk/constraint column is mandatory**. It signals balance.

### 4.10 Plan vs actual and gap-to-target (USPS, NHS)
- Plot actual against plan and forecast scenarios on one chart, and put the gap in the title: "Leads have run 18% below plan since week 3."
- Express results as a share of the gap: "The campaign closed 62% of the gap to the monthly target."
- Base case vs with actions: "With no change, CPA reaches Rp 55k by month-end; the 3 proposed actions bring it to Rp 44k."

### 4.11 Status scorecard (e-Conomy 2021 outlook)
| Initiative / KPI | Status | One-line evidence |
|---|---|---|
| Lower CPL below Rp 15k | On track | Rp 13.8k, 3rd week below target |
| Grow organic share to 25% | At risk | 19%, +1 pp MoM, needs +2 pp/month |

### 4.12 Recommendations block (Moneyball, NHS, USPS, BCG)
```
### Recommendations
A1. [Action verb + what] — From [current state] → To [target state]
    Why: [link to insight #]  |  Impact: [range]  |  Effort: L/M/H
    Owner: [name]  |  By: [date]  |  Confidence: [H/M/L + reason]
A2. …
```
- 3–5 maximum. Prioritise on an **impact × effort** grid with stated thresholds.
- Tag feasibility: "within team control" vs "needs budget approval".
- Frame tests as concrete pilots: what, where, how many, which variant, and the success metric. "Test UGC hook A vs B on 2 ad sets in Jabodetabek; success = CPL < Rp 12k at ≥ 100 leads per variant."

### 4.13 Outlook and assumptions (BCG "what you need to believe", Norway, USPS)
- Forecast as a range, with a base case and a stretch case. Show the conservative number with equal prominence; never present the upside as the expectation.
- List the assumptions explicitly: CPM, CVR, AOV, with ranges.
- Upside / downside risk list (3 bullets each).
- Theory vs practice caveat where relevant.

### 4.14 Footer / methodology standard (e-Conomy, IAB, BCG, KPMG)
On every chart or table:
```
Source: [Meta Ads Manager / GA4 / CRM], pulled [date]; own analysis last.
Period: [exact dates, timezone]. Attribution: [7-day click, 1-day view].
Note: [1] Definitions (Lead = form submit; ROAS = attributed revenue / spend).
      [2] Exclusions (organic not included; test campaigns excluded).
      [3] Aggregation (totals = sum; rates = weighted average).
      [4] One-offs (11.11 flash sale; tracking outage 3 Nov).
      [5] Restatements (last week's figures updated after late conversions).
```
Up front, once per report: a **scope box** ("Covers paid social only; excludes marketplace ads") and a **comparability flag** for any tracking, pixel, attribution or campaign-set change. IAB put its sample change as the first exec-summary bullet.

Status stamps where applicable: **Preliminary** (data still settling), **Estimate**, **Illustrative**, **Rounded**.

---

## Part 5 — Phrase bank, anti-patterns and QA checklist

### 5.1 Phrase bank
**Contrast / balance**
- "…, though still [above/below] the [benchmark] of [X]"
- "Despite [headwind], [metric] held at [X]"
- "[Negative], but [offset], resulting in [net]"
- "This headline figure hides significant variation: …"
- "Across [channels], there actually isn't much variance in …"
- "On one hand … On the other hand …"
- "YET…": a pivot from a problem fact to an opportunity fact

**Trend / status**
- "continues to dominate", "still the majority", "no longer significant", "not far behind", "remains subdued"
- "decelerating while [Y] is accelerating"
- "[N]th consecutive [week] of …"
- "highest/lowest since [date]"
- "back to [X]% of pre-[event] level"

**Causality**
- "driven by …", "owing to …", "reflecting …", "largely fueled by …"
- "Many [competitors / sellers] ran aggressive promos, inflating [metric]" (anomaly annotation)

**Hedging**
- "could indicate …", "expected to …", "base case … / stretch case …"
- "from a low base"
- "Confidence: Medium, based on 7 days of data"
- "Even if [optimistic case], we would still …"

**Action**
- "We recommend …", "Shift [X pts] of budget from … to …", "Pause …", "Double down on …"
- "From [current] → To [target]"

### 5.2 Anti-patterns (what NOT to copy from the sources)
| Anti-pattern | Seen in | Instead |
|---|---|---|
| Good news only / advocacy dressed as analysis | Moneyball, e-Conomy, Accenture Niche | Give misses equal space |
| Pure description, no so-what or actions | IAB, KPMG, e-Conomy 2023 | Add a "So what" and "Next" to every finding |
| Numbers that disagree between summary and body | KPMG (52%/47% swapped), EY (67 vs 66, 54 vs 58), Norway ("up to ~127bn" vs 95–159bn), BCG | Cross-check every repeated number |
| Titles with no number ("Watch out for", "Online video still early") | e-Conomy 2021, KPMG | Put a number in every title |
| Mixing pp and % ("5% gap" for +5 pts) | Moneyball | pp for shares and rates |
| % change on tiny bases (+500%) | IAB | Flag "from a low base" or suppress |
| Shares without absolutes | IAB | Show both |
| Unlabelled CAGR period / ambiguous "grew 36%" | IAB, Accenture Niche | Always name the period and the type (CAGR vs cumulative vs YoY) |
| Data from outside the period with no label | McKinsey credit card (April data in a Q1 report) | Label it clearly |
| Meaning carried only by colour or icons | McKinsey credit card, NHS | Add a text label |
| Boilerplate repeated across units | e-Conomy country slides | A unit-specific title for each unit |
| Hype wordplay ("Roaring 20s", "rocketship") | e-Conomy | Plain, precise language; at most one metaphor |
| Overwrought prose ("intellectual sovereignty") | Guidelines doc | Keep the mechanics, drop the tone |
| ALL-CAPS long titles | Moneyball | Sentence case |
| Long scene-setting before the first number | Accenture Niche | Lead with results |
| Too many recommendations (22) | NHS | 3–5, the rest in backup |
| Typos, leftover template text, draft timestamps, wrong footers | BCG, KPMG, EY, NHS, e-Conomy | Proofread (see the checklist) |
| "Incomplete without oral commentary" | BCG | The report must stand alone |
| Ending with open questions | EY | End with actions, owners and dates |

### 5.3 QA checklist (run before sending)
- [ ] Every section title is a full sentence with a number.
- [ ] The exec summary stands alone: verdict, why, actions. Every bullet has a number.
- [ ] Every key number has ≥2 anchors (prior period + target/benchmark/average/record).
- [ ] Rates use pp; volumes use %; multiples use x; denominators are stated.
- [ ] Small-base growth is flagged; no % change on tiny bases.
- [ ] At least one "hides variation" or segment cut, and at least one size-vs-efficiency contrast.
- [ ] Misses are reported as prominently as wins.
- [ ] Every finding has a So what; the report ends with 3–5 numbered actions (owner, date, impact).
- [ ] Forecasts are ranges with stated assumptions; estimates are marked "~" or labelled.
- [ ] Source / period / attribution / definitions are given on every chart. Scope and comparability flags are up front.
- [ ] Numbers that appear twice match exactly (summary ↔ body ↔ recommendations).
- [ ] Period labels are correct; data outside the period is labelled.
- [ ] No meaning is carried by colour alone; pagination is correct (x/n).
- [ ] No typos in titles; no leftover template text; no hype words.

---

## Part 6 — Worked example

*Illustrative numbers only. This shows the formulas applied to a weekly paid-social report.*

> # Weekly Paid Media Report — W44 (28 Oct – 3 Nov 2026)
> Sources: Meta Ads Manager, TikTok Ads, GA4 · pulled 4 Nov 09:00 WIB · Attribution: 7-day click / 1-day view · Owner: Marketing
> ⚠️ Comparability: the TikTok pixel was re-installed on 30 Oct; TikTok conversions before that date are under-reported.
>
> ## Executive summary: Efficient growth, softening reach
> **This week saw pressure on reach from rising Meta CPMs (+22% WoW) ahead of 11.11. However, Reels creatives lowered CPL enough to grow leads 34% on flat spend.**
> - **Leads rose 34% WoW to 1,240, the highest week since June, on flat spend (Rp 18.2M, +1%).**
>   » CPL fell to Rp 14.7k (−25% WoW), now 8% below the Rp 16k target.
>   » Reels took 60% of spend (from 35%) and delivered 1.8x the CTR of static ads.
> - **While Meta delivered the most leads (910, 73% of total), TikTok had the lowest CPL (Rp 11.2k, −35% vs Meta).**
> - **However, lead quality slipped: only 12% qualified, down from 19% (−7 pp).** Most of the drop came from the broad-audience ad set.
> - **Risk: retargeting frequency reached 4.1 (+0.9 WoW), above our 3.5 fatigue threshold, which could indicate a CTR decline next week.**
> - **Next:** A1 shift 10 pts of budget to TikTok · A2 tighten the broad audience · A3 refresh retargeting creatives by Thu.
>
> ## Leads rose 34% WoW to 1,240, largely fueled by Reels creatives
> *Caption: Leads and CPL (Rp '000), weekly, W36–W44*
> **So what:** Reels is now our most efficient format. Keep ≥60% of Meta spend there while monitoring frequency.
> Source: Meta Ads Manager, pulled 4 Nov. Note: Lead = WhatsApp click-to-chat + form submit.
>
> ## Meta Prospecting | Leads up 41%, yet qualified rate fell to 9% as the broad audience took over
> …
>
> ## Recommendations
> **A1. Shift 10 pts of budget from Meta prospecting to TikTok.** From 20% → 30% of spend · Why: insight 2 · Impact: +90–130 leads/week at current CPL · Effort: Low · Owner: [name] · By: 6 Nov · Confidence: Medium (pixel only 5 days old)
> **A2.** …

---

## Part 7 — Source deck summaries and learnings

### 7.1 Guidelines: Rule of Thumbs for Consultant-Standard Reporting Decks
**What it is:** 3-page internal meta-guide distilled from McKinsey's *GenAI in Norway* and EY's *Work Reimagined*.
**Summary:** A deck is "a tool for decision-making, not a data repository." Five rules, each ending with a "So What?": (1) strategic framing: titles are declarations, not descriptions, anchored in a quantified impact; (2) a stand-alone exec summary using three bullet archetypes: Monetary Lead, Sentiment/Risk Lead, Specificity Pivot; (3) define the "What" with scales and suitability tables that **must** include a risks column, and segment by function, not just industry; (4) cohorts and personas beat averages; (5) cheatsheet: scenario anchoring, point-to-point CAGR, before→after shifts, magnitude-scaled visuals, plus one **Disruptive Anchor** stat ("2 in 7 → 1 in 2").
**Key learning:** The distinction between a fact and an insight: "Norway is 10th most educated" is a fact; "this increases the feasibility of early adoption" is a strategic judgment. Every finding needs the judgment.
**Don't copy:** The overwrought tone. Also, "anchor on the aggressive scenario" can become hype in performance reports, so show the conservative number equally.

### 7.2 US Credit Card Issuer Performance 1Q 2023 (McKinsey)
**What it is:** 37-slide recurring quarterly industry tracker, the **closest analogue to a periodic marketing report**.
**Summary:** "A period of cautious optimism": ROA fell to 4.6% (−39 bps YoY) but is still above the 10-year average of 4.3%. Spend +10.2% YoY to $930.9B (decelerating), outstandings +18.3% (sixth consecutive quarter of growth, accelerating). Charge-offs 3.0% (+116 bps), expenses +17.9% from marketing. Plus a survey deep dive on POS lending.
**Structure:** Verdict exec summary → macro context → **dashboard table** (metric + Δ columns, weighted-avg row, better/worse flags) → peer scatter with average crosshairs → demand drivers → one slide per KPI (aggregate, then per issuer) → P&L bridge → earnings-call themes and quotes → thematic deep dive → appendix.
**Key learnings:** Every number has several anchors (YoY, trailing average, 10-year norm, pre-pandemic baseline, peer average, record). Momentum language ("decelerating while accelerating"). bps for rates, % for volumes. Scope words in titles ("for all issuers except Citi PLCC"). Leading indicators ("delinquency could indicate further charge-off deterioration"). Event annotations on trend lines.
**Don't copy:** April data in a Q1 summary with no label; no recommendations section; meaning encoded in colour only.

### 7.3 e-Conomy SEA 2021: Roaring 20s (Google, Temasek, Bain)
**What it is:** 129-slide annual market-sizing report.
**Summary:** SEA internet economy GMV +49% to $174B; $363B by 2025, $700B–1T by 2030. 40M new internet users (75% penetration), 350M digital consumers. A merchant survey: 1 in 3 wouldn't have survived COVID without platforms. Funding $11.5B in H1 2021, equal to all of 2020. Philippines fastest (+93%), Indonesia largest ($70B).
**Structure:** Methodology/scope → one-slide exec summary table (5 storyline headlines + evidence) → 5 chapters, each with divider headline → 3-driver framework → evidence slides with a breadcrumb → sector deep dives → outlook with a progress scorecard → identical 6-slide template per country.
**Key learnings:** Action titles with the key claim in bold; chart label kept separate from the claim; absolute + YoY pairs; "X in 10"; multipliers; % of pre-COVID baseline; benchmarks for scale ("2% vs 10% in US/China"); segment by cohort (new vs existing, metro vs non-metro); hero-stat callouts; full footers (source, question, base n, definitions, exclusions); hedged forecasts with base/high cases.
**Don't copy:** Hype wordplay, sponsor-positive slant, boilerplate titles reused across countries, wrong footer year and typos.

### 7.4 e-Conomy SEA 2023: Country Spotlight Indonesia
**What it is:** 14-page country chapter (English plus a Bahasa mirror).
**Summary:** Indonesia digital economy GMV $62B in 2023 → ~$110B in 2025, mostly e-commerce. Players cut promotions; "sticky customers" offset the loss of price-sensitive ones. High-value users spend 6.8x others. Funding fell to $0.4B in H1 2023.
**Key learnings:** Short one-line titles with the number, direction and driver. "[Finding]; [sharpest sub-finding]" titles. Concession framing ("Despite ripples from macro headwinds…"). "From a low base" qualifier. Small multiples with a consistent template. Value paired with volume (funding $ + deal count). Like-for-like periods (H1 vs H1). **Localised number formats for Indonesian readers.**
**Don't copy:** Thin on implications; some headlines with no numbers.

### 7.5 Indonesia Case Study — School Connectivity (BCG for Giga)
**What it is:** 69-page strategy and feasibility deck.
**Summary:** ~19% of Indonesian schools (42k) are unconnected, mostly in Eastern regions. Needs $168M/year. Funding models are evaluated by region with P&L waterfalls ("no model sufficient by itself"). Ends with 4 concrete pilots of 10 schools each.
**Key learnings:** "Topic | Conclusion" titles. Ellipsis-chained panel captions turn a 3-chart slide into one sentence. Agenda repeated before each chapter. Storyline opener ("There is X → meaning Y → resulting in Z"). Anomaly callouts on charts. Counter-nuance callouts ("affordable on average, but too expensive for the 10% below the poverty line"). **"Suitable because / Reason for concern" tables.** "What you need to believe" assumption slides. Next steps as concrete pilots.
**Don't copy:** Inconsistent numbers across slides, overlong titles, leftover template text, "incomplete without oral commentary".

### 7.6 The Moneyball Moment for Marketing in Canada (Accenture)
**What it is:** 27-slide media-effectiveness study (MMM + attribution), the **most marketing-relevant deck**.
**Summary:** Canadian brands spend 1.7% of revenue on media vs 3.1% in the US. The optimal TV share is 47% vs 42% today, and the gap means $1.4B in foregone revenue. TV's halo: without it, digital ROI falls 19%; TV's ROI is understated by 23%. Digital wins at low spend but saturates. Long-form video viewership +20% CAGR vs ad spend +8%.
**Structure:** Situation / Ambition / Approach → 5 insight headlines → one chapter per insight (divider + implication → evidence: action title, neutral chart title, bold takeaways) → 4 calls to action mapped to the insights.
**Key learnings:** Current-vs-optimal mix gaps; spend share printed under ROI bars; direct vs attributed ROI on the same chart; average vs marginal returns (saturation curves); naming a gap metric ("12% Market Disconnect"); "YET…" pivot; an "Illustrative" teaching slide before the real data.
**Don't copy:** Advocacy with no limitations, thin methodology, one source line in 27 slides, pts/% confusion, ALL CAPS.

### 7.7 IAB FY2018 Podcast Ad Revenue Study (PwC)
**What it is:** 21-page annual revenue tracker, a **template for a recurring report shell**.
**Summary:** Self-reported revenue $344.7M (+34%), market estimate $479.1M (+53%), forecast to exceed $1B by 2021. Mix shifts: dynamic insertion rising, CPM dominant, brand awareness up. Top 5 genres = 65.7% of revenue.
**Key learnings:** A frozen section order every year. An exec summary that opens with the **sample/coverage change**. "+X% from $Z" so the base is always stated. Q4-vs-Q4 for seasonality. Observed vs modelled series labelled throughout. Forecasts asterisked. Fixed "Revenue by X" breakdown pages with an italic takeaway subtitle. Status words. A definitions appendix.
**Don't copy:** No so-what at all; shares without absolutes; +500% on tiny bases; unlabelled CAGR period.

### 7.8 EY Work Reimagined (for ICMIF)
**What it is:** 35-page global employee survey (n=16,264) tailored for insurers.
**Summary:** 9 in 10 want flexibility. 54% would quit without it, and Millennials are 2x as likely as Boomers. Three personas: Office Optimal (13% quit-risk), Hybrid Hopeful (33%), Remote Ready (67%). Flexibility beats amenities.
**Key learnings:** Open with **the decisions this report supports**. Exec summary as 4 bold themes plus number-led bullets, with the detail sections following the same order. "This headline hides significant variation" followed by outliers. Say when there is **no** variance. The exact metric or question wording shown next to the chart. Personas with identical metric cards vs overall. A labelled opinion box ("EY PERSPECTIVE") separates opinion from data. Regression explained in plain English.
**Don't copy:** Summary/body numbers that disagree, typos, ending with questions rather than actions.

### 7.9 Ready for Take-off: Niche Markets (Accenture Research)
**What it is:** 37-page prose white paper.
**Summary:** VC in 8 focus countries grew 36% (CAGR) to $361B vs 30% in the US, yet only 2.6% of active companies are big businesses. Three prescriptions: dual societal and commercial value, location-based opportunities, tech ecosystems. Modelled cases are given as ranges.
**Key learnings:** An **"Idea in brief" / TL;DR box**. A figure caption formula ("Figure N: finding" + metric/unit/n/period + source). A "What can leaders do?" action box after each pillar. Time-to-milestone comparisons (8 vs 17 years). An inclusion/exclusion definitions table. One recurring so-what phrase.
**Don't copy:** Long scene-setting before numbers; an ambiguous "grew 36%"; success stories only.

### 7.10 The Economic Potential of GenAI in Norway (McKinsey)
**What it is:** 26-slide market-sizing deck.
**Summary:** 95–159 bn NOK by 2045 (~60% by 2030). Energy is biggest in absolute terms, High Tech most disruptive. Marketing & Sales is the largest function (28–43 bn). Roles with >50% automation potential went from 2 in 7 to 1 in 2.
**Key learnings:** Separate **largest absolute vs most intense** (a bubble chart of both). Pivot from the obvious cut to the actionable cut using ellipsis-linked titles. Concentration statements (">50% from two functions"). Ranges plus scenario footnotes. "Comments" side panels. "Non-exhaustive" / "Illustrative" tags. Bolded key phrases for skimming.
**Don't copy:** "Up to ~127bn" contradicting the range; point estimates and ranges mixed; messy sources; no recommendations.

### 7.11 USPS Future Business Model (McKinsey)
**What it is:** 39-slide strategic diagnostic.
**Summary:** Net income went from +$0.9B to −$3.8B in 3 years. The base case reaches a $33B annual loss by 2020. Actions within USPS's control (~$18B/year) shrink it to $15B, and the rest requires legislative change. Statutory limits would be breached by Oct 2010.
**Key learnings:** **Waterfall bridges** with cause bullets under each bar. **Plan vs actual** (forecast failure shown). **Gap-closing chart** re-shown as each lever layer is added. Unit economics (cost vs revenue per piece). Burdens as % of revenue. A **sensitivity sentence** ("even if volumes stayed flat, still a $21B loss"). An upside/downside risk register. Coded levers (P1, S1, W1) tagged by feasibility. A section tracker.
**Don't copy:** Option slides with no quantified impact; borrowed assumptions not shown.

### 7.12 Digitally-enabled NHS — Evidence Review (McKinsey for NHS England)
**What it is:** 26-slide business-case model.
**Summary:** The digital interventions are worth a £8.3–13.7bn net benefit, ~30% of a £30bn funding gap. They were prioritised on an impact × ease grid, followed by 22 From → To recommendations.
**Key learnings:** **"What this work is and what it is not"** scope slide. Results restated as a share of the problem/gap. An **impact × effort grid with stated thresholds**. **From → To recommendation tables.** A **confidence column** next to each estimate. Admitting mixed evidence. Status stamps (Preliminary, Illustrative, Rounded). A double-counting footnote ("interventions do not sum to the total").
**Don't copy:** 22 recommendations; missing sources; meaning encoded in icons; draft timestamps left on slides.

### 7.13 KPMG GenAI Survey 2024
**What it is:** 12-slide executive survey (n=225).
**Summary:** 83% expect GenAI investment to rise and 78% are confident of ROI, but only 11% are *highly* confident. Training rose to 69% (from 12%). Data privacy is the top partner risk. The C-suite ranks revenue first; all respondents rank productivity first.
**Key learnings:** **Bold claim + supporting stats** exec bullets. **Big-number stat tiles.** The exact question printed under each chart (the equivalent of a metric definition). Prior-period figures inside the sentence ("69%, up from 12%"). Split a soft total from the strong subset. Segment contrast in the title. A methodology box (n, profile, dates).
**Don't copy:** Summary numbers swapped vs the body; summary bullets with no number; spin on soft numbers; no implications.

---

### Cross-deck scorecard: which deck to study for what
| Need | Best reference |
|---|---|
| Recurring weekly/monthly structure | McKinsey Credit Card 1Q23, IAB Podcast Study |
| Exec summary writing | Guidelines doc, McKinsey Credit Card, KPMG |
| Action titles | e-Conomy 2021/2023, BCG Indonesia, Moneyball |
| Media mix / ROI narrative | Moneyball |
| Segmentation / personas | EY Work Reimagined, e-Conomy |
| Driver bridges, gap-to-target, sensitivity | McKinsey USPS |
| Recommendations and prioritisation | McKinsey NHS, BCG Indonesia, Moneyball |
| Forecast ranges and assumptions | McKinsey Norway, BCG Indonesia |
| Footnote / methodology discipline | e-Conomy 2021, IAB, BCG |
| Indonesian localisation | e-Conomy 2023 Indonesia |
