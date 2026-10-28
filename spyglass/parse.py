"""Extract structured text from uploaded documents.

Every parser returns a common structure-preserving intermediate representation:
a list of blocks, each carrying its text (1+ paragraphs separated by \n\n),
a section breadcrumb (from surrounding headings), and a 1-based page number
when the source format carries pages (PDF) or a rough page estimate.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Block:
    text: str
    section: str = ""          # heading breadcrumb like "2. Refunds > Exceptions"
    page: int = 1              # 1-based page number (PDF pages; estimated elsewhere)
    kind: str = "paragraph"    # paragraph | heading


@dataclass
class ParsedDoc:
    title: str
    blocks: list[Block] = field(default_factory=list)

    @property
    def full_text(self) -> str:
        return "\n\n".join(b.text for b in self.blocks)


_HEADING_PAT = re.compile(r"^(#{1,6})\s+(.*)$")


# --------------------------------------------------------------------------- #
# Generic text with heading/paragraph heuristics (txt/md)
# --------------------------------------------------------------------------- #

def _parse_lines_like_document(raw: str, is_markdown: bool) -> ParsedDoc:
    lines = raw.splitlines()
    blocks: list[Block] = []
    crumb: list[str] = []
    buf: list[str] = []

    def consume(level_hint: int = 0) -> None:
        joiner = "\n" if is_markdown else " "
        text = joiner.join(s.strip() for s in buf).strip()
        buf.clear()
        if not text:
            return
        # Detect capitalized "title-ish standalone lines" in plain text files.
        if not is_markdown and not crumb and _looks_like_title(text.splitlines()[0]):
            blocks.append(Block(text=text, section="", page=1, kind="heading"))
            crumb.append(text.splitlines()[0][:120])
            return
        joiner2 = "\n"
        section = " > ".join(x for x in crumb if x)
        blocks.append(Block(text=text, section=section, page=1 + (len(blocks) // 40), kind="paragraph"))

    level_stack: list[tuple[int, str]] = []
    for line in lines:
        if is_markdown:
            m = _HEADING_PAT.match(line)
            if m:
                consume()
                level = len(m.group(1))
                text = m.group(2).strip()
                while level_stack and level_stack[-1][0] >= level:
                    level_stack.pop()
                # Heading itself is a block (for retrieval) and joins the breadcrumb.
                blocks.append(Block(text=text, section=" > ".join(t for _, t in level_stack) or "", page=1 + (len(blocks) // 40), kind="heading"))
                level_stack.append((level, text))
                crumb = [t for _, t in level_stack]
                continue
        if not line.strip():
            consume()
            continue
        buf.append(line)
    consume()
    title = ""
    for b in blocks:
        if b.kind == "heading" or (is_markdown and b.section == ""):
            title = b.text.splitlines()[0][:120]
            break
    if not title and blocks:
        title = blocks[0].text.splitlines()[0][:120]
    return ParsedDoc(title=title or "Untitled", blocks=blocks)


_TITLE_KEEPS = re.compile(r"^[A-Z0-9][A-Za-z0-9 ,:;()\-]{6,60}$")
_ALLCAPS = re.compile(r"^[A-Z][A-Z0-9 ,:;()\-]{6,60}$")


def _looks_like_title(text: str) -> bool:
    if _ALLCAPS.match(text):
        return True
    return _TITLE_KEEPS.match(text) is not None and not text.endswith((".", "!", "?"))


def read_txt(path: Path) -> ParsedDoc:
    """Supports sidecar headings: lines like '=== Title ===' also count as headings."""
    raw = path.read_text(encoding="utf-8", errors="replace")
    return _parse_lines_like_document(raw, is_markdown=False)


def read_markdown(path: Path) -> ParsedDoc:
    raw = path.read_text(encoding="utf-8", errors="replace")
    return _parse_lines_like_document(raw, is_markdown=True)


# --------------------------------------------------------------------------- #
# PDF: carry page numbers and heuristic heading detection per page
# --------------------------------------------------------------------------- #

def read_pdf(path: Path) -> ParsedDoc:
    from pypdf import PdfReader

    reader = PdfReader(path)
    title = ""
    if reader.metadata and reader.metadata.get("/Title"):
        title = str(reader.metadata["/Title"]).strip()[:120]

    blocks: list[Block] = []
    for pg_i, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if not text.strip():
            continue
        lines = text.splitlines()
        buf: list[str] = []
        crumb: list[str] = [b.section for b in blocks[-1:]] if blocks else []
        for line in lines:
            line = line.strip()
            if not line:
                if buf:
                    blocks.append(Block(text="\n".join(buf).strip(), section=" > ".join(crumb), page=pg_i, kind="paragraph"))
                    buf = []
                continue
            if _looks_like_heading(line):
                if buf:
                    blocks.append(Block(text="\n".join(buf).strip(), section=" > ".join(crumb), page=pg_i, kind="paragraph"))
                    buf = []
                parent_crumb = crumb[:-1] if crumb and crumb[-1] == line else crumb
                sec = " > ".join([c for c in parent_crumb if c] + [line])
                blocks.append(Block(text=line, section=sec, page=pg_i, kind="heading"))
                crumb = [c for c in parent_crumb + [line] if c]
                continue
            buf.append(line)
        if buf:
            blocks.append(Block(text="\n".join(buf).strip(), section=" > ".join(crumb), page=pg_i, kind="paragraph"))

    if not title and blocks:
        title = blocks[0].text.strip()[:120]
    return ParsedDoc(title=title or path.stem or "Untitled", blocks=blocks)


def _looks_like_heading(line: str) -> bool:
    if not (3 <= len(line) <= 120):
        return False
    # numbered / appendix heading e.g. "3.2 Refund windows", "Appendix A"
    if re.match(r"^(\d+(\.\d+)*\.?\s+\S)", line) or re.match(r"^Appendix [A-Z0-9]", line, re.IGNORECASE):
        return True
    # ALL CAPS short line
    if _ALLCAPS.match(line) and len(line) <= 60:
        return True
    # Title-Case-ish, no terminal punctuation, few words
    words = line.split()
    if line.endswith((".", ";", ",")) or len(words) > 12:
        return False
    cap = sum(1 for w in words if w[:1].isupper())
    return len(words) >= 3 and cap >= max(2, round(len(words) * 0.6)) and not line.endswith((".", "!", "?"))


# --------------------------------------------------------------------------- #
# DOCX: honor Word heading styles
# --------------------------------------------------------------------------- #

def read_docx(path: Path) -> ParsedDoc:
    import docx  # python-docx

    doc = docx.Document(path)
    core_title = doc.core_properties.title or ""

    blocks: list[Block] = []
    crumb: list[str] = []
    for para in doc.paragraphs:
        text = para.text.strip()
        level = 0
        style = (para.style.name or "").lower() if para.style is not None else ""
        if style.startswith("heading"):
            try:
                level = int(style.split()[-1]) if style.split()[-1].isdigit() else 1
            except ValueError:
                level = 1
        if not text:
            continue
        if level:
            parent = crumb[: max(0, level - 1)]
            crumb = (parent + [text])[:6]
            blocks.append(Block(text=text, section=" > ".join(crumb), page=1 + len(blocks) // 40, kind="heading"))
            continue
        blocks.append(Block(text=text, section=" > ".join(crumb), page=1 + len(blocks) // 40, kind="paragraph"))
        # Keep tables in reading order as simple blocks.
    for tbl in doc.tables:
        rows = []
        for row in tbl.rows:
            cells = [c.text.strip() for c in row.cells]
            if any(cells):
                rows.append(" | ".join(cells))
        if rows:
            blocks.append(Block(text="\n".join(rows), section=" > ".join(crumb), page=1 + len(blocks) // 40, kind="paragraph"))

    title = core_title.strip()
    if not title and blocks:
        title = blocks[0].text[:120]
    return ParsedDoc(title=title or path.stem or "Untitled", blocks=blocks)


def parse_document(path: Path, *, declared_format: str | None = None) -> ParsedDoc:
    """Small dispatcher by extension (overridable with declared_format for tests)."""
    fmt = (declared_format or path.suffix.lstrip(".")).lower()
    if fmt in {"md", "markdown"}:
        return read_markdown(path)
    if fmt == "pdf":
        return read_pdf(path)
    if fmt in {"docx", "doc"}:
        return read_docx(path)
    return read_txt(path)
