ROBOT PROGRAMMER MANAGER V6 — ONLINE
====================================

This version changes the application from browser-only storage to a shared online database.

HOSTING
-------
GitHub Pages hosts the frontend.

DATABASE / LOGIN
----------------
Supabase provides:
- PostgreSQL shared database
- Email/password programmer login
- Row Level Security
- Realtime robot updates
- Change history

IMPORTANT
---------
Before publishing, edit:
    supabase-config.js

Enter your Supabase project URL and PUBLISHABLE key.
NEVER use the service_role/secret key in browser code.

DATABASE SETUP
--------------
Run:
    supabase_schema.sql

in the Supabase SQL Editor.

Then follow:
    SETUP_SUPABASE.md

MAIN V6 FEATURES
-----------------
- Shared robot database for all signed-in programmers
- Realtime updates when another programmer changes a robot
- Calibration process PDF
- Calibration values + 9 MASTER COUNT rows
- Digital Input: 10 rows, 5 columns
- Digital Output: 10 rows, 5 columns
- Universal Input: 10 rows, 5 columns
- Universal Output: 10 rows, 5 columns
- Ethernet configuration
- Old Fanuc overhang generator
- New Fanuc overhang generator
- Aluminium panel diagram generator
- Other robot/cell details
- Local JSON backup/restore
- V5 local-data upload to cloud
- Responsive PC/mobile layout

I/O TABLE FORMAT
----------------
1. SR.NO
2. RANGE
3. RACK
4. SLOT
5. START

Each I/O section starts with 10 rows. The + ADD button can add extra rows if needed.

DATA FLOW
---------
Programmer A saves -> Supabase -> Realtime -> Programmer B sees the update.

If the internet is temporarily unavailable, the current browser cache remains available.
