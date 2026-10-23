TASKS & LISTS

Upload this folder to your GitHub Pages publishing location. It contains one index.html with the app HTML, CSS, JavaScript and both embedded sections, plus installation/offline support files. No build or dependencies required.

Tap the hamburger icon where the star used to be. Choose Tasks or Lists in the top menu. The app remembers your most recent choice in this browser on this device. Choose Lists from the menu while viewing an item list to return to all lists.

Existing Tasks behavior and saved-data keys are retained. Lists uses your latest supplied version: independent item height (46px default) and list height (64px default), with your existing other appearance defaults preserved. Each section keeps its own existing Settings panel.

Upload the extracted files, not the ZIP. If placed at repository-root /organizer/, open https://YOUR-USERNAME.github.io/organizer/ (include the repository name for project repositories). To preserve the existing Tasks app address, you can instead replace the contents of /tasks/ with these files.

Saved Tasks and Lists are reused when both apps were on the same HTTPS origin and browser profile. Moving to a different domain, browser profile, or isolated installed-app storage does not automatically transfer data. No existing data is deleted by switching sections.

Phone installation: open the published address in Safari (iPhone) or Chrome (Android), then use Add to Home Screen / Install. Load it online once before offline use.

The separate Tasks-and-Lists.html download can be opened alone for a preview. Use this complete package for phone installation and offline support. File-URL storage behavior can vary between browsers.

Verified: script syntax, menu switching, saved selection/reload, existing storage keys and height defaults. Visual browser and physical-phone installation tests were unavailable.

BACKUPS
Use Settings (gear) > Export backup to download a JSON file containing tasks, lists, completed states, manual order, aisles, appearance settings and last-selected section. Use Import backup to select that file. The app validates it and asks before replacing current data. Import replaces all data and settings; it does not merge. Keep backup files somewhere safe. Invalid or unsupported files are rejected before storage is changed.

STARTUP CHOICE
Settings > Start app in (above backup buttons) offers Tasks, Lists, or Last used. Default is Tasks. It is shared between both Settings screens and included in backups. Older backups without this setting default to Tasks. Changing the choice affects the next app launch; it does not switch the current section.
