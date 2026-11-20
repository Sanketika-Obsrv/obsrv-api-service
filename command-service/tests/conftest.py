import os
import sys

SRC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "src"))
sys.path.insert(0, SRC_DIR)
# REPIIModel opens "config/pii_rules.yml" relative to cwd, matching the Dockerfile's
# runtime WORKDIR (/app/src) -- mirror that here rather than hardcoding an absolute path.
os.chdir(SRC_DIR)
