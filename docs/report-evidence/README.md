# Sahabat Qolbu Report Evidence

Local evidence pack for the production-readiness report.

Generated on: 2026-04-28

## Screenshot-style images

Use these PNG files directly in the report:

- `screenshots/01-backend-tests-pass.png`
- `screenshots/02-backend-production-guards.png`
- `screenshots/03-dashboard-checks-pass.png`
- `screenshots/04-frontend-checks-pass.png`
- `screenshots/05-agent-workflow-git-branch.png`

## Raw logs

Full command outputs are stored in `logs/`:

- `backend-npm-test.log`
- `backend-check-migrations.log`
- `backend-check-runbook.log`
- `backend-check-api-contract.log`
- `backend-check-pii-governance.log`
- `backend-check-prod-env.log`
- `backend-db-push-guard.log`
- `dashboard-menu-routes.log`
- `dashboard-lint.log`
- `dashboard-build.log`
- `frontend-lint.log`
- `frontend-build.log`
- `git-status.log`
- `git-last-commit.log`

## Notes for the report

- Backend test evidence shows `52` tests discovered, `48` passed, `0` failed, and `4` DB integration cases skipped because staging/test DB was not enabled.
- Dashboard lint passes with warnings. This is intentional production-readiness behavior for now: legacy lint debt remains visible as warnings while build/type checks pass.
- `npm run db:push` is intentionally blocked. Production database changes must use reviewed migrations and `npm run db:migrate`.
- Live staging smoke and GitHub Actions UI screenshots are separate operational evidence and should be captured from the deployed environment/GitHub UI when available.
