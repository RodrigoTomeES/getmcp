## New Server Submission

### Server Details

| Field          | Value                                |
| -------------- | ------------------------------------ |
| **ID**         | `server-id`                          |
| **Name**       | Server Name                          |
| **Transport**  | stdio / http / streamable-http / sse |
| **Runtime**    | node / python / docker / binary      |
| **Package**    | npm or PyPI package name             |
| **Repository** | https://github.com/...               |

### Description

<!-- Brief description of what this MCP server does -->

### Checklist

- [ ] JSON file created at `packages/registry/servers/<id>.json`
- [ ] `$schema` field set to `"https://getmcp.es/registry-entry.schema.json"`
- [ ] Filename matches `id` field (e.g., `my-server.json` contains `"id": "my-server"`)
- [ ] All tests pass (`npx vitest run`)
- [ ] Server ID is unique (not already in registry)
- [ ] Entry validates against `RegistryEntry` Zod schema (verified automatically at build time)

### Testing

<!-- How did you verify this server works? -->

### Additional Context

<!-- Any other relevant information -->
