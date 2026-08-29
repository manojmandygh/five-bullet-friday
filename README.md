# 5-Bullet Friday · Resources by Category

An independent, fan-made editorial index of every book, album, video and essay
Tim Ferriss has recommended in his **5-Bullet Friday** newsletter. Built with
admiration by [Manoj (@manojmandy)](https://x.com/manojmandy) — a huge fan of Tim Ferriss.

> This is an unofficial tribute. It is not affiliated with, sponsored by, or endorsed
> by Tim Ferriss. All credit for the recommendations — and for the newsletter itself —
> belongs to Tim. If you enjoy this, please subscribe to 5-Bullet Friday at
> [tim.blog/friday](https://tim.blog/friday).

## What it does

- **Books & Music** render as a cover-art grid. Covers are fetched lazily in the
  browser from public catalogues (Google Books, Apple iTunes) — nothing is bundled.
- **Videos** render as clean cards that link to a YouTube search.
- **Articles & Essays** render as a minimalist editorial list.
- **Quotes** (when present in the data) render as pull-quotes.
- A live **search** filters across every category; each section has **Load more**.
- A **Subscribe** module routes visitors to Tim's official 5-Bullet Friday signup —
  no email is collected or stored by this site.

## Structure

```
index.html      · landing page + section shells
styles.css      · editorial design system
app.js          · data rendering, lazy cover art, search, subscribe routing
data.json       · the resource list, grouped by category (Notion-sourced)
privacy.html    · privacy note
netlify.toml    · security headers (HSTS, strict CSP, etc.)
robots.txt
assets/         · tim-ferriss.jpg (portrait), social-card.jpg
```

The site reads from `data.json` at runtime, so **updating the site = replacing
`data.json`**. Nothing else needs to change.

## Deploy to Netlify

1. Push this folder to a GitHub repo (e.g. `manojmandygh/five-bullet-friday`).
2. In Netlify → **Add new site → Import from Git** → pick the repo.
3. Build command: *(none)* · Publish directory: `.`
4. Deploy. Netlify redeploys automatically on every push to `main`.

## Auto-update from Notion

`data.json` is generated from the Notion source page
("Tim Ferriss — 5-Bullet Friday | Resources by Category"). A scheduled Town routine
re-reads the Notion page, regenerates `data.json`, and commits it to this repo —
which triggers a fresh Netlify deploy. So edits in Notion flow to the live site
automatically.

**Known limit:** the Notion reader returns the first 1,000 blocks of the page, which
fully covers Books, Music and Videos plus the most recent Essays. To sync the full
2,886-item archive (including the Quotes section), split the Notion source into
per-category pages (each under 1,000 blocks) or move it to a Notion database — then
the routine can page through everything.

## Credits

- Recommendations & newsletter: **Tim Ferriss** — [tim.blog](https://tim.blog)
- Portrait: Jeff Kubina, CC BY-SA 2.0, via Wikimedia Commons
- Book covers: Google Books · Album art: Apple iTunes
- Built by: [Manoj (@manojmandy)](https://x.com/manojmandy)
