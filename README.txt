ROBOT PROGRAMMER MANAGER V5 — LOCAL EDITION

This version does NOT use Supabase, cloud database, programmer login, or online synchronization.

LOCAL STORAGE OPTIONS
1. Browser storage: every Save writes data to localStorage in the current browser profile.
2. Local JSON file (Chrome/Edge desktop): open Backup / Restore, click “Create / Connect Data File”, and choose where to save ROBOT_PROGRAMMER_DATABASE.json. Once connected, Save writes the latest data to that file for the current session.
3. Backup/Restore: use Download Backup to download a JSON copy, and Restore Backup to load it again on this or another device.

IMPORTANT LIMITATIONS
- A browser website cannot automatically rewrite index.html or files inside your GitHub repository.
- Browser localStorage is specific to that browser/profile/device. It does not automatically appear on another programmer's PC or phone.
- The direct local-file connection may need to be selected again after reloading the page. Supported in modern desktop Chrome/Edge; if unavailable, use Download Backup / Restore Backup.
- If opening via GitHub Pages, this is a local-only app; the website code is hosted online, but robot data is stored locally.

RUN
Open index.html in a browser, or publish the files to GitHub Pages.


PORTABLE GITHUB ROBOT DATABASE
------------------------------
The project includes robots.json. On a fresh browser/device, the app loads robot records from this file if there is no existing local browser database.

To carry newly added robots with your GitHub project:
1. Open the app and add/edit robot data.
2. Go to Backup / Restore and click Download Backup (the file downloads as robots.json).
3. In your project folder, replace the existing robots.json with the downloaded file.
4. Commit and push the updated robots.json to GitHub along with your project.
5. On another PC, download/reload the project. A fresh browser will load the saved robots.json.

IMPORTANT: GitHub Pages is static hosting. The website cannot automatically update files in your GitHub repository. You must manually replace and upload/commit robots.json after exporting. Existing browser localStorage takes priority; on a PC that already has old local data, use Restore Backup or clear this site's browser data to load the project file.
