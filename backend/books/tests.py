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

