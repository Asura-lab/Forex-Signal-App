from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"


class MongoIndexContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = BACKEND_APP_PATH.read_text(encoding="utf-8")

    def test_users_email_unique_index_present(self):
        self.assertIn("_ensure_index(users_collection, 'email', name='uniq_users_email', unique=True)", self.content)

    def test_verification_indexes_present(self):
        self.assertIn(
            "_ensure_index(verification_codes, 'email', name='uniq_verification_email', unique=True)",
            self.content,
        )
        self.assertIn(
            "_ensure_index(verification_codes, 'expires_at', name='ttl_verification_expires', expireAfterSeconds=0)",
            self.content,
        )

    def test_reset_indexes_present(self):
        self.assertIn("_ensure_index(reset_codes, 'email', name='uniq_reset_email', unique=True)", self.content)
        self.assertIn(
            "_ensure_index(reset_codes, 'expires_at', name='ttl_reset_expires', expireAfterSeconds=0)",
            self.content,
        )


if __name__ == "__main__":
    unittest.main()
