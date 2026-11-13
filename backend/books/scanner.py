import os
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path
from bs4 import BeautifulSoup
from django.core.files.base import ContentFile
from .models import EpubBook, Genre

DC_NS = {
    "dc": "http://purl.org/dc/elements/1.1/",
    "opf": "http://www.idpf.org/2007/opf",
    "container": "urn:oasis:names:tc:opendocument:xmlns:container",
}


def _zip_resolve(opf_dir: str, href: str) -> str:
    """Resolve a relative href against the OPF directory using POSIX path rules.
    EPUB zip entries always use forward slashes — os.path.normpath breaks on Windows."""
    joined = posixpath.normpath(posixpath.join(opf_dir, href))
    # Remove leading ./ if any
    if joined.startswith("./"):
        joined = joined[2:]
    return joined


def clean_html_summary(raw_html: str) -> str:
    """Extract human-readable synopsis/summary from html/xhtml bytes or string."""
    try:
        soup = BeautifulSoup(raw_html, "html.parser")
        for bad in soup(["script", "style", "nav"]):
            bad.decompose()
        # 1. Target summary classes/ids
        summary_node = soup.select_one(".summary, .description, #description, #summary, .synopsis, [class*='summary'], [class*='synopsis']")
        if summary_node:
            text = summary_node.get_text(separator="\n").strip()
            # Remove header labels like 【あらすじ】
            text = re.sub(r"^【(?:あらすじ|概要|Synopsis|Summary)】\s*", "", text).strip()
            if len(text) > 20:
                return text

        # 2. Collect paragraphs from title page or intro
        paragraphs = [p.get_text().strip() for p in soup.find_all("p") if p.get_text().strip()]
        # Skip pure author or ncode metadata paragraphs
        meaningful_p = []
        for p in paragraphs:
            if any(k in p.lower() for k in ["ncode:", "chapters:", "作者：", "author:"]):
                continue
            meaningful_p.append(p)
        if meaningful_p:
            return "\n\n".join(meaningful_p[:10])

        return soup.get_text(separator="\n").strip()
    except Exception:
        return ""


def parse_epub(epub_path: str) -> dict:
    """Parse rich metadata, chapter count, word count, and cover image from an EPUB file."""
    if not os.path.exists(epub_path):
        raise FileNotFoundError(f"File not found: {epub_path}")

    file_size = os.path.getsize(epub_path)
    stem_name = Path(epub_path).stem

    # Filename-based title parsing: typically "Title - Author.epub" or "Title.epub"
    filename_title = stem_name
    if " - " in stem_name:
        filename_title = stem_name.rsplit(" - ", 1)[0].strip()

    with zipfile.ZipFile(epub_path, "r") as zf:
        # 1. Parse META-INF/container.xml
        try:
            container_data = zf.read("META-INF/container.xml")
            ctree = ET.fromstring(container_data)
            rootfile_elem = ctree.find(".//container:rootfile", DC_NS)
            if rootfile_elem is None:
                rootfile_elem = ctree.find(".//{urn:oasis:names:tc:opendocument:xmlns:container}rootfile")
            rootfile_path = rootfile_elem.attrib["full-path"]
        except Exception as e:
            raise ValueError(f"Invalid EPUB container structure: {e}")

        # 2. Parse OPF file
        opf_data = zf.read(rootfile_path)
        tree = ET.fromstring(opf_data)
        opf_dir = posixpath.dirname(rootfile_path)

        metadata = tree.find("opf:metadata", DC_NS)
        if metadata is None:
            metadata = tree.find("{http://www.idpf.org/2007/opf}metadata")
        if metadata is None:
            metadata = tree.find("metadata")

        # Title: DC metadata takes priority over filename when available
        title = ""
        original_title = ""
        if metadata is not None:
            # 1. Check explicit original title tag
            orig_elem = metadata.find("dc:title[@id='original_title']", DC_NS)
            if orig_elem is None:
                orig_elem = metadata.find("{http://purl.org/dc/elements/1.1/}title[@id='original_title']")
            if orig_elem is not None and orig_elem.text:
                original_title = orig_elem.text.strip()

            title_elem = metadata.find("dc:title", DC_NS)
            if title_elem is None:
                title_elem = metadata.find("{http://purl.org/dc/elements/1.1/}title")
            if title_elem is not None and title_elem.text:
                dc_title = title_elem.text.strip()
                if dc_title and dc_title not in ["New Book", "Unknown"]:
                    title = dc_title
                if not original_title and dc_title != title:
                    original_title = dc_title

        if not title:
            title = filename_title

        # Creator / Author
        author = "Unknown"
        if metadata is not None:
            creator_elem = metadata.find("dc:creator", DC_NS)
            if creator_elem is None:
                creator_elem = metadata.find("{http://purl.org/dc/elements/1.1/}creator")
            if creator_elem is not None and creator_elem.text:
                author = creator_elem.text.strip()
                # Clean prefix "Author: "
                if author.lower().startswith("author:"):
                    author = author[7:].strip()
                elif author.lower().startswith("作者："):
                    author = author[3:].strip()

        # Fallback author from filename pattern: "Title - Author.epub"
        if author == "Unknown" and " - " in stem_name:
            parts = stem_name.rsplit(" - ", 1)
            if len(parts) == 2:
                candidate_author = parts[1].strip()
                # Filter out numeric suffixes like (1)
                candidate_author = re.sub(r"\s*\(\d+\)$", "", candidate_author).strip()
                if candidate_author.lower().startswith("author-"):
                    candidate_author = candidate_author[7:].strip()
                if candidate_author:
                    author = candidate_author

        # Description from metadata
        description = ""
        if metadata is not None:
            desc_elem = metadata.find("dc:description", DC_NS)
            if desc_elem is None:
                desc_elem = metadata.find("{http://purl.org/dc/elements/1.1/}description")
            if desc_elem is not None and desc_elem.text:
                description = desc_elem.text.strip()

        # Language: Normalize and detect
        language = "en"
        if metadata is not None:
            lang_elem = metadata.find("dc:language", DC_NS)
            if lang_elem is None:
                lang_elem = metadata.find("{http://purl.org/dc/elements/1.1/}language")
            if lang_elem is not None and lang_elem.text:
                language = lang_elem.text.strip().lower()

        # Filename prefix / tag overrides language
        stem_lower = stem_name.lower()
        if stem_lower.startswith("[en]") or "_en" in stem_lower:
            language = "en"
        elif stem_lower.startswith("[id]") or "_id" in stem_lower:
            language = "id"

        # If title or filename indicates English translation, override to 'en'
        if "[en]" in (title + " " + stem_name).lower() or "(en)" in (title + " " + stem_name).lower():
            language = "en"

        # Source URL / Identifier
        source_url = ""
        identifier = ""
        if metadata is not None:
            src_elem = metadata.find("dc:source", DC_NS)
            if src_elem is None:
                src_elem = metadata.find("{http://purl.org/dc/elements/1.1/}source")
            if src_elem is not None and src_elem.text:
                source_url = src_elem.text.strip()

            id_elem = metadata.find("dc:identifier", DC_NS)
            if id_elem is None:
                id_elem = metadata.find("{http://purl.org/dc/elements/1.1/}identifier")
            if id_elem is not None and id_elem.text:
                identifier = id_elem.text.strip()
                if not source_url and identifier.startswith("http"):
                    source_url = identifier

        # Auto-detect source URL from Syosetsu ncode in identifier/description/title if missing
        if not source_url:
            ncode_match = re.search(r"\b(n\d{4}[a-z]{1,2})\b", (identifier + " " + title + " " + stem_name).lower())
            if ncode_match:
                source_url = f"https://ncode.syosetu.com/{ncode_match.group(1)}/"
            elif "kakuyomu" in (identifier + " " + stem_name).lower():
                k_match = re.search(r"works/(\d+)", identifier + " " + stem_name)
                if k_match:
                    source_url = f"https://kakuyomu.jp/works/{k_match.group(1)}"

        # Genres / Subjects
        genres = []
        # Japanese web novel tags mapping to clean English
        TAG_TRANSLATION_MAP = {
            "異世界": "Isekai",
            "異世界転生": "Isekai Reincarnation",
            "異世界転移": "Isekai Summoning",
            "転生": "Reincarnation",
            "転移": "Summoning / Transmigration",
            "主人公最強": "Overpowered Protagonist",
            "最強": "Overpowered",
            "無双": "Overpowered",
            "勘違い": "Misunderstanding",
            "チート": "Cheat Ability",
            "ファンタジー": "Fantasy",
            "ハイファンタジー": "High Fantasy",
            "ローファンタジー": "Urban Fantasy",
            "SF": "Sci-Fi",
            "コメディ": "Comedy",
            "ギャグ": "Comedy",
            "ラブコメ": "RomCom",
            "恋愛": "Romance",
            "ざまぁ": "Revenge",
            "復讐": "Revenge",
            "追放": "Banished / Exiled",
            "悪役令嬢": "Villainess",
            "TS": "Gender Bender",
            "性転換": "Gender Bender",
            "女主人公": "Female Protagonist",
            "男主人公": "Male Protagonist",
            "日常": "Slice of Life",
            "ほのぼの": "Slice of Life",
            "冒険": "Adventure",
            "ダンジョン": "Dungeon",
            "魔法": "Magic",
            "ステータス": "Status / LitRPG",
            "ゲーム": "LitRPG / Game",
            "スキル": "Skills / Progression",
            "学園": "School Life",
            "ハーレム": "Harem",
            "スローライフ": "Slow Life",
            "ダーク": "Dark Fantasy",
            "生産": "Crafting / Production",
            "錬金術": "Alchemy",
            "もふもふ": "Fluffy / Cute",
            "ミリタリー": "Military",
            "ネット小説大賞": "Award Winner",
            "書籍化": "Light Novel Adaptation",
            "アニメ化": "Anime Adaptation",
            "コミカライズ": "Manga Adaptation",
            "完結済": "Completed",
            "連載中": "Ongoing",
            "R15": "Teen 15+",
            "残酷な描写あり": "Gore / Violence",
            "オリジナル": "Original",
        }

        if metadata is not None:
            for s in metadata.findall("dc:subject", DC_NS) + metadata.findall("{http://purl.org/dc/elements/1.1/}subject"):
                if s.text and s.text.strip():
                    raw_tag = s.text.strip()
                    # Filter out long paragraphs or junk mistakenly stored as dc:subject
                    if len(raw_tag) > 35 or "\n" in raw_tag:
                        continue
                    # Check mapping
                    mapped_tag = TAG_TRANSLATION_MAP.get(raw_tag)
                    if not mapped_tag:
                        # Partial match in tag
                        for jp_k, en_v in TAG_TRANSLATION_MAP.items():
                            if jp_k in raw_tag:
                                mapped_tag = en_v
                                break
                    genres.append(mapped_tag if mapped_tag else raw_tag)

        # Auto-detect common novel tags from title/filename if empty
        if not genres:
            low_title = (title + " " + stem_name).lower()
            detected_tags = []
            tag_keywords = {
                "Action": ["action", "battle", "fight", "war"],
                "Fantasy": ["fantasy", "magic", "dragon", "spirit", "realm", "god", "fairy"],
                "Isekai": ["reincarnat", "summoned", "another world", "isekai", "ts ", "転生", "異世界"],
                "Transmigration": ["transmigration", "transmigrated", "quick transmigration"],
                "Romance": ["romance", "love", "lover", "wife", "princess", "beauty"],
                "Comedy": ["comedy", "funny", "chaos"],
                "Adventure": ["adventure", "journey", "quest", "dungeon"],
                "Martial Arts": ["martial", "cultivation", "xianxia", "dao", "immortal"],
                "System": ["system", "inventory", "sign in", "level", "gm privileges"],
            }
            for tag, kws in tag_keywords.items():
                if any(k in low_title for k in kws):
                    detected_tags.append(tag)
            genres = detected_tags if detected_tags else ["Fantasy", "Light Novel"]

        # 3. Manifest & Chapters
        manifest = tree.find("opf:manifest", DC_NS)
        if manifest is None:
            manifest = tree.find("{http://www.idpf.org/2007/opf}manifest")
        if manifest is None:
            manifest = tree.find("manifest")

        manifest_items = {}
        chapter_count = 0
        cover_href = None
        total_chars = 0

        # Check meta name="cover"
        cover_meta_id = None
        if metadata is not None:
            for meta_item in metadata.findall("opf:meta", DC_NS) + metadata.findall("{http://www.idpf.org/2007/opf}meta") + metadata.findall("meta"):
                if meta_item.attrib.get("name") == "cover":
                    cover_meta_id = meta_item.attrib.get("content")
                    break

        titlepage_path = None
        first_ch_path = None

        if manifest is not None:
            for item in manifest:
                item_id = item.attrib.get("id", "")
                href = item.attrib.get("href", "")
                media_type = item.attrib.get("media-type", "")
                properties = item.attrib.get("properties", "")

                manifest_items[item_id] = href
                low_id = item_id.lower()
                low_href = href.lower()

                # Chapter heuristic: xhtml / html docs
                if "html" in media_type.lower() or href.lower().endswith((".xhtml", ".html", ".htm")):
                    if any(k in low_id or k in low_href for k in ["titlepage", "title_page", "intro", "summary"]):
                        titlepage_path = _zip_resolve(opf_dir, href)
                    elif not any(k in low_id or k in low_href for k in ["cover", "toc", "nav"]):
                        chapter_count += 1
                        if not first_ch_path:
                            first_ch_path = _zip_resolve(opf_dir, href)

                # Cover candidate matching
                if not cover_href:
                    if cover_meta_id and item_id == cover_meta_id:
                        cover_href = href
                    elif "cover-image" in properties:
                        cover_href = href
                    elif "cover" in item_id.lower() and media_type.startswith("image/"):
                        cover_href = href
                    elif "cover" in href.lower() and media_type.startswith("image/"):
                        cover_href = href

        # Fallback chapter count to spine items
        if chapter_count == 0:
            spine = tree.find("opf:spine", DC_NS)
            if spine is None:
                spine = tree.find("{http://www.idpf.org/2007/opf}spine")
            if spine is None:
                spine = tree.find("spine")
            if spine is not None:
                chapter_count = len(list(spine))

        # 4. If description is empty, extract from info.xhtml, titlepage or first chapter
        if not description or len(description.strip()) < 15:
            # First check standard info.xhtml (generated by crawler / QC)
            info_candidates = [n for n in zf.namelist() if n.lower().endswith(("info.xhtml", "info.html"))]
            if info_candidates:
                content = zf.read(info_candidates[0]).decode("utf-8", errors="ignore")
                extracted = clean_html_summary(content)
                if extracted and len(extracted) > 20:
                    description = extracted

            if (not description or len(description.strip()) < 15) and titlepage_path and titlepage_path in zf.namelist():
                content = zf.read(titlepage_path).decode("utf-8", errors="ignore")
                extracted = clean_html_summary(content)
                if extracted and len(extracted) > 20:
                    description = extracted
            if (not description or len(description.strip()) < 15) and first_ch_path and first_ch_path in zf.namelist():
                content = zf.read(first_ch_path).decode("utf-8", errors="ignore")
                extracted = clean_html_summary(content)
                if extracted and len(extracted) > 30:
                    description = extracted

        # Clean description HTML tags if any left
        if "<" in description and ">" in description:
            description = BeautifulSoup(description, "html.parser").get_text(separator="\n").strip()

        # Estimate character / word count from total chapters
        total_chars = max(chapter_count * 2800, len(description) * 10)

        # 5. Extract Cover Image Bytes
        cover_bytes = None
        cover_filename = None
        if cover_href:
            rel_cover = _zip_resolve(opf_dir, cover_href)
            try:
                cover_bytes = zf.read(rel_cover)
                cover_filename = posixpath.basename(rel_cover)
            except KeyError:
                # Fuzzy fallback: match by basename across all zip entries
                target_base = posixpath.basename(cover_href).lower()
                for name in zf.namelist():
                    if posixpath.basename(name).lower() == target_base:
                        cover_bytes = zf.read(name)
                        cover_filename = posixpath.basename(name)
                        break

        # If still no cover, check any image in zip
        if not cover_bytes:
            for name in zf.namelist():
                if name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")) and not name.lower().endswith(".svg"):
                    cover_bytes = zf.read(name)
                    cover_filename = posixpath.basename(name)
                    break

        return {
            "title": title,
            "original_title": original_title,
            "author": author,
            "description": description,
            "language": language,
            "genres": genres,
            "total_chapters": max(chapter_count, 1),
            "total_characters": total_chars,
            "source_url": source_url,
            "identifier": identifier,
            "file_size": file_size,
            "cover_bytes": cover_bytes,
            "cover_filename": cover_filename,
        }


def scan_epub_directory(folder_or_file_path: str, force_update: bool = False) -> dict:
    """Scan directory or single EPUB file and persist to database."""
    target_path = os.path.normpath(folder_or_file_path)
    if not os.path.exists(target_path):
        return {"status": "error", "message": f"Path does not exist: {target_path}", "added": 0, "updated": 0}

    epub_files = []
    if os.path.isfile(target_path):
        if target_path.lower().endswith(".epub"):
            epub_files.append(target_path)
    else:
        for root, _, files in os.walk(target_path):
            for f in files:
                if f.lower().endswith(".epub"):
                    epub_files.append(os.path.normpath(os.path.join(root, f)))

    added_count = 0
    updated_count = 0
    errors = []

    for file_path in epub_files:
        try:
            existing_book = EpubBook.objects.filter(file_path=file_path).first()
            if existing_book and not force_update:
                continue

            metadata = parse_epub(file_path)

            if existing_book:
                book = existing_book
                book.title = metadata["title"]
                book.original_title = metadata.get("original_title", "")
                book.author = metadata["author"]
                book.description = metadata["description"]
                book.language = metadata["language"]
                book.source_url = metadata.get("source_url", "")
                book.identifier = metadata.get("identifier", "")
                book.file_size_bytes = metadata["file_size"]
                book.total_chapters = metadata["total_chapters"]
                book.total_characters = metadata.get("total_characters", 0)
                updated_count += 1
            else:
                book = EpubBook(
                    title=metadata["title"],
                    original_title=metadata.get("original_title", ""),
                    author=metadata["author"],
                    description=metadata["description"],
                    language=metadata["language"],
                    source_url=metadata.get("source_url", ""),
                    identifier=metadata.get("identifier", ""),
                    file_path=file_path,
                    file_size_bytes=metadata["file_size"],
                    total_chapters=metadata["total_chapters"],
                    total_characters=metadata.get("total_characters", 0),
                )
                added_count += 1

            # Save cover if available
            if metadata["cover_bytes"] and metadata["cover_filename"]:
                ext = os.path.splitext(metadata["cover_filename"])[1] or ".jpg"
                clean_name = f"cover_{Path(file_path).stem[:50]}{ext}"
                book.cover_image.save(clean_name, ContentFile(metadata["cover_bytes"]), save=False)

            book.save()

            # Associate Genres
            genre_objs = []
            for g_name in metadata["genres"]:
                clean_g = g_name.strip()[:100]
                if clean_g:
                    genre_obj, _ = Genre.objects.get_or_create(name=clean_g)
                    genre_objs.append(genre_obj)
            book.genres.set(genre_objs)

        except Exception as err:
            errors.append({"file": file_path, "error": str(err)})

    return {
        "status": "success",
        "total_scanned_files": len(epub_files),
        "added": added_count,
        "updated": updated_count,
        "errors": errors,
    }
