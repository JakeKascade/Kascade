# Validation record

## Earlier private-build validation

Before this change, Codex reported Node.js 24, npm and Next.js production build checks passing, with a 31-test suite including HTTP Basic authentication coverage. That earlier verification **does not automatically validate the new public-link configuration**.

## Public-link changes

- Deleted the HTTP Basic authentication gate and its credential helper.
- Deleted the access credentials example and authentication-specific unit tests.
- Removed the supplied proprietary font binaries from the public assets and replaced @font-face declarations with system font stacks. This avoids serving font files for which no public web-use licence has been verified.
- Replaced the HTTP authentication integration tests with a public-site smoke test. It checks unauthenticated homepage availability, retained noindex and anti-framing headers, logo availability, and absence of the original font binaries.
- Updated the browser typography assertion to verify the system-font fallback.

## Verification required after deployment

1. Confirm the `main` deployment builds and reaches READY.
2. Open the site in a new private browser window without credentials; the homepage and simulator should load.
3. Confirm the ELITA logo still renders correctly and the original `.ttf` and `.otf` URLs no longer resolve.
4. Check mobile and desktop readability following the font substitutions.
5. Run `npm test`, `npm run typecheck`, `npm run build`, `npm run test:security` and `npm run test:browser` in a current checkout. Do not describe the revised build as tested until those checks actually pass.

The financial model itself was not changed in this access-only revision. See `MODEL.md` for numerical assumptions and verification details.

**Confidentiality:** noindex is not access control. The public link is available to anyone who knows or receives it.
