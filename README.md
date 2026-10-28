# RDC Website

Website for the **Research and Development Center (RDC)** of the **Medical Colleges of Northern Philippines (MCNP)** and the **International School of Asia and the Pacific (ISAP)**.

The site provides institutional information, research agendas, journals, research resources, news and events, calendars, and Sustainable Development Goal (SDG) initiatives.

## Technology

- Static HTML, CSS, and JavaScript.
- Node.js build tools with esbuild for CSS/JavaScript minification.
- Sharp for image optimization and WebP generation.
- Puppeteer Core for browser-based validation.

## Getting started

1. Install a current Node.js LTS release and npm.
2. Clone the repository and install its dependencies:

   ```sh
   git clone https://github.com/mcnpisaprdc/rdc-website.git
   cd rdc-website
   npm ci
   ```

3. Build the site:

   ```sh
   npm run build
   ```

4. Serve the repository root with a local static web server, such as VS Code's Live Server extension, and open `index.html` through that server.

Use an HTTP server rather than opening pages with a `file://` URL so browser requests and relative resources behave as expected. There is no npm `start` or `dev` script.

## Project structure

| Path | Purpose |
| --- | --- |
| [index.html](index.html) | Homepage |
| Root HTML files | Institutional pages, journals, resources, calendars, news, and research initiatives |
| [css/](css/) | Shared and page-specific styles, alongside generated minified files |
| [js/](js/) | Shared and page-specific scripts, alongside generated minified files |
| [partials/header.html](partials/header.html) | Shared header used by the layout build |
| [assets/](assets/) | Logos, images, documents, journals, and other site media |
| [upload/](upload/) | Additional uploaded media |
| [share/](share/) | Social-sharing pages |
| [tools/](tools/) | Build, image optimization, and validation scripts |
| [scratch/](scratch/) | One-off maintenance scripts and working data; not the normal build entry point |
| [sitemap.xml](sitemap.xml), [robots.txt](robots.txt) | Search-engine discovery configuration |

## Development workflow

Edit the original HTML, CSS, and JavaScript sources, then rebuild. **Do not edit generated `.min.css` or `.min.js` files by hand.**

```sh
npm run build
```

The build runs in place rather than creating a separate `dist` directory. It:

1. Generates cross-page content metadata and social-sharing pages.
2. Injects the shared header into pages.
3. Minifies shared and page-specific CSS and JavaScript.
4. Adds content-hash query parameters to minified asset references for cache invalidation.

For header-only regeneration:

```sh
npm run layout
```

For image optimization:

```sh
npm run images
```

The image task processes images in `assets/` and `upload/`, generates WebP siblings, and updates HTML image attributes. **It can recompress original images in place**, so keep source backups and review the resulting diff before committing.

After changing content or assets, run the build, preview the affected pages at desktop and mobile widths, and review source and generated changes together.

## Validation

There is no npm `test` script. Validation scripts are available in [tools/](tools/). For example, check the generated content index and its browser behavior with:

```sh
node tools/test-content.js
```

Run `npm run build` first so generated content reflects your edits. This check uses Puppeteer Core, which does not download a browser. It detects common Windows Chrome/Edge locations, or you can supply an installed browser through `BROWSER_PATH`:

```powershell
$env:BROWSER_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node tools/test-content.js
```

Other checks cover responsive layouts, social sharing, and research utilization. Inspect each script's browser and server configuration before running it.

## Deployment

Serve the built site with a static web host, preserving the relative directory structure and using `index.html` as the homepage. Publish the HTML pages and their referenced assets, styles, scripts, documents, and sharing pages. Node.js is used for build tooling, not as a production application server.

Do not publish development-only directories such as `node_modules/`, `.git/`, or `scratch/`. When adding public pages or changing the deployed domain, review canonical/social URLs and update [sitemap.xml](sitemap.xml) and [robots.txt](robots.txt) as needed.
