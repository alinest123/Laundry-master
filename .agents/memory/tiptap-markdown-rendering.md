---
name: TipTap Markdown Rendering Fix
description: How to fix articles that render as blank or collapsed text because TipTap collapsed markdown newlines into one long line.
---

## The Problem
When raw markdown is pasted into TipTap (the rich-text editor), it either:
1. Wraps everything in `<p>## Heading body text</p>` (HTML path)
2. OR stores it as one long line with `## headings`, `---` rules, and `- lists` all embedded mid-line (raw path)

`marked` needs these elements at the **start of a line** to parse them as block-level constructs. Without newlines before them, the entire article renders as one unstyled paragraph.

## The Fix (two functions in `renderMarkdown`)

### `insertMarkdownNewlines(text)`
Inserts `\n\n` before block-level markers that appear mid-line:
- `## ` and `### ` headings
- `---` horizontal rules (both before and after)
- `- ` list items that follow sentence-ending punctuation
- `|table|` rows

### `splitMergedHeadingLines(text)`
For lines that start with a heading marker (`# …`), splits off trailing paragraph text that TipTap merged onto the same heading line. Two patterns:
1. After closing inline `*` or `_` marker + space + capital letter
2. After `.!?` + space + capital letter

## Call Order
Both functions must be called in **both** paths of `renderMarkdown`:
1. The HTML path (after stripping tags)
2. The raw-markdown path

Order: `insertMarkdownNewlines` first, then `splitMergedHeadingLines`.

## DB Side-Effect
The server-side TOC regex (`/^(#{1,3})\s+(.+)$/gm`) also needs newlines. If content was stored as one long line (e.g. after stripping a `<p>` wrapper), run `insertMarkdownNewlines` against the stored content and update the DB row. Otherwise the TOC API will return 1 entry instead of the full list.

**Why:** TipTap's internal representation collapses whitespace on paste; this is a known TipTap behaviour, not a bug in the article content.

**How to apply:** Any time an article shows blank body or has only 1 TOC entry, check whether the stored content is a single long line — if so, apply both functions client-side (done automatically by `renderMarkdown`) and update the DB row to fix server-side TOC generation.
