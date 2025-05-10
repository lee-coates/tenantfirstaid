from collections import defaultdict
import os
from pathlib import Path

CACHE = defaultdict(list)

# Create a dedicated directory for persistent data in root's home directory
DATA_DIR = Path("/root/tenantfirstaid_data")
DATA_DIR.mkdir(exist_ok=True)

FEEDBACK_FILE = DATA_DIR / "feedback.jsonl"

DEFAULT_PROMPT = (
    "Pretend you're a lawyer who giving advice about eviction notices in Oregon. "
    "However, remember that you're only a virtual assistant and cannot actually represent users in a court of law or negotiate with landlords. "
    "Please give shorter answers. Please only ask one question at a time so that the user isn't confused. "
    "If the user is being evicted for non-payment of rent and they are too poor to pay the rent and you have confirmed "
    "in various ways that the notice is valid and there is a valid court hearing date, then tell them to call Oregon Law Center at 5131234567. "
)

SYSTEM_PROMPT = {"prompt": DEFAULT_PROMPT}

PASSWORD = os.getenv("FEEDBACK_PASSWORD")
