"""Heading/paragraph/semantic-aware chunking.

Strategy:
  1. Start from parser blocks (which already respect headings & page numbers).
  2. Greedily pack adjacent blocks into chunks up to `max_chars`, never merging
     blocks across a page boundary and only merging within the same section.
  3. Oversized single blocks are split at paragraph, then sentence, boundaries
     with an overlap so retrieval can still find mid-block evidence.
  4. Each chunk keeps the section breadcrumb of its first block so citations
     like "Brand Guidelines § Tone of voice > Prohibited phrases" are precise.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

from spyglass.config import settings
from spyglass.parse import Block

_SENT_END = re.compile(r"(?<=[.!?])(?=\s|$)")


@dataclass
class Chunk:
    text: str
    section: str
    page: int | None


def chunk_blocks(
    blocks: list[Block],
    *,
    max_chunk_chars: int | None = None,
    overlap_chars: int | None = None,
) -> list[Chunk]:
    max_chars = max_chunk_chars or settings.max_doc_chunk_chars
    if overlap_chars is None:
        overlap_chars = int(max_chars * settings.overlap_chunks)

    out: list[Chunk] = []
    buf: list[str] = []
    buf_len = 0
    buf_section = ""
    buf_page = None
    last_page = None

    def flush() -> None:
        nonlocal buf, buf_len, buf_section, buf_page
        text = "\n\n".join(buf).strip()
        if text:
            out.append(Chunk(text=text, section=buf_section, page=buf_page))
        buf, buf_len, buf_section, buf_page = [], 0, "", None

    for block in blocks:
        text = block.text.strip()
        if not text:
            continue
        new_section_heading = block.kind == "heading"
        page_break = last_page is not None and block.page != last_page

        flush_reasons = (
            buf_len + len(text) + 2 > max_chars
            or new_section_heading
            or page_break
            or (buf_page is not None and block.page != buf_page)
            or (buf_section and block.section != buf_section and block.kind != "paragraph")
        )
        if buf and flush_reasons:
            flush()

        if len(text) <= max_chars:
            if not buf_section and block.section:
                buf_section = block.section
            if not buf_page:
                buf_page = block.page
            buf.append(text)
            buf_len += len(text) + 2
        else:
            # Oversized block: split on paragraphs then sentences, with overlap.
            for piece in _split_long_text(text, max_chars, overlap_chars):
                out.append(Chunk(text=piece, section=block.section, page=block.page))
        last_page = block.page

    flush()
    return out


def _split_long_text(text: str, max_chars: int, overlap_chars: int) -> list[str]:
    if "\n\n" in text:
        paras = [p.strip() for p in text.split("\n\n") if p.strip()]
        if any(len(p) > max_chars for p in paras):
            pieces: list[str] = []
            for p in paras:
                pieces.extend(_split_long_text(p, max_chars, overlap_chars))
            return _merge_pieces(pieces, max_chars, overlap_chars)
        return _merge_pieces(paras, max_chars, overlap_chars)

    sentences = _SENT_END.split(text)
    sentences = [s.strip() for s in sentences if s and s.strip()]
    if any(len(s) > max_chars for s in sentences):
        # Last resort: hard character windows with overlap.
        windows = []
        step = max(1, max_chars - overlap_chars)
        for i in range(0, len(text), step):
            windows.append(text[i : i + max_chars].strip())
        return [w for w in windows if w]
    return _merge_pieces(sentences, max_chars, overlap_chars)


def _merge_pieces(pieces: list[str], max_chars: int, overlap_chars: int) -> list[str]:
    out: list[str] = []
    cur = ""
    for piece in pieces:
        candidate = (cur + "\n\n" + piece) if cur else piece
        if len(candidate) <= max_chars:
            cur = candidate
            continue
        if cur:
            out.append(cur)
        carry = cur[-overlap_chars:] if (overlap_chars and cur and len(cur) >= overlap_chars) else ""
        cur = (carry + piece) if carry else piece
        # carry may still push us slightly over max; keep it simple and accept <= max+overlap.
    if cur:
        out.append(cur)
    return out
