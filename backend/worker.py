"""Dedicated background worker runtime.

This process imports the Flask app module to initialize shared services,
then keeps the process alive so background jobs can run without exposing
an HTTP listener.
"""

import signal
import time

# Import side effects initialize background workers depending on APP_PROCESS_ROLE.
import app as backend_app  # noqa: F401

_running = True


def _stop(_signum, _frame):
    global _running
    _running = False


signal.signal(signal.SIGTERM, _stop)
signal.signal(signal.SIGINT, _stop)

print("[INFO] Worker process started and waiting for background jobs", flush=True)
while _running:
    time.sleep(5)

print("[INFO] Worker process shutting down", flush=True)
