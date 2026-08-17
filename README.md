# Ahmed Group AI Project (Prototype)

A clickable front-end prototype of a multi-module Accounts & Finance platform for a textile group, replacing several manual Excel/Word-based processes with one tool. After a demo login, a **Module Hub** links to six modules: **LC Tracking** (export L/C realization tracking, overdue interest, maturity alerts), **LC Scrutiny** (verifies an LC's clauses against the PI — financial, banking, shipment, payment, and compliance — cross-referencing LC Tracking's own data, and auto-raises discrepancy alerts across six categories), **Loan Management** (an STL/UPAS/OD/EDF facility register with its own dashboard and overdue-interest logic), **Bank Charge Preparation** (computes LC-related bank charges and produces a printable voucher), **Email Generation** (fills in and prints the group's real formal bank letters to Bank Asia — Mobile Bill Allowance disbursement and inter-company Fund Transfer requests — with every entity, account, and signatory picked from a dropdown, amounts auto-converted to words, print/PDF-ready), and **Yarn Costing & Profitability Analytics** — the largest module, a 13-screen daily-closing ERP workflow (Dashboard, Daily Closing/Input, Yarn Costing, Production, Raw Material/Cotton Cost, Wastage & By-products, Sales & Revenue, Estimated vs Actual, Profitability Analysis, Monthly Analysis, Reports, Master Data, Alerts) covering production and cost entry, compounding multi-process wastage, weighted-average inventory/COGS, estimated-vs-actual variance with drill-down, a scenario/what-if simulator, and auto-generated alerts, over 45 days of generated (not hand-written) daily data for 4 yarns. All data is hardcoded and derived live — no backend, no persistence beyond the session.

## Run it

```bash
npm install
npm run dev
```

Then open the printed local URL (typically `http://localhost:5173`). Log in with the pre-filled demo credentials — just click **Sign In**.
