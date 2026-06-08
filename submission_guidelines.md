# Submission Guidelines — StellarX Philippines

Everything you need to submit a project, in one place. Read this fully before the deadline.

> **Organizers:** fields marked `[ORGANIZER: ...]` are placeholders. Fill in dates, links, and event-specific rules before publishing.

---

## TL;DR

1. Build your project on **Stellar testnet** (or mainnet).
2. Put **all your code** in a **public GitHub repo** with a complete **README**.
3. Open a **GitHub Issue on this repo** using the submission template below.
4. Submit **before `[ORGANIZER: deadline date + time + timezone]`**.

---

## Eligibility

| Requirement | Detail |
|---|---|
| **Team size** | 1–4 builders. Solo submissions welcome. |
| **Platform** | Must be built on Stellar. Stellar must be **core** to the product, not cosmetic. |
| **Network** | Stellar **testnet** is required and sufficient. Mainnet deployment is optional and earns bonus points. |
| **Originality** | Must be original work. No re-use of pre-existing projects, no plagiarism. See [Originality Rules](#originality-rules). |
| **Build window** | `[ORGANIZER: state the hackathon period and whether pre-existing boilerplate / prior personal work is allowed.]` |
| **License** | Code must be published under a permissive open-source license (MIT, Apache-2.0, or similar). |

---

## What You Must Submit

Your submission has **three parts**. All three are required — missing any one may disqualify the project.

### 1. A public GitHub repository
- Contains **all of your project's code** — not just a forked template.
- Public and accessible to judges.
- Includes a permissive open-source `LICENSE` file.
- The **`main` branch** is what gets judged. Make sure your final work is on `main`.

### 2. A complete README in that repo
Your project's README **must** include — see the [README Template](#project-readme-template) below:
- Project name and one-line description
- The problem it solves and why it matters (Philippines relevance if applicable)
- Which **track** you are submitting to
- How Stellar is used — which primitives, protocols, anchors, or contracts
- **Setup and run instructions** — a judge must be able to run it from the README alone
- Network details — testnet/mainnet, RPC URL, any contract IDs or asset issuers
- Team members (names + GitHub usernames)

### 3. The submission Issue on this repo
Open a GitHub Issue using the [Submission Issue Template](#submission-issue-template) below.

---

## How to Submit

1. Go to the **Issues** tab of this repository.
2. Click **New Issue**.
3. Title it exactly: **`Team #[number] - [Project Name]`**
   - Example: `Team #07 - SariPay`
   - `[ORGANIZER: if you assign team numbers, say where teams get them. Otherwise teams can use their team name.]`
4. Paste and fill in the [Submission Issue Template](#submission-issue-template).
5. Submit the Issue **before the deadline**. The Issue timestamp is the official submission time.

> One Issue per team. If you need to update your submission before the deadline, **edit the same Issue** — do not open a new one.

---

## Submission Issue Template

Copy everything in the block below into your GitHub Issue and fill it in.

```markdown
## Project Name
[Your project name]

## One-Line Description
[What it does, in one sentence]

## Track
[One of: Track 1 Remittance & Cross-Border | Track 2 Financial Inclusion & Everyday Payments | Track 3 DeFi, Stablecoins & Real-World Assets | Track 4 AI-Powered Stellar Apps | Track 5 Social Impact | Track 6 Open Innovation]

## Problem It Solves
[2-4 sentences. What real problem does this address? Who is the user?]

## How It Uses Stellar
[Which Stellar primitives / protocols / anchors / Soroban contracts. Be specific. This maps to Judging criterion 1.]

## GitHub Repository
[Link to your public repo. Final code must be on the `main` branch.]

## Network & Deployment
- Network: [testnet / mainnet]
- Live app URL (if any): [link or "runs locally — see README"]
- Contract IDs / asset issuers (if any): [list, or "N/A"]

## Team
- [Full Name] — @[github-username]
- [Full Name] — @[github-username]
- [up to 4 members]

## Novelty Note (optional, for bonus points)
[Did you check your idea against stellar-300-ideas.md and stellar_repos.txt? What makes yours different from what already exists?]

## Anything Else
[Optional: known limitations, what you'd build next, mentor shout-outs]
```

---

## Project README Template

Put this in **your project repo's** `README.md` (not in this hackathon repo).

```markdown
# [Project Name]

[One-line description]

## Problem
[What problem does this solve? Who has this problem? Why does it matter — Philippines relevance if applicable?]

## How It Works
[The core user flow, in plain language. What does a user actually do?]

## How It Uses Stellar
[Specific: payments, classic assets, trustlines, path payments, claimable balances,
Soroban contracts, anchors/SEPs, Soroswap/Blend/Reflector, etc. Why Stellar and not
something else?]

## Track
[Which StellarX Philippines track this is submitted to]

## Tech Stack
- Framework: [Next.js / React / SvelteKit / ...]
- Stellar SDK: @stellar/stellar-sdk v[version]
- Network: [testnet / mainnet]
- [other key dependencies]

## Setup & Run
[Step-by-step. A judge must be able to run this from these instructions alone.]

\`\`\`bash
git clone [your repo]
cd [your project]
npm install
# environment variables needed:
#   NEXT_PUBLIC_SOROBAN_RPC=...
#   ...
npm run dev
\`\`\`

## Network Details
- Network: [testnet / mainnet]
- RPC URL: [endpoint]
- Contract IDs: [if any]
- Asset issuers: [if any]

## Team
- [Name] — @[github-username]
- ...

## License
[MIT / Apache-2.0 / ...]
```

---

## Originality Rules

StellarX Philippines is about building something **new** during the hackathon.

**Allowed and encouraged:**
- Building **on top of** open Stellar protocols — Soroswap, Blend, Aquarius, Reflector, anchors, the `stellar-dev` skill, OpenZeppelin contracts, Scaffold Stellar.
- Using starter templates, scaffolds, and the [`stellar-fullstack-cheatsheet.md`](./stellar-fullstack-cheatsheet.md) as a base.
- Using AI tools to write and debug your code — see [`Recommended_AI_Tools.md`](./Recommended_AI_Tools.md) and [`Free_AI_Setup.md`](./Free_AI_Setup.md).
- Open-source libraries and SDKs.

**Not allowed:**
- Submitting a pre-existing project (yours or someone else's) as new hackathon work.
- Copying another team's project, or a project from another hackathon.
- Plagiarizing code or product design and presenting it as your own.
- Submitting a barely-modified template or example repo as a project.

> Projects that re-used or plagiarized other works may be reported and have any award cancelled. When in doubt, disclose it in your README and in the "Novelty Note" of your submission Issue — honesty is rewarded, hidden re-use is disqualified.

`[ORGANIZER: clarify your exact stance on prior personal work and pre-hackathon boilerplate — events differ on this.]`

---

## Pre-Submission Checklist

Before you open your submission Issue, confirm:

- [ ] All project code is pushed to a **public** GitHub repo, final work on **`main`**
- [ ] Repo has a **`LICENSE`** file (permissive)
- [ ] Repo has a complete **README** following the template above
- [ ] A judge could **run the project from the README alone**
- [ ] The project **actually runs** on Stellar testnet (or mainnet)
- [ ] The **core user flow works end to end** — you tested it
- [ ] Transactions are handled correctly — Soroban txs simulated, finality polled (see [`dev_setup`](./dev_setup))
- [ ] **Track** selected
- [ ] All **team members** listed with GitHub usernames
- [ ] Stellar is **core** to the product — re-read criterion 1 in [`JUDGING.md`](./JUDGING.md)
- [ ] Submission **Issue** opened on this repo with the correct title format and template filled in
- [ ] Submitted **before the deadline**

---

## Deadline

**`[ORGANIZER: submission deadline — date, time, and timezone]`**

The timestamp of your submission Issue is the official submission time. Late submissions `[ORGANIZER: are / are not]` accepted.

---

## After You Submit

- `[ORGANIZER: describe judging — e.g. judges review the video, then teams demo live to a mentor committee at their table.]`
- See [`JUDGING.md`](./JUDGING.md) for the full scoring rubric.
- Results announced: `[ORGANIZER: when and where]`

---

## Questions

`[ORGANIZER: add support channel — Discord, Telegram, email, mentor desk location, etc.]`

For Stellar technical questions, use **Stella** (the AI assistant at `https://developers.stellar.org`) and check [`dev_setup`](./dev_setup) and [`Resources`](./Resources) in this repo.

---

*Good luck. Build fast. Launch bigger.*