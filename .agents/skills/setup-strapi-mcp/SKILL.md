---
name: setup-strapi-mcp
description: "One-time setup of Strapi MCP server for the local Strapi instance. Configures @bschauer/strapi-mcp-server so Agent can read schemas and write content via MCP. Triggers: setup strapi mcp, configure strapi mcp, connect strapi."
---

# Setup Strapi MCP Server

Configure `@bschauer/strapi-mcp-server` for the local Strapi instance so Agent can read schemas and write content via MCP tools.

## Prerequisites

Before starting, verify:

- Strapi is running locally at `http://localhost:1337`
- User has access to Strapi admin panel

## Steps

### 1. Check if Strapi is running

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:1337/api/health
```

- If **200**: Strapi is running, proceed.
- If health check fails, optionally check `http://localhost:1337/admin` as a secondary signal.
- If still failing or connection is refused: tell user to start Strapi first:
  ```bash
  pnpm dev
  ```
  Wait for user confirmation before proceeding.

### 2. Check if already configured

Check if `.mcp.json` exists at project root and already has a `strapi-local` entry. If so, ask user if they want to reconfigure or skip.

### 3. Get API token from user

Ask the user to create an API token with least privilege first, and fall back to full access only if required by their setup.

Recommended minimum access for this workflow:

- Read content types/components.
- Read/write target content entries.
- Upload media.

If role-scoped permissions are too complex in the local setup, full access is acceptable for local development.

> **Create a Strapi API token:**
>
> 1. Go to http://localhost:1337/admin
> 2. Navigate to **Settings** → **API Tokens**
> 3. Click **Create new API Token**
> 4. Name: `Agent MCP` (or any name)
> 5. Token type: least-privilege if possible, otherwise **Full access** for local-only usage
> 6. Click **Save** and copy the token
>
> Paste the token here.

Wait for the user to provide the token.

Security handling:

- Never echo the token value back in chat.
- Confirm receipt without printing the secret.

### 4. Create MCP server config

Create `~/.mcp/strapi-mcp-server.config.json`:

```json
{
  "local": {
    "api_url": "http://localhost:1337",
    "api_key": "<USER_PROVIDED_TOKEN>",
    "version": "5.*"
  }
}
```

- Create the `~/.mcp/` directory if it doesn't exist.
- If the config file already exists, read and merge. Preserve all existing top-level keys and only upsert the `local` key.

### 5. Register MCP server in project config

Create or update `.mcp.json` at the project root:

```json
{
  "mcpServers": {
    "strapi-local": {
      "command": "npx",
      "args": ["-y", "@bschauer/strapi-mcp-server@2.6.0"]
    }
  }
}
```

- If `.mcp.json` already exists, merge `strapi-local` into existing `mcpServers` without deleting other servers.
- Keep `@bschauer/strapi-mcp-server@2.6.0` as the default known-good version.
- If upgrading version, verify MCP tool compatibility before changing defaults.
- Do NOT commit this file during this task.

### 6. Add permissions to `.claude/settings.local.json`

If `.claude/settings.local.json` does not exist, create it with a minimal valid structure:

```json
{
  "permissions": {
    "allow": []
  }
}
```

Then add these MCP permissions to `permissions.allow` (skip duplicates):

```
"mcp__strapi-local__strapi_rest"
"mcp__strapi-local__strapi_upload_media"
"mcp__strapi-local__strapi_get_content_types"
"mcp__strapi-local__strapi_get_components"
"mcp__strapi-local__strapi_list_servers"
```

### 7. Verify connection

Tell the user:

> **MCP server configured!** To activate it:
>
> 1. Restart Agent Code (exit and re-enter this session)
> 2. Run `/setup-strapi-mcp` again — I'll verify the connection
>
> Or if the MCP server is already loaded, I'll verify now.

If Strapi MCP tools are available, verify by calling:

1. `strapi_list_servers()` — confirm the local instance is listed
2. `strapi_get_content_types()` — list available content types

Report success with available content types, or include the exact failure.

### 8. Return structured setup report

At the end, return:

```json
{
  "actions_taken": [],
  "created": [],
  "updated": [],
  "reused": [],
  "skipped": [],
  "errors": [],
  "manual_steps_needed": []
}
```

Include:

- Whether `~/.mcp/strapi-mcp-server.config.json` was created or merged.
- Whether `.mcp.json` was created or merged.
- Whether `.claude/settings.local.json` was created or updated.
- Whether MCP tools were verifiably reachable in the active session.

## Files Modified

| File                                   | Action                                               |
| -------------------------------------- | ---------------------------------------------------- |
| `~/.mcp/strapi-mcp-server.config.json` | Create or update (contains API token — never commit) |
| `.mcp.json`                            | Create or update (no secrets — safe to commit later) |
| `.claude/settings.local.json`          | Create or update permissions array                   |

## Troubleshooting

- **Connection refused**: Strapi isn't running. Start with `pnpm dev`.
- **401 Unauthorized**: API token is invalid or expired. Create a new one in Strapi admin.
- **MCP tools not available after config**: Restart Agent Code session to pick up new MCP servers.
- **`/api/health` fails but admin opens**: Strapi may still be booting or route registration failed. Retry after startup and inspect Strapi logs.
