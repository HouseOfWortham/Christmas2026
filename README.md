# Christmas, together — Holiday Hub

A responsive, static family holiday hub built with HTML, CSS, and vanilla JavaScript. There is no build step, server, account, or third-party application dependency.

## Run locally

Open `index.html` in a browser, or serve the folder with any static web server. Home, Gift Registry, Cruise, and At home are separate hash-addressable pages. The gift registry has separate catalogs for Mom, Dad, Tritan, Athena, Paris, Taylor, Alton, Apollo, and Rachel. Choose a person to add wishes or browse their catalog; each wish can include an Amazon or Giftster link. Wishes are entered individually—the static site does not import or scrape list contents from those services. The site uses browser local storage for the cruise date, gift wishes, cruise sign-ups, and potluck entries.

**Important:** local storage belongs to one browser on one device. It does not sync or share changes with other family members or site visitors. Gift links are limited to Amazon and Giftster. The example itinerary and home-calendar details can be edited directly in `index.html`.

## Publish with GitHub Pages

1. Create a GitHub repository and push these files to its default branch:

   ```bash
   git add index.html styles.css app.js README.md
   git commit -m "Build the family holiday hub"
   git push -u origin main
   ```

2. In the repository on GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**.
4. Choose the `main` branch and the `/ (root)` folder, then select **Save**.
5. Wait for the Pages deployment to finish. The site URL will appear on the Pages settings screen.

If the repository uses a different default branch, select that branch instead of `main`. Because this is a static site with relative asset paths and no client-side router, it works from both a user-site and a project-site GitHub Pages URL.
