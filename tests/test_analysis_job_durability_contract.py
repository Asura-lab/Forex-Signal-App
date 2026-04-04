from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
BACKEND_APP_PATH = ROOT_DIR / "backend" / "app.py"


class AnalysisJobDurabilityContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.content = BACKEND_APP_PATH.read_text(encoding="utf-8")

    def test_analysis_jobs_collection_is_configured(self):
        self.assertIn("analysis_jobs_collection = db['analysis_jobs']", self.content)
        self.assertIn("_ensure_index(analysis_jobs_collection, 'expires_at', name='ttl_analysis_jobs_expires', expireAfterSeconds=0)", self.content)

    def test_active_job_uniqueness_and_db_claim_exist(self):
        self.assertIn("name='uniq_analysis_jobs_pair_active'", self.content)
        self.assertIn("partialFilterExpression={'status': {'$in': ['queued', 'running']}}", self.content)
        self.assertIn("def _claim_next_analysis_job_from_db():", self.content)

    def test_status_updates_are_persisted(self):
        self.assertIn("def _persist_analysis_job(job):", self.content)
        self.assertIn("_persist_analysis_job(snapshot)", self.content)


if __name__ == "__main__":
    unittest.main()
