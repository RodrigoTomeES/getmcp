# Publishing

This project uses an **auto-release workflow** (`.github/workflows/publish.yml`) that detects version bumps from conventional commits, bumps all workspace packages in sync, publishes to npm via OIDC trusted publishing, and creates a GitHub Release with changelog.

## Trigger Paths

| Trigger                        | Behavior                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| **Push to `main`** (non-docs)  | Scans conventional commits since last tag: `feat:` → minor, `fix:`/`perf:`/etc. → patch, `docs:`/`ci:` only → skip |
| **Tag push `v*`**              | Validates package versions match the tag, publishes directly (no version bump)                                     |
| **Manual `workflow_dispatch`** | Choose `patch` or `minor` explicitly from the Actions UI                                                           |

## How it works

1. **Version detection** — Conventional commits are scanned to determine bump type (minor/patch/none)
2. **Version bump** — `npm version $BUMP --no-git-tag-version --workspaces` bumps all 4 publishable packages in sync
3. **Commit & tag** — Creates `chore(release): vX.Y.Z [skip ci]` commit + tag, pushes with `--follow-tags`
4. **Build & test** — Runs `npm run build` and `npm run test` before publishing
5. **Publish** — Each package checks if already published (idempotent), then publishes in dependency order: `core` → `generators` → `registry` → `cli`
6. **GitHub Release** — Creates a release with changelog from merged PRs (falls back to commit log) using `.github/RELEASE_TEMPLATE.md`

## OIDC Trusted Publishing

Authentication uses [npm trusted publishing with OIDC](https://docs.npmjs.com/trusted-publishers) — a tokenless flow.

## Rules

- **NEVER** add `NODE_AUTH_TOKEN` or `NPM_TOKEN` environment variables to the publish workflow
- **NEVER** create or store npm access tokens in repository secrets for publishing
- **DO** keep `permissions: id-token: write` in the publish workflow — this is what enables OIDC
- **DO** keep `registry-url: https://registry.npmjs.org` in the `actions/setup-node` step — this is required for the npm CLI to detect the OIDC environment
- Provenance attestations are generated automatically when publishing via trusted publishing

## Edge Cases

| Scenario                                        | How it's handled                                                                 |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Infinite loop (version bump commit re-triggers) | `[skip ci]` in commit message + HEAD commit message guard                        |
| Double trigger (commit + tag push)              | `git push --follow-tags` atomic push + concurrency group                         |
| Partial publish failure                         | Each publish step checks `npm view` before attempting; safe to re-run            |
| No tags exist yet (first release)               | `git describe` fallback to empty string; scans all commits                       |
| Docs-only commits                               | `paths-ignore: ['**/*.md']` skips workflow; commit detection also outputs `none` |

## References

- [npm trusted publishing docs](https://docs.npmjs.com/trusted-publishers)
- [GitHub Actions OIDC documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [npm trusted publishing announcement](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
