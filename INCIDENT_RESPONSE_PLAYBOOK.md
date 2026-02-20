# INCIDENT_RESPONSE_PLAYBOOK - Sahabat Qolbu

Status dokumen: **Active Ops Playbook**  
Tanggal mulai berlaku: **2026-02-20**

## 1) Tujuan
Menstandarkan respons incident agar deteksi, mitigasi, eskalasi, dan komunikasi berjalan cepat serta konsisten.

## 2) Severity Definition
- **SEV-1:** layanan inti down atau auth/payment gagal massal.
- **SEV-2:** fungsi penting terganggu signifikan, ada workaround terbatas.
- **SEV-3:** gangguan non-kritis, dampak terbatas.

## 3) Escalation Matrix
| Severity | Max ACK Time | Max Mitigation Start | Channel |
|---|---:|---:|---|
| SEV-1 | 5 menit | 10 menit | Pager + Ops channel + Tech lead |
| SEV-2 | 15 menit | 30 menit | Ops channel + on-duty engineer |
| SEV-3 | 60 menit | 1 hari kerja | Backlog + owner domain |

## 4) Trigger Sumber Deteksi
- Workflow `.github/workflows/critical-alert-monitor.yml` (auth/payment anomaly guard).
- Workflow `.github/workflows/uptime-monitor.yml` (uptime baseline).
- Workflow `.github/workflows/incident-drill.yml` (drill berkala + artifact evidence).
- Monitoring eksternal/manual report user.

## 5) SOP Penanganan
1. **Triage cepat:** validasi scope impact dan tetapkan severity.
2. **Containment:** freeze deploy baru jika potensi memperburuk incident.
3. **Mitigasi:** rollback/hotfix sesuai runbook.
4. **Komunikasi:** update status berkala ke channel ops.
5. **Recovery validation:** jalankan smoke + critical probe ulang.
6. **RCA & action item:** dokumentasi penyebab + perbaikan preventif.

## 6) Incident Record Template
```text
Incident ID: INC-YYYYMMDD-XXX
Detected At: YYYY-MM-DD HH:mm:ss TZ
Severity: SEV-1|SEV-2|SEV-3
Detected By: monitoring|workflow|user report

Symptoms:
-

Impact:
-

Mitigation:
-

Recovery Verified:
- backend smoke: PASS|FAIL
- critical alert probe: PASS|FAIL
- uptime probe: PASS|FAIL

Root Cause:
-

Follow-up Actions:
- owner / due date / status
```

## 7) Operational Drill Cadence
- Drill minimal bulanan dijalankan via workflow `.github/workflows/incident-drill.yml`.
- Output drill wajib disimpan sebagai artifact `incident-drill-report` dan direview pada weekly ops review.
- Jika drill gagal, perlakukan sebagai simulasi incident: jalankan alur eskalasi sesuai severity yang dihasilkan report.
