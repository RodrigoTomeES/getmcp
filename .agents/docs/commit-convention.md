# Commit Convention

This project follows the [Conventional Commits v1.0.0](https://www.conventionalcommits.org/en/v1.0.0/) specification. All commit messages must be structured as:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

| Type       | Purpose                                               |
| ---------- | ----------------------------------------------------- |
| `feat`     | A new feature                                         |
| `fix`      | A bug fix                                             |
| `docs`     | Documentation-only changes                            |
| `style`    | Code style changes (formatting, whitespace, etc.)     |
| `refactor` | Code changes that neither fix a bug nor add a feature |
| `perf`     | Performance improvements                              |
| `test`     | Adding or updating tests                              |
| `build`    | Changes to the build system or dependencies           |
| `ci`       | Changes to CI configuration                           |
| `chore`    | Other changes that don't modify src or test files     |

## Scopes

Use the package name as scope when the change is specific to one package:

- `core`, `generators`, `registry`, `cli`, `web`

## Examples

```
feat(generators): add support for new AI app
fix(cli): handle missing config file gracefully
docs: update CLAUDE.md with commit convention
test(registry): add search edge case tests
refactor(core): simplify transport inference logic
chore: update dependencies
feat(web)!: redesign server detail page layout
```

Breaking changes must include `!` after the type/scope or a `BREAKING CHANGE:` footer.
