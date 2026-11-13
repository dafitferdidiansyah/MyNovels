from django.test import TestCase
import re

# Create your tests here.
class EpubUploadTitleCleaningTest(TestCase):
    def test_stem_regex_stripping(self):
        cases = [
            ("[EN] [Comic Adaptation Sequel Begins!] The Prince and His Sidekick", "[Comic Adaptation Sequel Begins!] The Prince and His Sidekick"),
            ("[ID] Petualangan Dimulai", "Petualangan Dimulai"),
            ("[ja] Mahou Shoujo", "Mahou Shoujo"),
            ("Regular Title Without Tag", "Regular Title Without Tag"),
        ]
        for input_stem, expected in cases:
            cleaned = re.sub(r"^\[(?:EN|ID|JA)\]\s*", "", input_stem, flags=re.IGNORECASE).strip()
            self.assertEqual(cleaned, expected)


class EpubChapterCountExclusionTest(TestCase):
    def test_info_xhtml_excluded_from_chapter_count(self):
        import tempfile
        import os
        import zipfile
        from books.scanner import parse_epub

        with tempfile.NamedTemporaryFile(suffix=".epub", delete=False) as tmp:
            tmp_path = tmp.name

        try:
            with zipfile.ZipFile(tmp_path, "w") as zf:
                zf.writestr("mimetype", "application/epub+zip")
                zf.writestr("META-INF/container.xml", """<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>""")
                zf.writestr("OEBPS/content.opf", """<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Test Story</dc:title>
    <dc:creator>Test Author</dc:creator>
  </metadata>
  <manifest>
    <item id="info" href="info.xhtml" media-type="application/xhtml+xml"/>
    <item id="toc" href="toc.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch1" href="ch00001.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch2" href="ch00002.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch3" href="ch00003.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch4" href="ch00004.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch5" href="ch00005.xhtml" media-type="application/xhtml+xml"/>
    <item id="ch6" href="ch00006.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="info"/>
    <itemref idref="ch1"/>
    <itemref idref="ch2"/>
    <itemref idref="ch3"/>
    <itemref idref="ch4"/>
    <itemref idref="ch5"/>
    <itemref idref="ch6"/>
  </spine>
</package>""")
                zf.writestr("OEBPS/info.xhtml", "<html><body><p>Synopsis info</p></body></html>")
                zf.writestr("OEBPS/toc.xhtml", "<html><body><p>TOC</p></body></html>")
                for i in range(1, 7):
                    zf.writestr(f"OEBPS/ch0000{i}.xhtml", f"<html><body><p>Chapter {i}</p></body></html>")

            parsed = parse_epub(tmp_path)
            self.assertEqual(parsed.get("total_chapters"), 6)
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)


