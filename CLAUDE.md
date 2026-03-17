# Lantern Lounge — Claude Code Guide

Member association website for The Lantern Lounge, a social club at 177 Bedford St, Lexington MA.
Domain: **lanternlounge.org** | GitHub org: **kofc94**

## Core principle: IaC first

Prefer infrastructure-as-code over manual changes. Any new cloud resource (AWS, GitHub, etc.) should be managed via OpenTofu in the `infrastructure/` directory before it is created manually. Use `tofu` (not `terraform`) for all IaC commands.

---

## Critical Rules 🚨

Under no circumpstance should any code rely on any sensitive value; the repository is public. Sensitive values are to be store in AWS Parameter Store.

Keep the README.md updated after each changes


## Repository structure

```
lantern-lounge/
├── app/                        # Application code
│   ├── react-webapp/           # React SPA (primary frontend)
├── infrastructure/             # OpenTofu infrastructure modules
│   ├── aws/                    # Core AWS infra (S3, CloudFront, Route53, ACM)
│   ├── app/                    # Application infra (Lambda, DynamoDB, API GW)
│   │   └── lambda/             # Python Lambda source code
│   ├── authentication/         # Cognito + Google OAuth
│   └── github/                 # GitHub repo & team management
├── ci/                         # Deployment scripts
└── artifacts/                  # Build artifacts
```

---

## Infrastructure (`infrastructure/`)

All modules share a remote state backend on S3:
- **Bucket**: `lanternlounge-tfstate`
- **Region**: `us-east-1`

### Modules

| Module | Path | What it manages |
|---|---|---|
| AWS core | `infrastructure/aws/` | S3 buckets, CloudFront, Route53, ACM certificate |
| Authentication | `infrastructure/authentication/` | Cognito User Pool, Google OAuth IdP, App Client |
| GitHub | `infrastructure/github/` | Repo settings, teams, memberships |

### Common commands

```bash
cd infrastructure/<module>
tofu init
tofu plan
tofu apply
```

---

## Application code (`app/`)

### `app/react-webapp/` — React SPA (primary frontend)

- **Stack**: React 19, Vite, Tailwind CSS, React Router v6, Amazon Cognito (auth)
- **Auth**: Cognito User Pool with Google OAuth via `amazon-cognito-identity-js`

```bash
cd app/react-webapp
npm install
npm run dev       # local dev server
npm run build     # production build to dist/
npm run lint
```

### `infrastructure/app/lambda/` — Calendar API (Python)

Python functions deployed as AWS Lambda. Handlers live in `api/` and `auth/` subdirectories. OpenTofu packages them automatically.

- **API Handlers**: `get_items.py`, `create_item.py`, `update_item.py`, `delete_item.py`
- **Auth Handler**: `post_confirmation.py`

### `app/webapp/` — Legacy site (vanilla HTML/CSS/JS)

Static site, kept for reference. New features go into `react-webapp`.

Local dev: open `index.html` in browser or `python -m http.server 8000`

---

## Deployment

CI scripts live in `ci/`. Deployment pushes built assets to S3 and invalidates CloudFront.

```bash
# Deploy react-webapp
cd app/react-webapp && npm run build
# Then run the appropriate ci/ deploy script
```

---

## AWS region & project defaults

---

## Design Context

### Users
Local residents of Lexington, MA and surrounding areas looking for a community-focused social club. Members use the site to check for events and log in, while prospective members visit to understand the "vibe" and join ($20/year). The context is social, relaxed, and local.

### Brand Personality
**Welcoming, Warm, Relaxing, Historic.**
The Lantern Lounge is the "coziest bar & social club" in Lexington. It should feel like a second home—a place to unwind with friends, steeped in local history and tradition.

### Aesthetic Direction
**Classic, Cozy, & Deep Vintage.**
Drawing on the heritage of a social club and a classic bar. The aesthetic leans into a rich, atmospheric "Vintage Parchment" style. It should feel like stepping into a dimly lit, high-end tavern or reading an aged, leather-bound ledger.

**Visual Goals:**
- **Warmth & Age:** Deep sepia tones, tea-stained parchment colors (`#f2eadd`, `#e9dfcc`), and rich burgundy/heritage red (`#8B0000`) for "pop".
- **Texture:** Heavy use of grain overlays, subtle radial vignettes, and multiply blending to mimic physical materials.
- **Lighting:** Soft, "lamp-lit" amber and red glows (using large blurred radial gradients) to create depth and atmosphere rather than harsh shadows.
- **Classic Typography:** `Playfair Display` for bold, impactful headings, paired with uppercase/tracked-out mono and sans-serif fonts for a structured, editorial feel.

### Design Principles
1. **Atmosphere over Polish:** Prioritize textures (grain, vignettes) and soft, glowing light over flat colors or generic "clean" UI shadows. It should feel physical and lived-in.
2. **Cozy over Cool:** Visual choices should evoke comfort and history (sepia, dark browns, deep reds) rather than cutting-edge tech (avoid neon, bright whites, pure blacks).
3. **Structured Hierarchy:** Use classic layout techniques—strong typography contrast, clear borders, and editorial spacing—to organize information.
4. **Community First:** Highlight the social aspects—events, shared spaces, and the "people" behind the club.
