import re
from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"

# Mobile app uses these backend endpoints directly in src/services/api.ts
MOBILE_BACKEND_CONTRACT = {
    ("POST", "/auth/register"),
    ("POST", "/auth/verify-email"),
    ("POST", "/auth/resend-verification"),
    ("POST", "/auth/login"),
    ("POST", "/auth/refresh"),
    ("POST", "/auth/logout"),
    ("POST", "/auth/forgot-password"),
    ("POST", "/auth/verify-reset-code"),
    ("POST", "/auth/reset-password"),
    ("PUT", "/auth/update"),
    ("PUT", "/auth/change-password"),
    ("GET", "/health"),
    ("GET", "/rates/live"),
    ("GET", "/signal"),
    ("POST", "/signal/save"),
    ("GET", "/signals/history"),
    ("GET", "/signals/stats"),
    ("GET", "/signals/latest"),
    ("GET", "/api/market-analysis"),
    ("GET", "/api/market-analysis/status/<job_id>"),
    ("GET", "/api/news"),
    ("POST", "/api/news/analyze"),
    ("GET", "/notifications/in-app"),
    ("GET", "/notifications/in-app/unread-count"),
    ("POST", "/notifications/in-app/mark-read"),
}


def extract_backend_routes(file_content: str):
    route_pattern = re.compile(
        r"@app\.route\(\s*'(?P<path>[^']+)'\s*,\s*methods\s*=\s*\[(?P<methods>[^\]]+)\]\s*\)",
        re.MULTILINE,
    )
    method_pattern = re.compile(r"'([A-Z]+)'")

    routes = set()
    for match in route_pattern.finditer(file_content):
        path = match.group("path")
        methods_raw = match.group("methods")
        methods = method_pattern.findall(methods_raw)
        for method in methods:
            routes.add((method, path))
    return routes


class ApiContractTest(unittest.TestCase):
    def test_mobile_contract_endpoints_exist_in_backend(self):
        self.assertTrue(BACKEND_APP_PATH.exists(), f"Missing backend app file: {BACKEND_APP_PATH}")

        backend_content = BACKEND_APP_PATH.read_text(encoding="utf-8")
        backend_routes = extract_backend_routes(backend_content)

        missing = sorted(MOBILE_BACKEND_CONTRACT - backend_routes)

        self.assertEqual(
            missing,
            [],
            "Mobile -> Backend API contract mismatch. Missing endpoints: "
            + ", ".join([f"{method} {path}" for method, path in missing]),
        )


if __name__ == "__main__":
    unittest.main()
