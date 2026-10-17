# TheGo2Guys website

Source for thego2guys.uk, a single Cloudflare Worker (`src/index.js`).
Pushing to `main` deploys automatically via Cloudflare Workers Builds.

## Adding a cost guide
1. Add a page function like `extensionGuidePage()` in `src/index.js`.
2. Register its path in the routes map next to `'/guides/house-extension-cost'`.
3. Add a card for it in `guidesIndexPage()`.
4. Add the path to the sitemap `paths` list.
