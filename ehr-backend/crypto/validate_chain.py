import hashlib
from typing import List, Tuple
from models.tables import AuditLog


def _chain_hash(log: AuditLog) -> str:
    """
    Compute a deterministic hash of a log's stable fields.
    This is what gets stored as the NEXT log's record_hash to form the chain.
    """
    raw = f"{log.id}|{log.user_id}|{log.patient_id}|{log.action}|{log.timestamp.isoformat()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def validate_log_chain(logs: List[AuditLog]) -> Tuple[bool, List[int]]:
    """
    Validates the blockchain-style hash chain across all logs.

    Each log's record_hash should equal the chain-hash of the log before it
    (except the genesis/first log which has nothing to chain from).

    Returns (is_valid, list_of_broken_log_ids).
    """
    if len(logs) < 2:
        return True, []

    # Sort by timestamp then id to get deterministic chain order
    sorted_logs = sorted(logs, key=lambda l: (l.timestamp, l.id))
    broken_ids = []

    for i in range(1, len(sorted_logs)):
        prev = sorted_logs[i - 1]
        curr = sorted_logs[i]
        expected = _chain_hash(prev)
        if curr.record_hash != expected:
            broken_ids.append(curr.id)

    return len(broken_ids) == 0, broken_ids