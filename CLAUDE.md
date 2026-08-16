# AWS Guidance

<!--
Source: Agent Toolkit for AWS — rules/aws-agent-rules.md
https://github.com/aws/agent-toolkit-for-aws
Installed 2026-07-30 per setup-instructions/setup.md Step 7.
Refresh by re-fetching that file if the upstream rules change.
-->

- Prefer the AWS MCP Server for AWS interactions — it provides sandboxed
  execution, observability, and audit logging. If unavailable, use the
  AWS CLI directly.
- Before starting a task, check whether a relevant AWS skill is available.
  Load the skill with `retrieve_skill` and prefer its guidance over
  general knowledge.
- When uncertain about specific AWS details (API parameters, permissions,
  limits, error codes), verify against documentation rather than guessing.
  State uncertainty explicitly if you cannot confirm.
- When creating infrastructure, prefer infrastructure-as-code (AWS CDK or
  CloudFormation) over direct CLI commands.
- When working with infrastructure, follow AWS Well-Architected Framework
  principles.
- Do not use em dashes in AWS resource names or descriptions. Use
  hyphens instead.

## Secret Safety

- MUST load the `aws-secrets-manager` skill first for any secret,
  credential, API key, token, or password task. MUST NOT call
  `secretsmanager get-secret-value` or `batch-get-secret-value`, and MUST
  NOT hit the Secrets Manager Agent daemon directly. MUST use
  `{{resolve:secretsmanager:secret-id:SecretString:json-key}}` with
  `asm-exec` so the secret resolves at runtime without entering context.

## Local environment notes (this machine)

Agent Toolkit setup completed 2026-07-30: 16 skills in `~/.claude/skills`, and
the `aws-mcp` MCP server registered globally in `~/.claude.json`.

- **Two AWS CLI v2 installs exist, and the OLD one wins.**
  `C:\Program Files\Amazon\AWSCLIV2` (2.34.64, machine scope, **no
  `agent-toolkit` support**) precedes the newer user-local
  `C:\Users\Shrey\AppData\Local\Programs\Amazon\AWSCLIV2` (2.36.11), because
  Windows resolves Machine PATH before User PATH — so this cannot be fixed by
  editing User PATH. Until the old install is removed, `agent-toolkit` commands
  must use the full path to the 2.36.11 binary.
  Pending removal (needs an elevated shell):
  `msiexec /x "{7143C470-5E06-4488-854D-59371E3FDAA5}" /qn /norestart`
  (Keep `{FCC09FBB-DA44-4B46-8E0D-11BE370C1662}` — that is 2.36.11.)
- **`aws login` is not required.** The toolkit reaches its service fine using the
  existing static credentials in the `default` profile; `configure agent-toolkit`
  and `list-available-skills` both succeed without a browser sign-in.
- The `aws-mcp` server runs via `uvx mcp-proxy-for-aws@latest`. `uv` 0.12.0 was
  installed to `C:\Users\Shrey\.local\bin` (persisted in User PATH) to satisfy
  this — without it the MCP server silently fails to start.
- ⚠️ The MCP server inherits the `default` profile, whose key is
  `looplic-developer` — a member of a group with **`AdministratorAccess`** on the
  shared account `041149335823`. Treat AWS MCP actions as fully privileged until
  that key is scoped down or replaced.
- `~/.aws` was backed up to `~/.aws/backup-pre-agent-toolkit/` before toolkit
  setup. The `default` profile is used as `SRC_PROFILE` by
  `scripts/migrate/migrate.sh`; don't let anything overwrite it without restoring.
