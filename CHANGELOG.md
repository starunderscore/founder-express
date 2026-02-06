# Changelog

All notable changes to this starter are documented here.

## 1.0.0 — First baseline observed (Employee Portal + User Manual)
Date: 2026-02-06

Highlights
- Employee Portal is fully scaffolded for day‑to‑day operations; landing site and client portal are intentionally empty for teams to customize.
- A concise Employee Portal user manual (v1.0.0) lives in `docs/manuals/user-manual/v1.0.0` with a site TOC at `docs/site/toc.json`.

Employee Portal
- Clean sidebar navigation (Users, Content, Financial, Tools), consistent headerbars with short subheaders, and right‑aligned context actions.
- Icons accompany key headers and TOC cards for quick visual scanning.

Customers & Vendors (CRM)
- Database with search, Archive, and Removed views; Merge workspace for deduping.
- Shared profile model for customers and vendors (notes, contacts, tags, ownership).
- Vendors called out as suppliers for clarity.

Email Subscriptions
- Newsletters: list, compose, drafts/sent, and a copy‑paste form snippet.
- Waiting Lists: create lists, manage entries, draft/send messages to a list.

Finance
- Overview stats (paid, outstanding, late) and A/R‑style insights.
- Invoices with quick status updates; Products & Prices (one‑time/recurring); Taxes management; basic reports.

Website
- News Bar (on/off, primary/secondary lines, preview) and Blogs (draft/publish).

Employees & Roles
- Employees management (active/archive/removed) and a dedicated Roles area.
- Roles are visible from profile for self‑serve troubleshooting of access.

Settings & Policies
- User Settings for Appearance and Security (password changes).
- Company Settings for organization values and email templates/vars.
- Admin Settings for Data Operations, Third‑party Configuration, and System Values.
- Privacy Policy (client terms) and Cookie Policy with versioned entries, “Select active” controls, and a global toggle to disable built‑ins when using third‑party solutions.

Documentation
- User manual is intentionally light: quick intros per area, a troubleshooting page, and a glossary.

Notes
- This baseline favors speed: simple flows, sensible defaults, and room to evolve. Extend the empty landing site and client portal as your product takes shape.
