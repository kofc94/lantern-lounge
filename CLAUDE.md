# Lantern Lounge — Claude Code Guide

Member association website for The Lantern Lounge, a social club at 177 Bedford St, Lexington MA.
Domain: **lanternlounge.org** | GitHub org: **kofc94**

## Core principle: IaC first

Prefer infrastructure-as-code over manual changes. Any new cloud resource (AWS, GitHub, etc.) should be managed via OpenTofu in the `infrastructure/` directory or within the project folders before it is created manually. Use `tofu` (not `terraform`) for all IaC commands.

---

## Critical Rules 🚨

Under no circumstance should any code rely on any sensitive value; the repository is public. Sensitive values are to be stored in AWS Parameter Store or managed via OpenTofu secrets.

Keep the documentation updated after each change.

## The infrastructure folder

The `infrastructure/` folder contains the OpenTofu scripts needed to bootstrap the platform core — OIDC roles, permissions, Google Cloud project, and GitHub repository settings.

## The app folder

The `app/` folder contains all the sub-projects. Each project is self-contained (including its own infrastructure where applicable) and must implement a `Makefile` with the following targets:
- `build`: Prepares the project (e.g., `npm install` or `tofu init`)
- `test`: Runs validations (e.g., `npm run lint` or `tofu plan`)
- `deploy`: Deploys the project to production

The CI/CD pipelines rely on these `make` commands.

## Repository structure

```
lantern-lounge/
├── app/                        # Application code & project-specific infra
│   ├── react-webapp/           # React SPA (primary frontend)
│   ├── cognito/                # Cognito User Pool & Auth logic
│   └── calendar/               # Calendar API (Lambda & DynamoDB)
├── infrastructure/             # Core platform infrastructure
│   ├── aws/                    # Core AWS infra (S3, CloudFront, Route53, ACM)
│   ├── google/                 # Google Cloud project & IdP bootstrap
│   └── github/                 # GitHub repo & team management
├── .agents/                    # AI Agent skills and guidelines
├── skills-lock.json            # Lock file for AI Agent skills
└── artifacts/                  # Build artifacts
```

---

## Infrastructure

All modules share a remote state backend on S3:
- **Bucket**: `lanternlounge-tfstate`
- **Region**: `us-east-1`

### Modules

| Module | Path | What it manages |
|---|---|---|
| AWS core | `infrastructure/aws/` | S3 buckets, CloudFront, Route53, ACM certificate |
| Authentication | `app/cognito/` | Cognito User Pool, Google OAuth IdP, Post-confirmation Lambda |
| Calendar API | `app/calendar/` | DynamoDB, API Gateway, Lambda functions |
| GitHub | `infrastructure/github/` | Repo settings, teams, memberships, secrets |

---

## Application code (`app/`)

### `app/react-webapp/` — React SPA

- **Stack**: React 19, Vite, Tailwind CSS, Amazon Cognito
- **Config**: Tooling configs (Vite, ESLint, PostCSS, Tailwind) are in `config/`

```bash
cd app/react-webapp
make build     # install deps and build
make test      # run lint
make deploy    # build and sync to S3 + invalidate CloudFront
```

### `app/calendar/` — Calendar API (Python)

Python functions deployed as AWS Lambda. Handles CRUD for calendar events via DynamoDB. Infrastructure is managed via OpenTofu within this directory.

```bash
cd app/calendar
make build     # tofu init
make test      # tofu plan
make deploy    # tofu apply
```

---

## Deployment

Deployment is standardized across all projects using `make deploy`.

```bash
# Example: Deploy the frontend
cd app/react-webapp && make deploy

# Example: Deploy the calendar API
cd app/calendar && make deploy
```

---

## AWS region & project defaults

- **Region**: `us-east-1`
- **Project name**: `lantern-lounge`
- **Environment**: `production`

<!-- dgc-policy-v11 -->
# Dual-Graph Context Policy

This project uses a local dual-graph MCP server for efficient context retrieval.

## MANDATORY: Always follow this order

1. **Call `graph_continue` first** — before any file exploration, grep, or code reading.

2. **If `graph_continue` returns `needs_project=true`**: call `graph_scan` with the
   current project directory (`pwd`). Do NOT ask the user.

3. **If `graph_continue` returns `skip=true`**: project has fewer than 5 files.
   Do NOT do broad or recursive exploration. Read only specific files if their names
   are mentioned, or ask the user what to work on.

4. **Read `recommended_files`** using `graph_read` — **one call per file**.
   - `graph_read` accepts a single `file` parameter (string). Call it separately for each
     recommended file. Do NOT pass an array or batch multiple files into one call.
   - `recommended_files` may contain `file::symbol` entries (e.g. `src/auth.ts::handleLogin`).
     Pass them verbatim to `graph_read(file: "src/auth.ts::handleLogin")` — it reads only
     that symbol's lines, not the full file.
   - Example: if `recommended_files` is `["src/auth.ts::handleLogin", "src/db.ts"]`,
     call `graph_read(file: "src/auth.ts::handleLogin")` and `graph_read(file: "src/db.ts")`
     as two separate calls (they can be parallel).

5. **Check `confidence` and obey the caps strictly:**
   - `confidence=high` -> Stop. Do NOT grep or explore further.
   - `confidence=medium` -> If recommended files are insufficient, call `fallback_rg`
     at most `max_supplementary_greps` time(s) with specific terms, then `graph_read`
     at most `max_supplementary_files` additional file(s). Then stop.
   - `confidence=low` -> Call `fallback_rg` at most `max_supplementary_greps` time(s),
     then `graph_read` at most `max_supplementary_files` file(s). Then stop.

## Token Usage

A `token-counter` MCP is available for tracking live token usage.

- To check how many tokens a large file or text will cost **before** reading it:
  `count_tokens({text: "<content>"})`
- To log actual usage after a task completes (if the user asks):
  `log_usage({input_tokens: <est>, output_tokens: <est>, description: "<task>"})`
- To show the user their running session cost:
  `get_session_stats()`

Live dashboard URL is printed at startup next to "Token usage".

## Rules

- Do NOT use `rg`, `grep`, or bash file exploration before calling `graph_continue`.
- Do NOT do broad/recursive exploration at any confidence level.
- `max_supplementary_greps` and `max_supplementary_files` are hard caps - never exceed them.
- Do NOT dump full chat history.
- Do NOT call `graph_retrieve` more than once per turn.
- After edits, call `graph_register_edit` with the changed files. Use `file::symbol` notation (e.g. `src/auth.ts::handleLogin`) when the edit targets a specific function, class, or hook.

## Context Store

Whenever you make a decision, identify a task, note a next step, fact, or blocker during a conversation, call `graph_add_memory`.

**To add an entry:**
```
graph_add_memory(type="decision|task|next|fact|blocker", content="one sentence max 15 words", tags=["topic"], files=["relevant/file.ts"])
```

**Do NOT write context-store.json directly** — always use `graph_add_memory`. It applies pruning and keeps the store healthy.

**Rules:**
- Only log things worth remembering across sessions (not every minor detail)
- `content` must be under 15 words
- `files` lists the files this decision/task relates to (can be empty)
- Log immediately when the item arises — not at session end

## Session End

When the user signals they are done (e.g. "bye", "done", "wrap up", "end session"), proactively update `CONTEXT.md` in the project root with:
- **Current Task**: one sentence on what was being worked on
- **Key Decisions**: bullet list, max 3 items
- **Next Steps**: bullet list, max 3 items

Keep `CONTEXT.md` under 20 lines total. Do NOT summarize the full conversation — only what's needed to resume next session.
