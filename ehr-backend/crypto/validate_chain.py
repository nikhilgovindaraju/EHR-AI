import hashlib
from typing import List, Tuple
from models.tables import AuditLog

# Simple hash function for chaining
def compute_hash(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()

# Reconstruct the hash chain from audit logs and validate
def validate_log_chain(logs: List[AuditLog]) -> Tuple[bool, List[int]]:
    """
    Validates the hash chain in the list of logs.
    Returns a tuple:
    - True if all are valid, False otherwise
    - List of invalid log IDs (if any)
    """
    invalid_log_ids = []

    # Sort logs by timestamp to reconstruct chain order
    sorted_logs = sorted(logs, key=lambda log: log.timestamp)

    for i in range(1, len(sorted_logs)):
        prev_log = sorted_logs[i - 1]
        current_log = sorted_logs[i]

        # Expected hash = hash of previous log’s content
        prev_data = f"{prev_log.user_id}-{prev_log.patient_id}-{prev_log.action}-{prev_log.timestamp}"
        expected_hash = compute_hash(prev_data)

        if current_log.record_hash != expected_hash:
            invalid_log_ids.append(current_log.id)

    return len(invalid_log_ids) == 0, invalid_log_ids
