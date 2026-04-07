#!/usr/bin/env python3
"""
Parse Udemy "quiz result" HTML dumps (Dump01.html ... Dump06.html) into a normalized JSON dataset.

Assumptions (based on the provided dumps):
- Each question prompt is stored inside a div with id="question-prompt".
- Each answer option is stored inside a div with id="answer-text" under a parent div with
  class containing "answer-result-pane--answer-...".
- Correct options are the ones whose answer container class contains "answer-correct".
- Explanations are not present in these dumps (kept as null).

This script uses only Python's standard library (no BeautifulSoup).
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import re
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any


class _TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self._parts: list[str] = []

    def handle_data(self, data: str) -> None:
        if data:
            self._parts.append(data)

    def get_text(self) -> str:
        return "".join(self._parts)


def strip_tags(html_fragment: str) -> str:
    parser = _TextExtractor()
    try:
        parser.feed(html_fragment)
        parser.close()
    except Exception:
        # Best-effort; don't fail the whole parse because of one malformed fragment.
        pass
    return " ".join(parser.get_text().split()).strip()


def normalize_inner_html(raw: str) -> str:
    # Keep rich HTML, but decode entities and normalize whitespace a bit.
    unescaped = html.unescape(raw).strip()
    # Remove leading/trailing whitespace on each line then collapse multiple blank lines.
    lines = [ln.strip() for ln in unescaped.splitlines()]
    cleaned = "\n".join([ln for ln in lines if ln != ""]).strip()
    return cleaned


@dataclass(frozen=True)
class ParsedOption:
    html: str
    text: str
    is_correct: bool


@dataclass(frozen=True)
class ParsedQuestion:
    prompt_html: str
    prompt_text: str
    category: str | None
    options: list[ParsedOption]


_RE_RESULTS_TITLE = re.compile(
    r"results-header--results-title-wrapper[^>]*>\s*<h2[^>]*>(.*?)</h2>",
    re.S,
)
_RE_COURSE_TITLE = re.compile(
    r'data-purpose="course-header-title"[^>]*>.*?<a[^>]*>(.*?)</a>',
    re.S,
)


def text_to_simple_html(text: str) -> str:
    """
    Convert extracted plain text into safe, minimal HTML:
    - escape all content
    - preserve paragraph breaks and single newlines
    """
    text = " ".join(text.split("\r")).strip()
    if not text:
        return ""
    # Normalize whitespace but preserve newlines.
    text = "\n".join([ln.strip() for ln in text.split("\n")]).strip()
    paragraphs = re.split(r"\n\s*\n+", text)
    out: list[str] = []
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        escaped = html.escape(p, quote=False)
        escaped = escaped.replace("\n", "<br>")
        out.append(f"<p>{escaped}</p>")
    return "\n".join(out) if out else html.escape(text, quote=False)

def normalize_text_preserve_newlines(raw: str) -> str:
    raw = raw.replace("\r", "")
    lines = [re.sub(r"\s+", " ", ln).strip() for ln in raw.split("\n")]
    # Collapse runs of empty lines
    out_lines: list[str] = []
    empty_run = 0
    for ln in lines:
        if ln == "":
            empty_run += 1
            if empty_run <= 1:
                out_lines.append("")
        else:
            empty_run = 0
            out_lines.append(ln)
    return "\n".join(out_lines).strip()


class _UdemyDumpParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.questions: list[ParsedQuestion] = []

        self._current_prompt_parts: list[str] = []
        self._current_options: list[ParsedOption] = []
        self._current_category: str | None = None

        self._in_prompt = False
        self._prompt_depth = 0

        self._in_answer_container = False
        self._answer_container_depth = 0
        self._answer_container_correct = False

        self._in_answer_text = False
        self._answer_text_depth = 0
        self._current_answer_parts: list[str] = []

        self._expect_domain_value = False
        self._in_domain_value = False
        self._domain_value_depth = 0
        self._domain_value_parts: list[str] = []

    def _finalize_current_question_if_any(self) -> None:
        if not self._current_prompt_parts and not self._current_options:
            return
        prompt_text = normalize_text_preserve_newlines("".join(self._current_prompt_parts))
        prompt_html = text_to_simple_html(prompt_text)
        if not prompt_text:
            return

        self.questions.append(
            ParsedQuestion(
                prompt_html=prompt_html,
                prompt_text=prompt_text,
                category=self._current_category,
                options=self._current_options,
            )
        )
        self._current_prompt_parts = []
        self._current_options = []
        self._current_category = None
        self._expect_domain_value = False
        self._in_domain_value = False
        self._domain_value_parts = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {k: (v or "") for k, v in attrs}

        if tag == "div" and attr.get("id") == "question-prompt":
            # New question starts: flush previous.
            self._finalize_current_question_if_any()
            self._in_prompt = True
            self._prompt_depth = 1
            self._current_prompt_parts = []
            return

        if self._in_prompt and tag == "div":
            self._prompt_depth += 1

        if self._in_prompt and tag in ("br",):
            self._current_prompt_parts.append("\n")

        if tag == "div" and attr.get("data-purpose") == "answer":
            # Marks a new answer container; correct answer is encoded in class name.
            cls = attr.get("class", "")
            self._in_answer_container = True
            self._answer_container_depth = 1
            self._answer_container_correct = "answer-correct" in cls
            return

        if self._in_answer_container and tag == "div":
            self._answer_container_depth += 1

        if tag == "div" and attr.get("id") == "answer-text":
            self._in_answer_text = True
            self._answer_text_depth = 1
            self._current_answer_parts = []
            return

        if self._in_answer_text and tag == "div":
            self._answer_text_depth += 1

        if self._in_answer_text and tag in ("br",):
            self._current_answer_parts.append("\n")

        # Domain/category: after a "domain-pane" header, the next ud-text-md is the value.
        if tag == "div" and "domain-pane--domain-pane-header" in attr.get("class", ""):
            self._expect_domain_value = True
            return

        if self._expect_domain_value and tag == "div" and attr.get("class", "") == "ud-text-md":
            self._in_domain_value = True
            self._domain_value_depth = 1
            self._domain_value_parts = []
            self._expect_domain_value = False
            return

        if self._in_domain_value and tag == "div":
            self._domain_value_depth += 1

    def handle_endtag(self, tag: str) -> None:
        if self._in_prompt and tag == "div":
            self._prompt_depth -= 1
            if self._prompt_depth <= 0:
                self._in_prompt = False
                self._prompt_depth = 0
            return

        if self._in_answer_text and tag == "div":
            self._answer_text_depth -= 1
            if self._answer_text_depth <= 0:
                self._in_answer_text = False
                text = normalize_text_preserve_newlines("".join(self._current_answer_parts))
                if text:
                    self._current_options.append(
                        ParsedOption(
                            html=text_to_simple_html(text),
                            text=text,
                            is_correct=self._answer_container_correct,
                        )
                    )
                self._current_answer_parts = []
            return

        if self._in_answer_container and tag == "div":
            self._answer_container_depth -= 1
            if self._answer_container_depth <= 0:
                self._in_answer_container = False
                self._answer_container_depth = 0
                self._answer_container_correct = False
            return

        if self._in_domain_value and tag == "div":
            self._domain_value_depth -= 1
            if self._domain_value_depth <= 0:
                self._in_domain_value = False
                value = normalize_text_preserve_newlines("".join(self._domain_value_parts))
                self._current_category = value or self._current_category
                self._domain_value_parts = []
            return

    def handle_data(self, data: str) -> None:
        if self._in_prompt:
            self._current_prompt_parts.append(data)
        elif self._in_answer_text:
            self._current_answer_parts.append(data)
        elif self._in_domain_value:
            self._domain_value_parts.append(data)

    def close(self) -> None:
        super().close()
        self._finalize_current_question_if_any()


def parse_dump_html(text: str) -> tuple[str | None, str | None, list[ParsedQuestion]]:
    results_title: str | None = None
    course_title: str | None = None

    m = _RE_RESULTS_TITLE.search(text)
    if m:
        results_title = strip_tags(m.group(1))

    m = _RE_COURSE_TITLE.search(text)
    if m:
        course_title = strip_tags(m.group(1))

    parser = _UdemyDumpParser()
    try:
        parser.feed(text)
        parser.close()
    except Exception:
        # Best effort: return whatever we parsed so far.
        pass

    return results_title, course_title, parser.questions


def option_id_from_index(i: int) -> str:
    # 0 -> A, 1 -> B, ... 25 -> Z, 26 -> AA ...
    letters = []
    n = i
    while True:
        letters.append(chr(ord("A") + (n % 26)))
        n = n // 26 - 1
        if n < 0:
            break
    return "".join(reversed(letters))


def build_dataset(input_files: list[Path]) -> dict[str, Any]:
    exams: list[dict[str, Any]] = []
    for file_path in input_files:
        raw = file_path.read_text(errors="ignore")
        results_title, course_title, questions = parse_dump_html(raw)

        exam_id = file_path.stem.lower()
        # Prefer a friendly, scalable naming convention:
        #   "<Course Title> - Set 01"
        # Fall back to the results title ("Dump 01 - Kết quả") or the filename.
        set_number = None
        m = re.search(r"(\d+)", file_path.stem)
        if m:
            try:
                set_number = int(m.group(1))
            except ValueError:
                set_number = None

        if course_title and set_number is not None:
            # Normalize capitalization slightly (the dump uses "Outsystems", but we'd like "OutSystems").
            normalized_course = course_title.replace("Outsystems", "OutSystems")
            exam_title = f"{normalized_course} - Set {set_number:02d}"
        else:
            exam_title = results_title or file_path.stem

        exam_questions: list[dict[str, Any]] = []
        for qi, q in enumerate(questions, start=1):
            option_objs: list[dict[str, Any]] = []
            correct_ids: list[str] = []
            for oi, opt in enumerate(q.options):
                oid = option_id_from_index(oi)
                option_objs.append({"id": oid, "html": opt.html, "text": opt.text})
                if opt.is_correct:
                    correct_ids.append(oid)

            q_type = "multi" if len(correct_ids) > 1 else "single"
            exam_questions.append(
                {
                    "id": f"Q{qi}",
                    "promptHtml": q.prompt_html,
                    "promptText": q.prompt_text,
                    "type": q_type,
                    "options": option_objs,
                    "correctOptionIds": correct_ids or ["A"],  # fallback if source is malformed
                    "explanationHtml": None,
                    "explanationText": None,
                    "category": q.category,
                    "difficulty": None,
                    "meta": {
                        "sourceFile": str(file_path.as_posix()),
                        "courseTitle": course_title,
                    },
                }
            )

        exams.append(
            {
                "id": exam_id,
                "title": exam_title,
                "description": f"OutSystems Tech Lead practice set imported from {file_path.as_posix()}",
                "tags": [t for t in [course_title] if t],
                "questions": exam_questions,
            }
        )

    return {
        "schemaVersion": 1,
        "generatedAt": dt.datetime.now(dt.timezone.utc).isoformat(),
        "source": {"type": "udemy-quiz-result-html", "files": [p.as_posix() for p in input_files]},
        "exams": exams,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input-dir",
        default="document",
        help="Folder containing Dump01.html ... Dump06.html",
    )
    parser.add_argument(
        "--glob",
        default="Dump*.html",
        help="Glob pattern to match input files inside --input-dir",
    )
    parser.add_argument(
        "--out",
        default="data/outsystems-techlead/exams.json",
        help="Output JSON path",
    )
    parser.add_argument(
        "--example-out",
        default="data/outsystems-techlead/example.exams.json",
        help="Write a small example dataset (first 1 exam / 2 questions) for documentation",
    )

    args = parser.parse_args()
    input_dir = Path(args.input_dir)
    files = sorted(input_dir.glob(args.glob))
    if not files:
        raise SystemExit(f"No files matched {args.glob} in {input_dir.as_posix()}")

    dataset = build_dataset(files)
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    # Small example for docs.
    ex = json.loads(json.dumps(dataset))
    ex["exams"] = ex["exams"][:1]
    if ex["exams"]:
        ex["exams"][0]["questions"] = ex["exams"][0]["questions"][:2]
    example_out = Path(args.example_out)
    example_out.parent.mkdir(parents=True, exist_ok=True)
    example_out.write_text(json.dumps(ex, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Wrote {out_path.as_posix()} ({len(dataset['exams'])} exams)")
    print(f"Wrote {example_out.as_posix()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
