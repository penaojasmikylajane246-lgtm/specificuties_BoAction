# BoAction Community Concern Reporting

Open `index.html` in a modern browser to run the client-side prototype. Demo sign-in is available from the login screen for residents and LGU administrators.

Residents can submit complaints with 1–5 supporting images, follow verification and handling updates, exchange messages with barangay personnel, and view resolution photos. LGU administrators can review and reject reports with a reason, verify and assign personnel, update progress, attach resolution evidence, and monitor complaint statistics and charts.

The prototype stores accounts, reports, messages, and notifications in browser `localStorage`. Changes appear in other tabs in the same browser through the storage event; this is not a shared database or cross-device real-time service. Production deployment needs a backend for secure accounts, shared records, authorization, file storage, and push or live notifications.
