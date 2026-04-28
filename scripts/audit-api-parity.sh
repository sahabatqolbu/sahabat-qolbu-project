#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

python - <<'PY'
from pathlib import Path
import sys

ROOT = Path.cwd()

checks = [
    {
        "name": "dashboard agen commission service",
        "file": ROOT / "dashboard/src/services/agenService.ts",
        "needles": ["/agen/commission"],
    },
    {
        "name": "dashboard agen completeness service",
        "file": ROOT / "dashboard/src/services/agenService.ts",
        "needles": ["/agen/jamaah/${jamaahId}/completeness"],
    },
    {
        "name": "dashboard jamaah admin document upload service",
        "file": ROOT / "dashboard/src/services/jamaahService.ts",
        "needles": ["/jamaah/admin/${bookingNumber}/documents"],
    },
    {
        "name": "dashboard admin agen alias service",
        "file": ROOT / "dashboard/src/services/adminService.ts",
        "needles": ["/agen/admin", "/agen/admin/${id}"],
    },
    {
        "name": "dashboard admin master alias service",
        "file": ROOT / "dashboard/src/services/adminService.ts",
        "needles": ["/admin/master/agent-levels", "/admin/master/periods"],
    },
    {
        "name": "dashboard notification admin reminder routes",
        "file": ROOT / "dashboard/src/services/adminService.ts",
        "needles": [
            "/notifications/admin/reminders/jamaah",
            "/notifications/admin/reminders/agen",
            "/notifications/admin/reminders/send",
        ],
    },
    {
        "name": "backend agen commission route",
        "file": ROOT / "backend/src/routes/agen.js",
        "needles": ["router.get(\"/commission\"", "agenController.getCommission"],
    },
    {
        "name": "backend agen completeness route",
        "file": ROOT / "backend/src/routes/agen.js",
        "needles": ["router.get(\"/jamaah/:id/completeness\"", "agenJamaahController.getJamaahCompleteness"],
    },
    {
        "name": "backend admin jamaah document upload route",
        "file": ROOT / "backend/src/routes/jamaah.js",
        "needles": ["/admin/:bookingNumber/documents", "uploadAdminDocument"],
    },
    {
        "name": "backend admin agen explicit alias mount",
        "file": ROOT / "backend/src/routes/api.js",
        "needles": ["router.use(\"/admin/agen\", adminAgenAliasRouter);"],
    },
    {
        "name": "backend admin jamaah explicit alias mount",
        "file": ROOT / "backend/src/routes/api.js",
        "needles": ["router.use(\"/admin/jamaah\", adminJamaahAliasRouter);"],
    },
    {
        "name": "backend admin master explicit alias mount",
        "file": ROOT / "backend/src/routes/api.js",
        "needles": ["router.use(\"/admin/master\", masterRoutes);"],
    },
    {
        "name": "backend commission controller",
        "file": ROOT / "backend/src/controllers/agenController.js",
        "needles": ["export const getCommission = async", "inArray(transactions.jamaahId, ownedJamaahIds)"],
    },
    {
        "name": "backend completeness controller",
        "file": ROOT / "backend/src/controllers/agenJamaahController.js",
        "needles": ["export const getJamaahCompleteness = async", "percentage >= 80"],
    },
    {
        "name": "backend admin document controller",
        "file": ROOT / "backend/src/controllers/jamaahController.js",
        "needles": ["export const uploadAdminDocument = async", "ADMIN_UPLOAD_DOCUMENT_MAP"],
    },
]

errors = []

for check in checks:
    text = check["file"].read_text(encoding="utf-8")
    missing = [needle for needle in check["needles"] if needle not in text]
    if missing:
        errors.append(
            f"[FAIL] {check['name']} -> missing {', '.join(repr(item) for item in missing)} in {check['file'].relative_to(ROOT)}"
        )
    else:
        print(f"[OK] {check['name']}")

api_routes = (ROOT / "backend/src/routes/api.js").read_text(encoding="utf-8")
if "req.url =" in api_routes:
    errors.append("[FAIL] backend/src/routes/api.js still mutates req.url; explicit alias mounts are required")
else:
    print("[OK] backend api router avoids req.url mutation")

if errors:
    print("\nAPI parity audit failed:\n", file=sys.stderr)
    for error in errors:
        print(error, file=sys.stderr)
    sys.exit(1)

print("\nAPI parity audit passed.")
PY
