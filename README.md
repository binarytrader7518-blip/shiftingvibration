# Shifting Vibrations: https://shiftingvibration.vercel.app

Static multi-page site for Vercel (no build step).

## Deploy
1. Upload this folder's contents (index.html at the root) to the Vercel project for shiftingvibration.vercel.app.
   Framework preset: "Other", no build command, output directory = root.
2. After deploying, check:
   - https://shiftingvibration.vercel.app/order?package=1 shows the order page
   - https://shiftingvibration.vercel.app/go/1 returns 307 to the ClickBank link
   - https://shiftingvibration.vercel.app/key.txt returns the key
3. Run `node scripts/indexnow.mjs` (Node 18+) to notify IndexNow. Re-run it after every update; it only submits changed pages.

## Bing Webmaster Tools checklist
1. Sign in at bing.com/webmasters → Add site → https://shiftingvibration.vercel.app/ (or import from Google Search Console).
2. Verify with the XML file or meta-tag option Bing gives you (add the meta tag inside <head> of index.html if you choose that).
3. Sitemaps → submit https://shiftingvibration.vercel.app/sitemap.xml.
4. URL Submission → submit the homepage and key pages; check them with URL Inspection.
5. Check IndexNow → "IndexNow" report shows received URLs (received ≠ indexed).
6. Monitor Crawl errors and Search Performance (impressions, clicks, queries) weekly.
Google: add the property in Search Console and submit the same sitemap.
