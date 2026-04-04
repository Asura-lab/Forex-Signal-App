import re
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"

def extract_str_constant(source: str, variable_name: str):
    pattern = re.compile(rf"^{variable_name}\s*=\s*['\"]([^'\"]+)['\"]", re.MULTILINE)
    match = pattern.search(source)
    return match.group(1) if match else None


def contains_constant_list_assignment(source: str, list_name: str, item_name: str):
    pattern = re.compile(rf"^{list_name}\s*=\s*\[\s*{item_name}\s*\]", re.MULTILINE)
    return bool(pattern.search(source))


class ScopeLockTest(unittest.TestCase):
    def test_scope_pair_constant_is_eurusd(self):
        content = BACKEND_APP_PATH.read_text(encoding="utf-8")
        scope_pair = extract_str_constant(content, "TRADING_SCOPE_PAIR")

        self.assertEqual(scope_pair, "EUR/USD", f"Expected TRADING_SCOPE_PAIR='EUR/USD', got: {scope_pair}")

    def test_signal_pairs_locked_to_scope_constant(self):
        content = BACKEND_APP_PATH.read_text(encoding="utf-8")
        self.assertTrue(
            contains_constant_list_assignment(content, "SIGNAL_PAIRS", "TRADING_SCOPE_PAIR"),
            "Expected SIGNAL_PAIRS to be assigned as [TRADING_SCOPE_PAIR]",
        )

    def test_analysis_preload_pairs_locked_to_scope_constant(self):
        content = BACKEND_APP_PATH.read_text(encoding="utf-8")
        self.assertTrue(
            contains_constant_list_assignment(content, "PRELOADED_ANALYSIS_PAIRS", "TRADING_SCOPE_PAIR"),
            "Expected PRELOADED_ANALYSIS_PAIRS to be assigned as [TRADING_SCOPE_PAIR]",
        )


if __name__ == "__main__":
    unittest.main()
