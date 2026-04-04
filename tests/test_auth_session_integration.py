import re
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"
MOBILE_API_PATH = ROOT_DIR / "mobile_app" / "src" / "services" / "api.ts"


class AuthSessionIntegrationContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.backend = BACKEND_APP_PATH.read_text(encoding="utf-8")
        cls.mobile = MOBILE_API_PATH.read_text(encoding="utf-8")

    def test_refresh_flow_revokes_old_refresh_before_issuing_new_tokens(self):
        pattern = re.compile(
            r"def\s+refresh_auth_token\(\):[\s\S]*?"
            r"payload\s*=\s*verify_token\(refresh_token,\s*expected_type='refresh'\)[\s\S]*?"
            r"if\s+not\s+_is_refresh_token_active\(refresh_token\):[\s\S]*?"
            r"_revoke_refresh_token\(refresh_token\)[\s\S]*?"
            r"_issue_token_pair\(payload\['user_id'\],\s*payload\['email'\]\)",
            re.MULTILINE,
        )
        self.assertRegex(self.backend, pattern)

    def test_logout_flow_supports_single_and_all_devices_revocation(self):
        pattern = re.compile(
            r"def\s+logout\(payload\):[\s\S]*?"
            r"all_devices\s*=\s*bool\(data.get\('all_devices',\s*False\)\)[\s\S]*?"
            r"if\s+all_devices\s+or\s+not\s+refresh_token:[\s\S]*?"
            r"_revoke_user_refresh_tokens\(payload\['user_id'\]\)[\s\S]*?"
            r"else:[\s\S]*?_revoke_refresh_token\(refresh_token\)",
            re.MULTILINE,
        )
        self.assertRegex(self.backend, pattern)

    def test_mobile_401_handler_attempts_refresh_once_then_clears_session(self):
        self.assertIn("if (shouldAttemptTokenRefresh(config))", self.mobile)
        self.assertIn("config.__isRetryRequest = true;", self.mobile)
        self.assertIn("const nextAccessToken = await refreshAccessToken();", self.mobile)
        self.assertIn("await clearSessionState();", self.mobile)

    def test_mobile_logout_calls_backend_and_always_clears_local_session(self):
        self.assertIn('await apiClient.post("/auth/logout", {', self.mobile)
        self.assertIn("refresh_token: refreshToken", self.mobile)
        self.assertIn("all_devices: false", self.mobile)
        self.assertIn("await clearSessionState();", self.mobile)


if __name__ == "__main__":
    unittest.main()
