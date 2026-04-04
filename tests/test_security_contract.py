import re
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"


class SecurityContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = BACKEND_APP_PATH.read_text(encoding="utf-8")

    def test_signal_save_requires_token(self):
        # Ensure decorator order keeps token guard on save endpoint.
        pattern = re.compile(
            r"@app\.route\('/signal/save',\s*methods=\['POST'\]\)\s*\n@token_required\s*\ndef\s+save_signal\(",
            re.MULTILINE,
        )
        self.assertRegex(self.content, pattern)

    def test_ai_endpoints_have_public_rate_limit(self):
        self.assertIn("enforce_public_rate_limit('api_news_analyze'", self.content)
        self.assertIn("enforce_public_rate_limit('api_market_analysis'", self.content)

    def test_notifications_test_is_production_guarded(self):
        self.assertIn("if not allow_test_notification_endpoint():", self.content)

    def test_market_analysis_scope_allows_only_market_or_scope_pair(self):
        self.assertIn("enforce_trading_scope(request.args.get('pair', 'EUR/USD'), allow_market=True)", self.content)

    def test_health_details_requires_token(self):
        pattern = re.compile(
            r"@app\.route\('/health/details',\s*methods=\['GET'\]\)\s*\n@token_required\s*\ndef\s+health_details\(",
            re.MULTILINE,
        )
        self.assertRegex(self.content, pattern)

    def test_market_analysis_status_endpoint_exists(self):
        self.assertIn("@app.route('/api/market-analysis/status/<job_id>', methods=['GET'])", self.content)


if __name__ == "__main__":
    unittest.main()
