#!/usr/bin/env python3
"""Convert markdown to a styled PDF with CJK support."""
import sys
import re
from pathlib import Path

import markdown
from weasyprint import HTML, CSS


CSS_STYLE = """
@page {
  size: A4;
  margin: 22mm 18mm 22mm 18mm;
  @top-right {
    content: "入境中国医疗旅游平台";
    font-family: "WenQuanYi Zen Hei", sans-serif;
    font-size: 9pt;
    color: #888;
  }
  @bottom-center {
    content: counter(page) " / " counter(pages);
    font-family: "WenQuanYi Zen Hei", sans-serif;
    font-size: 9pt;
    color: #888;
  }
}

@page :first {
  @top-right { content: ""; }
  @bottom-center { content: ""; }
}

* {
  box-sizing: border-box;
}

html, body {
  font-family: "WenQuanYi Zen Hei", "Noto Sans CJK SC", "Source Han Sans", sans-serif;
  font-size: 10.5pt;
  line-height: 1.65;
  color: #222;
}

h1 {
  font-size: 22pt;
  color: #0d4d4d;
  border-bottom: 2px solid #0d4d4d;
  padding-bottom: 6pt;
  margin-top: 24pt;
  margin-bottom: 14pt;
  page-break-before: always;
  page-break-after: avoid;
}

h1:first-of-type {
  page-break-before: auto;
}

h2 {
  font-size: 16pt;
  color: #166060;
  margin-top: 18pt;
  margin-bottom: 10pt;
  border-left: 4px solid #1a8585;
  padding-left: 10pt;
  page-break-after: avoid;
}

h3 {
  font-size: 13pt;
  color: #1a8585;
  margin-top: 14pt;
  margin-bottom: 8pt;
  page-break-after: avoid;
}

h4 {
  font-size: 11.5pt;
  color: #444;
  margin-top: 12pt;
  margin-bottom: 6pt;
  page-break-after: avoid;
}

p {
  margin: 6pt 0;
  text-align: justify;
}

ul, ol {
  margin: 6pt 0;
  padding-left: 22pt;
}

li {
  margin: 3pt 0;
}

strong {
  color: #0d4d4d;
  font-weight: bold;
}

em {
  color: #444;
  font-style: italic;
}

code {
  font-family: "Courier New", monospace;
  background: #f4f6f6;
  padding: 1pt 4pt;
  border-radius: 2pt;
  font-size: 9.5pt;
  color: #c0392b;
}

pre {
  background: #f7f9f9;
  border: 1px solid #d8e0e0;
  border-left: 4px solid #1a8585;
  padding: 10pt 12pt;
  font-family: "Courier New", monospace;
  font-size: 9pt;
  line-height: 1.45;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  page-break-inside: avoid;
  margin: 8pt 0;
}

pre code {
  background: none;
  padding: 0;
  color: #333;
}

blockquote {
  border-left: 4px solid #d4a017;
  background: #fdf9ec;
  padding: 8pt 12pt;
  margin: 8pt 0;
  color: #5a4a10;
  page-break-inside: avoid;
}

blockquote p {
  margin: 3pt 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
  margin: 10pt 0;
  page-break-inside: avoid;
}

table th {
  background: #0d4d4d;
  color: white;
  padding: 6pt 8pt;
  text-align: left;
  border: 1px solid #0d4d4d;
  font-weight: bold;
}

table td {
  padding: 5pt 8pt;
  border: 1px solid #d0d8d8;
  vertical-align: top;
}

table tr:nth-child(even) td {
  background: #f7f9f9;
}

hr {
  border: none;
  border-top: 1px solid #ccd5d5;
  margin: 16pt 0;
}

a {
  color: #1a8585;
  text-decoration: none;
}

/* Title page */
.title-page {
  page-break-after: always;
  text-align: center;
  padding-top: 18%;
}

.title-page h1 {
  font-size: 30pt;
  border: none;
  color: #0d4d4d;
  margin-bottom: 6pt;
  page-break-before: auto;
}

.title-page .subtitle {
  font-size: 14pt;
  color: #555;
  margin-bottom: 60pt;
}

.title-page .meta {
  font-size: 11pt;
  color: #777;
  margin-top: 80pt;
}

.title-page .meta-line {
  margin: 4pt 0;
}

.title-page .accent {
  width: 80pt;
  height: 3pt;
  background: #d4a017;
  margin: 30pt auto;
}
"""


def build_title_page(title, subtitle, meta_lines):
    meta_html = "\n".join(f'<div class="meta-line">{ln}</div>' for ln in meta_lines)
    return f"""
<div class="title-page">
  <h1>{title}</h1>
  <div class="accent"></div>
  <div class="subtitle">{subtitle}</div>
  <div class="meta">{meta_html}</div>
</div>
"""


def md_to_pdf(md_path, pdf_path, title, subtitle, meta_lines):
    md_text = Path(md_path).read_text(encoding="utf-8")

    # Strip the first H1 from markdown body (we use a custom title page)
    md_text = re.sub(r"^# .+?\n", "", md_text, count=1, flags=re.MULTILINE)

    body_html = markdown.markdown(
        md_text,
        extensions=["tables", "fenced_code", "toc", "sane_lists"],
    )

    full_html = f"""<!doctype html>
<html lang="zh">
<head>
<meta charset="utf-8">
<title>{title}</title>
</head>
<body>
{build_title_page(title, subtitle, meta_lines)}
{body_html}
</body>
</html>
"""

    HTML(string=full_html).write_pdf(
        pdf_path,
        stylesheets=[CSS(string=CSS_STYLE)],
    )
    print(f"Generated: {pdf_path}")


if __name__ == "__main__":
    md = sys.argv[1]
    pdf = sys.argv[2]
    title = sys.argv[3]
    subtitle = sys.argv[4]
    meta = sys.argv[5:] if len(sys.argv) > 5 else []
    md_to_pdf(md, pdf, title, subtitle, meta)
