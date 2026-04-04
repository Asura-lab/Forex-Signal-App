from pathlib import Path
import unittest

ROOT_DIR = Path(__file__).resolve().parent.parent
FLY_TOML_PATH = ROOT_DIR / "backend" / "fly.toml"
START_API_PATH = ROOT_DIR / "backend" / "start-api.sh"
START_WORKER_PATH = ROOT_DIR / "backend" / "start-worker.sh"


class RuntimeSeparationContractTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.fly_toml = FLY_TOML_PATH.read_text(encoding="utf-8")
        cls.start_api = START_API_PATH.read_text(encoding="utf-8")
        cls.start_worker = START_WORKER_PATH.read_text(encoding="utf-8")

    def test_fly_process_groups_include_app_and_worker(self):
        self.assertIn("[processes]", self.fly_toml)
        self.assertIn('app = "sh ./start-api.sh"', self.fly_toml)
        self.assertIn('worker = "sh ./start-worker.sh"', self.fly_toml)

    def test_api_process_disables_background_workers(self):
        self.assertIn('APP_PROCESS_ROLE="api"', self.start_api)
        self.assertIn('BACKGROUND_WORKERS_ENABLED="false"', self.start_api)

    def test_worker_process_enables_background_workers(self):
        self.assertIn('APP_PROCESS_ROLE="worker"', self.start_worker)
        self.assertIn('BACKGROUND_WORKERS_ENABLED="true"', self.start_worker)


if __name__ == "__main__":
    unittest.main()
