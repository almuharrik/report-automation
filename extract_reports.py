#!/usr/bin/env python3
"""Extract all PDF performance reports from Report_Archive into Markdown.

Output: each PDF -> Report-Archieve-MD/<filename>.md
"""
import os
import re
import datetime

import pymupdf

SRC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Report_Archive")
DST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Report-Archieve-MD")

# Standalone page-number lines (like the cover/footer footers) get dropped.
# Only drop a pure-number line when it is a single token that is all digits.
DIGIT_RE = re.compile(r"^\d+$")


def clean_page_text(text):
    """Turn raw page text into clean markdown lines."""
    lines = []
    for raw in text.splitlines():
        line = raw.strip()
        # Drop standalone page-number lines that are just a number
        if DIGIT_RE.match(line):
            continue
        if not line:
            lines.append("")
            continue
        # Normalise the "Click Here" / "Klik Disini" link footnote
        if "Click Here" in line or "Klik Disini" in line or "Klik disini" in line:
            line = ""
        # Collapse repeated blank separators
        if line == "" and lines and lines[-1] == "":
            continue
        lines.append(line)
    return "\n".join(lines)


def extract(pdf_path):
    doc = pymupdf.open(pdf_path)
    pages = []
    for i, page in enumerate(doc):
        text = page.get_text()
        cleaned = clean_page_text(text)
        if cleaned.strip():
            # group consecutive blank lines to a clear page separator
            pages.append(cleaned)
    doc.close()
    return pages


def md_filename(pdf_path):
    base = os.path.basename(pdf_path)
    name = os.path.splitext(base)[0]
    return name + ".md"


def main():
    os.makedirs(DST_DIR, exist_ok=True)
    pdfs = sorted(
        f for f in os.listdir(SRC_DIR)
        if f.lower().endswith(".pdf")
    )
    print(f"Found {len(pdfs)} PDFs in {SRC_DIR}")

    ts = datetime.date.today().isoformat()
    for pdf in pdfs:
        src = os.path.join(SRC_DIR, pdf)
        out = os.path.join(DST_DIR, md_filename(pdf))
        pages = extract(src)
        with open(out, "w", encoding="utf-8") as fh:
            fh.write(f"# {pdf}\n")
            fh.write(f"- **Sumber:** `{pdf}`\n")
            fh.write(f"- **Jumlah halaman:** {len(pages)}\n")
            fh.write(f"- **Di-extract:** {ts}\n")
            fh.write("\n---\n\n")
            for p in pages:
                fh.write(p + "\n\n")
        print(f"  wrote {out} ({len(pages)} pages)")
    print("Done.")


if __name__ == "__main__":
    main()
