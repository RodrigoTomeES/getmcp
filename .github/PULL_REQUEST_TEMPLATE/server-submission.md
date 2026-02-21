## New Server Submission

### Server Details

| Field | Value |
|-------|-------|
| **ID** | `server-id` |
| **Name** | Server Name |
| **Transport** | stdio / http / streamable-http / sse |
| **Runtime** | node / python / docker / binary |
| **Package** | npm or PyPI package name |
| **Repository** | https://github.com/... |

### Description

<!-- Brief description of what this MCP server does -->

### Checklist

- [ ] Server file created at `packages/registry/src/servers/<id>.ts`
- [ ] Server registered in `packages/registry/src/index.ts` (import + register + re-export)
- [ ] Server added to test array in `packages/registry/tests/registry.test.ts`
- [ ] `version` field included (if `package` field is set)
- [ ] All tests pass (`npx vitest run`)
- [ ] Server ID is unique (not already in registry)
- [ ] Entry validates against `RegistryEntry` Zod schema

### Testing

<!-- How did you verify this server works? -->

### Additional Context

<!-- Any other relevant information -->
