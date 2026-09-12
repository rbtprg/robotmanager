# ROBOT PROGRAMMER MANAGER V6 — ONLINE

## What V6 does

- GitHub Pages hosts the website.
- Supabase stores one central copy of the robot database.
- All authenticated robot programmers can read and edit robot records.
- Changes are pushed to other open browsers through Supabase Realtime.
- Login uses Supabase Email/Password authentication.
- Change history stores who changed a robot, which section, action, and time.
- Browser localStorage is retained as a temporary/offline cache.
- V5 local data can be uploaded to the new cloud database after login.

## 1. Create the Supabase project

Create a Supabase project and open its SQL Editor.

## 2. Create the tables

Open `supabase_schema.sql` from this project, copy everything, paste it into Supabase SQL Editor, and Run it.

The SQL creates:

- `public.robots`
- `public.change_history`
- RLS policies
- `updated_at` trigger
- Realtime for `robots`

## 3. Enable Email/Password login

In Supabase:

Authentication -> Providers -> Email

Enable Email/Password.

For company use, decide whether email confirmation should be required.

## 4. Put your Supabase URL and publishable key in the website

Open:

`supabase-config.js`

Replace:

`https://YOUR-PROJECT.supabase.co`

and:

`YOUR_SUPABASE_PUBLISHABLE_KEY`

with the values from your Supabase project's Connect/API settings.

Use ONLY the PUBLISHABLE key (or legacy anon key).

NEVER use the `service_role` or secret key in a browser/GitHub Pages site.

## 5. GitHub Pages

Upload all files in this folder to the GitHub repository used by your Pages website.

The important files are:

- index.html
- style.css
- app.js
- supabase-config.js
- supabase_schema.sql
- SETUP_SUPABASE.md
- cal.pdf
- og.html
- oh.js
- manifest.json

After GitHub Pages publishes the site, every programmer uses the same website and the same Supabase database.

## 6. First login

Open the website.

1. Click Create Account.
2. Register each programmer's company email/password.
3. If email confirmation is enabled, confirm the email.
4. Log in.

All signed-in users are allowed to read/write robots under the supplied RLS policy.

## 7. Move your V5 local data to the cloud

If the browser already contains your V5 robot data:

1. Log in.
2. Open Backup / Restore.
3. Use `Upload Local Data To Cloud`.
4. Confirm the upload.

Do this once from the computer that contains the correct V5 data.

## 8. Important security rule

The publishable/anon key is designed for use in the browser. Security comes from Supabase Auth + Row Level Security.

Never paste a Supabase secret/service_role key into:

- app.js
- supabase-config.js
- GitHub
- GitHub Pages
- browser JavaScript

## 9. Company access model

The included policy intentionally gives every authenticated programmer read/write/delete access to all robot records, because the requested workflow is:

Programmer A saves -> Programmer B opens the website -> Programmer B sees the updated robot data.

If you later want Admin / Programmer / Viewer permissions, add a `profiles` table and role-based RLS policies.
