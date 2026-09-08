# Peter Hill Swimming — Progress Tracker

A Google Apps Script web app for tracking swim class attendance, skill
assessments, achievements, and parent updates. The backend runs entirely on
Google's infrastructure (Sheets, Gmail, Drive, Slides) — this repo exists for
version control and history, not for hosting.

## How it's structured

| File | Purpose |
|---|---|
| `Code.gs` | All server-side logic — reads/writes the Google Sheet, generates certificates, sends parent emails. |
| `Index.html` | The web app UI (tabs for Lesson Setup, Pupils & Scoring, Attendance, Overview, Settings). |
| `appsscript.json` | Apps Script project manifest (runtime, web app access settings). |

## Required Google Sheet tabs

The spreadsheet ID is set in `Code.gs` (`SPREADSHEET_ID`). It needs these
sheets with these exact header rows:

| Sheet | Columns |
|---|---|
| `Teachers` | TeacherID, FirstName, LastName |
| `Pupils` | PupilID, FirstName, LastName, ParentEmail, CurrentLevel, ClassID |
| `Classes` | ClassID, LevelName, Day, Time, TeacherID |
| `Skills` | LevelName, SkillNumber, SkillDescription |
| `Assessments` | AssessmentID, PupilID, ClassID, LevelName, WeekNumber, Date, SkillNumber, Score |
| `Achievements` | PupilID, AchievementName, DateEarned |
| `WeekPlan` | LevelName, WeekNumber, SkillNumber, LessonOutline |

Optional (features degrade gracefully if these are missing):

| Sheet | Columns | Enables |
|---|---|---|
| `EmailLog` | PupilID, LevelName, WeekNumber, DateSent | Duplicate-send guard |
| `Attendance` | AttendanceID, PupilID, ClassID, Date, Status | Attendance tab |

## Setting this up on GitHub

You don't need any special tools for this — GitHub works fine as a plain
storage/backup location for the files.

### Simple approach (no command line needed)

1. Go to github.com and create a new repository (private is the simplest
   choice for a personal-use project like this).
2. On the repo page, click **Add file → Upload files**.
3. Drag in `Code.gs`, `Index.html`, `appsscript.json`, `README.md`, and
   `.gitignore` from this folder, then commit.
4. Whenever you make changes in the Apps Script editor, come back here and
   re-upload the changed file(s) the same way to keep GitHub in sync.

That's it — you now have a version history of every upload, and the files
are downloadable any time from the **Code** tab of the repo.

### Note on the favicon

The tab icon is set via a `<link rel="icon">` tag pointing at your logo's
Google Drive image URL, not a local file — so it works identically whether
`Index.html` lives in Apps Script, on GitHub, or downloaded to your desktop.
Nothing needs to change there.

### If you outgrow re-uploading by hand

`clasp` (Google's official CLI for Apps Script) can sync your local files
with the *live* Apps Script project automatically, and normal `git` commands
handle the GitHub side — useful once you're editing locally rather than in
the browser-based Apps Script editor. Ask if you'd like that workflow set up
later; it's a bit more setup than the simple approach above but saves the
manual re-upload step.

### Notes

- Never commit `.clasprc.json` if you do end up using clasp — it holds your
  Google login token. The included `.gitignore` already excludes it.
- The code itself contains no pupil data — that all lives in the Google
  Sheet, which is governed by its own separate sharing permissions regardless
  of whether this repo is public or private.
