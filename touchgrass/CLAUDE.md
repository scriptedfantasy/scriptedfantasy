# Touch Grass

Online exhibition "Touch Grass: Nature's Representation Online", co-curated by Lukas (human) and Claude. Digital only for now. The aim is an archive of digital artworks about nature (flora, fauna, landscape, ecology), similar in intent to Mindy Seu's Cyberfeminism Index.

This folder is served at https://scriptedfantasy.net/touchgrass/ (GitHub Pages, from `main`). The early interface prototype from 12.10.2026 lives in a separate repository, scriptedfantasy/touchgrass.

## Files

- `data/log.js`: the process log. Append new entries at the end.
- `data/research.js`: the longlist, with artists, candidate works and source links.
- `data/brief.js`: the artist list as Lukas first sent it, verbatim. Do not edit.
- `images/`: one image per work (`W001.jpg`), resized to 800px JPEG, shown on the public longlist. Lukas chose to commit them (29.10.2026).
- `build.js`: writes `index.html` from the data. Run `node touchgrass/build.js` after every data change and commit both. The site has no build step on deploy, and the PRD requires all content in the HTML.
- `board.css`: styles.

## Working rules from Lukas

- Claude does not rate or recommend fit. Judging which works fit the theme is Lukas's job. Keep fit ratings and evaluative wording out of the board and the data.
- The board is a log that takes its format from a play script. Every exchange gets an entry, with speakers LUKAS and CLAUDE plus italic stage directions for actions. Keep entries short. Dates go in `{ date: 'DD.MM.YYYY' }` rows. Mark the entry waiting on a reply with `open: true`, and remove that flag from the previous one.
- Black text on white, monospace, very concise.
- Lukas texts new artists, works and links by phone through Remote Control, to a desktop session on the office laptop. For each: research it, add it to `data/research.js`, fetch an image that shows the work, log the exchange, rebuild, commit, and push straight to `main` (standing permission for Touch Grass changes, given 29.10.2026). No pull request needed.

## Data conventions

- Artist `status`: longlist | in | maybe | out. Work `status`: candidate | selected | rejected. Only Lukas's decisions change these.
- `verified: true` currently means the title, year and venue were confirmed in web search results only. The cloud session that did the research could not open any source page. Every link still needs checking by hand.
- `named_in_brief` marks works Lukas named or confirmed.
- IDs (A01, W001) are positional. Renumber when artists or works are added or removed.

## Open threads (as of 29.10.2026)

- Images: 63 of 131 works have one in `images/`, recorded as `image` on the work (file, source page, original URL). Taken from each source page's preview image (og:image), and kept only where it shows the work. The rest had no source page that answered (403s from artnet, frieze, holo, ocula, nftnow, moma and others) or only logos and portraits. The rest still need images.
- Ivona Tau: the three OpenSea links each show a different edition than the one listed (W110 shows Mėnuo, W111 Auštra, W112 Žiburinis Ghost).
- Growing the archive: more works by the current 58 artists, or new artists beyond the list. Waiting on Lukas.
- Unconfirmed details: 0xfff "Tall Grass" (year and medium), Linda Dounia "Once Upon a Flower" (ArtPoint and Le Random both show an image; title, year, platform still open), Harold Cohen 0309-06 (what the image shows), and the identities of Noper and DeepBlack.
