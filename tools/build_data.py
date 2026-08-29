#!/usr/bin/env python3
"""Regenerate data.json for the 5-Bullet Friday resources site.

Input : a raw Notion page dump (the JSON returned by Town's notion_get_page,
        i.e. an object with a "content" array of blocks). Pass its path as argv[1].
Output: data.json (argv[2], default ./data.json) grouped by category.

The auto-update routine runs this after reading the Notion page, then commits
the resulting data.json to the repo so Netlify redeploys. Deterministic, no network.
"""
import json, re, sys, datetime

TYPEMAP = {"Books": "book", "Music": "music", "Videos": "video",
           "Articles & Essays": "essay", "Quotes": "quote"}

def split_note(text):
    m = re.split(r"\s{1,}\u2014\s{1,}", text, maxsplit=1)
    return (m[0].strip(), m[1].strip()) if len(m) == 2 else (text.strip(), "")

def split_title_author(main):
    parts = re.split(r"\s-\s", main, maxsplit=1)
    return (parts[0].strip(), parts[1].strip()) if len(parts) == 2 else (main.strip(), "")

def build(blocks):
    cats, cur, year = [], None, None
    for b in blocks:
        t = b.get("type")
        if t == "heading_2":
            name = b["text"].split("\u00b7")[0].strip()
            try:
                count = int(b["text"].split("\u00b7")[1].strip())
            except Exception:
                count = None
            cur = {"name": name, "type": TYPEMAP.get(name, "item"),
                   "countInSource": count, "items": []}
            cats.append(cur); year = None
        elif t == "heading_3":
            year = b["text"].strip()
        elif t == "bulleted_list_item" and cur is not None:
            main, note = split_note(b["text"])
            title, author = split_title_author(main)
            it = {"title": title, "year": year}
            if author: it["author"] = author
            if note: it["note"] = note
            cur["items"].append(it)
    return cats

def main():
    src = sys.argv[1] if len(sys.argv) > 1 else "notion_dump.json"
    out = sys.argv[2] if len(sys.argv) > 2 else "data.json"
    raw = json.load(open(src))
    blocks = raw.get("content", raw if isinstance(raw, list) else [])
    cats = build(blocks)
    data = {
        "meta": {
            "title": "Tim Ferriss \u00b7 5-Bullet Friday Resources",
            "sourceUrl": "https://app.notion.com/p/Tim-Ferriss-5-Bullet-Friday-Resources-by-Category-3cbb5fe0a04581b6aeadf4a21a2310b1",
            "totalInSource": 2886,
            "editions": 561,
            "coverage": "Books, Music and Videos are complete; Articles & Essays shows the most recent items reachable in this sync.",
            "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat().replace("+00:00", "Z"),
        },
        "categories": cats,
    }
    json.dump(data, open(out, "w"), ensure_ascii=False, indent=2)
    total = sum(len(c["items"]) for c in cats)
    print("Wrote %s: %d categories, %d items" % (out, len(cats), total))
    for c in cats:
        print("  %-20s %s" % (c["name"], len(c["items"])))

if __name__ == "__main__":
    main()
