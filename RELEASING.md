# Releasing

All three packages are released together with the same version.

| Package | Published from | Notes |
|---|---|---|
| `@ng-email/render` | `packages/render/dist` | built by ng-packagr. Publishing `packages/render` itself is blocked by a `prepublishOnly` guard |
| `@ng-email/components` | `packages/components/dist` | same as above |
| `@ng-email/cli` | `packages/cli` | `prepublishOnly` rebuilds it. `files` limits the tarball to `dist/`, `preview-ui/`, README and LICENSE |

Every package has `publishConfig.access: public`. Scoped packages are private by default, so publishing would otherwise fail with a payment error.

## One-time setup

1. Create the free **`ng-email`** organization at <https://www.npmjs.com/org/create> while logged in to your npm account.
2. Turn on two-factor authentication for publishing in your npm account settings.

## Each release

1. **Start from a clean, pushed `main`.**
   ```bash
   git status
   ```
2. **Bump the version** in `packages/render/package.json`, `packages/components/package.json` and `packages/cli/package.json`. In `packages/cli/package.json`, also bump the `@ng-email/render` peer range.
3. **Build and run every test.** This includes the end-to-end tests that render from a built bundle with plain `node`.
   ```bash
   npm test
   ```
4. **Dry-run the publish.** Use `publish --dry-run`, not `pack --dry-run`. Only publish applies npm's package.json validation, which can silently "auto-correct" fields. There must be **no** `npm warn publish … errors corrected` lines.
   ```bash
   (cd packages/render/dist && npm publish --dry-run) && (cd packages/components/dist && npm publish --dry-run) && npm publish --dry-run -w @ng-email/cli
   ```
5. **Log in.** This opens a browser.
   ```bash
   npm login
   ```
   ```bash
   npm whoami
   ```
6. **Publish in dependency order.** npm asks for a 2FA code, or opens a browser, for each package.
   ```bash
   npm publish packages/render/dist
   ```
   ```bash
   npm publish packages/components/dist
   ```
   ```bash
   npm publish -w @ng-email/cli
   ```
7. **Tag the release and push.**
   ```bash
   git tag v0.1.0
   ```
   ```bash
   git push origin main --tags
   ```
8. **Verify the release.**
   ```bash
   npm view @ng-email/render version && npm view @ng-email/components version && npm view @ng-email/cli version
   ```

## If something goes wrong

* **`402 Payment Required` or `You must sign up for private packages`:** the package was published without public access. Check `publishConfig` in the *published* `package.json` (for render/components, that is `dist/package.json`).
* **`404 Not Found - PUT .../@ng-email%2f… - Scope not found`:** the `ng-email` org doesn't exist, or your account isn't a member of it. Check with `npm org ls ng-email`.
* **`"bin[ng-email]" script name … was invalid and removed`:** npm 11 strips `bin` paths that start with `./`, and the CLI then ships without its `ng-email` command. Keep `"bin": { "ng-email": "dist/bin.js" }` with no leading `./`.
* **`npm publish packages/cli` fails with a git error:** npm reads a bare `a/b` path as a GitHub shorthand. Use `npm publish -w @ng-email/cli`, or `./packages/cli`.
* **A bad release:** prefer publishing a fixed patch version. `npm deprecate @ng-email/<pkg>@<version> "<reason>"` warns installers without breaking anyone. `npm unpublish` only works within 72 hours, and it blocks that version number forever.
