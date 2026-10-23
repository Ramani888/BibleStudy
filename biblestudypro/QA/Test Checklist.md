# Test Checklist — every feature, module by module

Made 2026-10-23 from the real app code (v2: every search box + small actions added).
**Status:** ⬜ not tested · ✅ works · ❌ broken (note says why) · 🔧 was broken, now fixed · 👤 needs owner / real phone (Google, Apple, camera, WhatsApp, push, store).
Claude tests group by group in the emulator, fixes what is broken, and updates this file + the table below.

Test in **light AND dark mode**. Test account (emulator, local DB): `qa@verdance.dev` / `Verdance123`.

## Progress

| Group | Tests | ⬜ To test | ✅ Works | ❌ Broken | 🔧 Fixed | 👤 Needs you |
|---|---|---|---|---|---|---|
| 1. First open & Sign-in | 36 | 0 | 28 | 0 | 4 | 4 |
| 2. Home | 28 | 0 | 20 | 0 | 6 | 2 |
| 3. Library — My sets | 24 | 0 | 22 | 0 | 2 | 0 |
| 4. Library — Folders | 12 | 0 | 11 | 0 | 1 | 0 |
| 5. Library — Inside a set (Set detail) | 15 | 0 | 10 | 0 | 4 | 1 |
| 6. Library — Cards | 11 | 0 | 9 | 0 | 2 | 0 |
| 7. Library — Explore & Friends' sets | 12 | 0 | 10 | 0 | 2 | 0 |
| 8. Library — Study plans | 14 | 0 | 12 | 0 | 1 | 1 |
| 9. Quiz — mode picker, hub, details, new quiz | 29 | 28 | 0 | 0 | 0 | 1 |
| 10. Quiz — playing & results | 16 | 16 | 0 | 0 | 0 | 0 |
| 11. Ask (AI) | 31 | 30 | 0 | 0 | 0 | 1 |
| 12. Profile & Settings | 50 | 40 | 0 | 0 | 0 | 10 |
| 13. Friends | 31 | 29 | 0 | 0 | 0 | 2 |
| 14. Notes | 15 | 14 | 0 | 0 | 0 | 1 |
| 15. Media | 12 | 9 | 0 | 0 | 0 | 3 |
| 16. Whole app | 7 | 6 | 0 | 0 | 0 | 1 |

---

## 0. How to test — the same tests for every screen

### 🔍 Every search box — do ALL 7 tests on each one (marked 🔍 below)
1. Type a **full name** → the right item shows
2. Type **part** of a name (e.g. "Rom" for "Romans") → it shows
3. Type in **CAPITALS / small letters** → same result
4. Type something that **does not exist** ("zzzz") → "no match" message + **Clear search** works
5. **Delete the text** (or ✕ / Cancel) → full list comes back
6. Search for something that is in the **answer / description** (where the line says it searches that)
7. Leave the screen and come back → search is empty again (not stuck)

### 📄 Every list screen — check these too (marked 📄 below)
- **Pull down** to refresh → spinner, list updates
- **Empty** (no items yet) → friendly message + button
- **No internet** (turn Wi-Fi off) → error message + **Try again** works when Wi-Fi is back
- Long list → scrolls smooth, loads more at the bottom (where it says "loads more")

---

## 1. First open & Sign-in

**Onboarding (first time only — clear app data to see it again)**
- ✅ 3 slides, "1 of 3" counter moves with **Next**
- ✅ **Skip** (slides 1–2) → Sign in
- ✅ Last slide: **Create my account** → Register
- ✅ Last slide: **Sign in** → Login
- ✅ Close and open app again → onboarding does not show again

**Login**
- ✅ Sign in with email + password
- ✅ Keyboard **Next** jumps to password, **Done** signs in
- ✅ Show / hide password eye
- 🔧 Wrong password → "That email and password don't match"  — message was invisible (empty gap) — fixed 08f1927
- ✅ Not-verified email → new code sent + **Enter the code** link
- ✅ Google/Apple-only account with email login → "use Apple or Google" message
- ✅ No internet → error message
- 👤 **Continue with Google** works
- 👤 Cancel Google → no error shown
- 👤 **Continue with Apple** (iPhone only)
- ✅ **Forgot password?** link
- ✅ **Create an account** link
- ✅ Terms / Privacy links open

**Register**
- ✅ Name (2+ letters), email, password  — name + email errors show
- ✅ Password rules turn green: 8+ letters, 1 capital, 1 number
- ✅ Without ticking "I agree" → **Create account** shows error; Google/Apple say "Please agree"
- 🔧 Email already used → **Sign in instead** link  — message was invisible — same fix 08f1927
- 🔧 Create account → Verify email screen  — looked stuck until a touch: code box opened the keyboard mid-screen-change — fixed 50742ce
- ✅ **Back to sign in**

**Verify email**
- ✅ Type 6-digit code → logs in by itself ("Email verified. Taking you in…")
- ✅ **Verify email** button also works  — auto-submit on 6th digit
- ✅ Wrong code → "That code didn't work"
- ✅ **Resend code** + countdown timer  — was a mis-tap; works, new code sent, 0:30 countdown
- ✅ "Wrong email? **Change it**" (only when coming from Register)

**Forgot / Reset password**
- ✅ Enter email → **Send reset code**
- ✅ Enter code, new password (rules), confirm → "Passwords match" / "don't match yet"
- ✅ **Resend** code + timer
- 🔧 Wrong / old code → error  — correct code after limit showed "code didn't work" — now says "Too many tries" (9165308)
- ✅ **Save new password** → message + back to Login, new password works, old one doesn't

**Terms of Service (in app)**
- ✅ Sections open / close
- 👤 Contact email link opens mail app

---

## 2. Home

**Top**
- 🔧 Date + greeting by time (Good morning / afternoon / evening) + first name
- ✅ Avatar → Profile
- ✅ Ask icon → AI consent (first time) or chat
- 🔧 Bell → Notifications; red number shows (max "9+")

**Today card (3 different states)**
- 🔧 Cards due → "N cards are ready" + streak → **Start review** starts a quiz of due cards
- ✅ Nothing due → "Pick up where you left off" → **Open set**
- ✅ New user, no sets → "Start here" → **Create a set**

**Today's verse**
- 🔧 New verse each day, works with no internet
- 🔧 NEW tag until you tap Memorize or Share
- ✅ **Memorize this** → "Added to Daily verses", button turns off for today
- ✅ Check Library → "Daily verses" set has the verse as a card
- 👤 **Share** → phone share sheet

**Sunday card (Sundays only)**
- 👤 **Share on WhatsApp**
- ✅ ✕ hides it for today

**Shortcuts — each opens the right screen**
- ✅ New set
- ✅ Study plans
- ✅ Achievements
- ✅ Leaderboard
- ✅ Notes
- ✅ Media
- ✅ Explore
- ✅ Friends

**Lists (not shown for brand-new users)**
- ✅ Recent sets (4) with DUE tag + **See all** → Library
- 🔧 Friends' sets row → opens read-only set; **See all**
- ✅ "What friends are doing" (up to 5)
- ✅ "From the community" row + **See all** → Explore

**Automatic**
- ✅ "+1 credit claimed" message once a day (open app / come back to app)
- ✅ Credits number goes up by 1 (check Credits screen)

---

## 3. Library — My sets

- ✅ **My sets / Folders** switch (switching clears search)
- 🔧 🔍 **Search sets** — searches set **name**
- ✅ Scroll down → small search icon at top → tap → scrolls up + opens search
- ✅ **Sort** chip: Recent → A to Z → Most cards (order really changes)
- ✅ 📄 Pull to refresh · empty ("Create a set") · no internet
- ✅ Set row shows Public / Friends chip
- ✅ Tap row → Set detail
- ✅ "Looking for more? **Explore public sets**" link at bottom

**Create / edit a set**
- ✅ **+** → Create set screen (tab bar hidden)
- ✅ Cover preview changes as you type title / pick colour
- ✅ Title required (empty → can't save), max 200
- ✅ Description (optional, max 1000)
- ✅ Folder picker: "No folder" or a folder
- ✅ Colour swatches
- ✅ Who can see it: **Private / Friends / Public** (check a friend sees Friends sets, everyone sees Public)
- ✅ **Cancel** closes
- ✅ **Create set** → appears in list
- ✅ **Edit set** → change → **Save changes** → list updated
- ✅ **Delete this set** (Edit screen) → confirm → gone

**Set ⋮ menu**
- ✅ Start a quiz → mode picker
- ✅ Add a card
- ✅ Move to folder → "Moved to folder"; "No folder" → "Removed from folder"; current folder has tick
- ✅ Edit set
- 🔧 Delete set → "Delete this set? … and its N cards" → gone

## 4. Library — Folders

- ✅ 🔍 **Search folders** — searches folder **name**
- ✅ **Sort** chip: Recent → A to Z → Most sets
- ✅ 📄 Pull to refresh · empty ("New folder") · no internet
- ✅ **+** → New folder: name (max 200, "n / 200" counter), colour → **Save** (off when name empty)
- ✅ Folder ⋮: New set in this folder · Edit folder · Delete folder
- ✅ Delete folder → its sets stay in My sets

**Inside a folder**
- ✅ Shows set count + card count
- ✅ 🔍 **Search sets in this folder** — set **name**
- ✅ ⋮ Folder options: Edit / Delete (→ goes back)
- ✅ Set ⋮ menu works same as in My sets
- ✅ **New set in this folder** → folder already picked
- 🔧 📄 Pull to refresh · empty folder · no internet

## 5. Library — Inside a set (Set detail)

**Your own set**
- ✅ Shows "N cards · Private/Friends/Public"
- ✅ "X of Y learned" bar + ⓘ explains "learned"
- ✅ **Start a quiz** → mode picker
- ✅ **+** → Add card
- 🔧 🔍 **Search cards** — searches **question AND answer**, shows "N matches", Cancel
- 👤 **Share** (only when set has cards) → WhatsApp / More ways
- ✅ ⋮ Set options: Add a card · Edit set · Hide all answers / Show all answers · Reorder cards (2+ cards)
- 🔧 **Reorder**: hold + drag → **Save** → "Order saved"; **Cancel** → old order. (Quiz shuffles on purpose — hint no longer promises quiz order.)
- ✅ **List / Grid** switch
- ✅ Eye icon → hide / show one answer
- ✅ Note icon → private note (max 500) → **Save note**; note shows again later
- 🔧 📄 Pull to refresh · empty ("Add cards") · no internet

**Someone else's set**
- 🔧 Shows "by Name" + description
- ✅ No edit buttons
- ✅ **Save a copy** → "Saved to your library" → appears in your Library

## 6. Library — Cards

- ✅ **Q&A card**: question (2–300), answer (2–1000, counter), **Add a hint** (max 500, Remove)
- 🔧 **Story card**: reference (max 100), passage (2–2000), **Add a note** (max 500)
- 🔧 Too short / empty → can't save
- ✅ Tap preview → flips
- ✅ **Add card** → closes, card in set
- ✅ **Add & next** → stays, form clears, same type
- ✅ **Edit card** → **Save**; card type is locked
- ✅ Card ⋮ → **Duplicate card** → copy appears
- ✅ Card ⋮ → **Move to another set** → card moves (off when you have only 1 set)
- ✅ Card ⋮ → **Ask AI about this card** → chat opens and asks it
- ✅ Card ⋮ → **Delete card** → confirm → gone

## 7. Library — Explore & Friends' sets

**Explore (public sets)**
- ✅ "N public sets from the community"
- ✅ 🔍 **Search** (server search — wait a moment after typing) — set **name**
- ✅ Scroll down → loads more
- ✅ Tap → read-only set
- ✅ **+ Add** → "Added ✓" + toast → in your Library
- ✅ Your own public sets: no Add button
- 🔧 📄 Pull to refresh · empty · no internet

**Friends' sets**
- ✅ "N sets shared by your friends"
- ✅ 🔍 **Search** — set **name**
- ✅ **+ Add**, open read-only
- ✅ No friends → **Find friends** → Friends screen _(screen only opens from Home when friends have sets — this state is unreachable today)_
- 🔧 📄 Pull to refresh · no internet

## 8. Library — Study plans

- ✅ Opens from Home shortcut
- ✅ 🔍 **Search plans** — plan **title and description**
- ✅ Rows: progress ring %, leaf when complete, "x of y steps done"
- 🔧 📄 Pull to refresh · empty ("Make your first plan") · no internet
- ✅ **Create plan**: name (max 200), description (max 1000)
- ✅ Tap sets in order → numbers 1, 2, 3; tap again → removed
- ✅ Button "Create plan (N steps)" off until name + 1 set
- ✅ No sets at all → "You need a set first" → **Create a set**
- ✅ **Plan detail**: progress bar, "Up next: step N" → **Open this set**
- ✅ Tap circle → done / not done; tap step → opens set
- ✅ All done → "Plan complete" card
- ✅ Delete a set used in a plan → step shows "Set removed" _(by design the step is deleted with the set — plan shrinks; "Set removed" text is never reached)_
- 👤 **Share** plan
- ✅ **Delete plan** → confirm → sets stay

---

## 9. Quiz — mode picker, hub, details, new quiz

**Mode picker (from any set)**
- ⬜ Mix (top)
- ⬜ Q&A cards: Type the answer · Multiple choice
- ⬜ Story cards: Fill in the blanks · Type it out · Order the pieces · Read & memorize · Match the verse
- ⬜ Under 4 cards → Multiple choice / Match the verse greyed ("Needs 4+")
- ⬜ Empty set → "Add cards to this set to start quizzing"

**Quiz hub**
- ⬜ "N cards are ready" → **Start** (hidden while searching)
- ⬜ 🔍 **Search** — quiz **name AND set title**
- ⬜ Recent quizzes (last 20): score, name, source, mode, date
- ⬜ Tap row → Details
- ⬜ Row ⋮: Details · See every answer · Quiz me again · Delete from history ("Keep it" / Delete)
- ⬜ **Start a new quiz** → Setup
- ⬜ 📄 Pull to refresh · empty ("No quizzes yet") · no internet

**Quiz details**
- ⬜ Score ring, mode, source, right count, time, date (+ "First try" date after retake)
- ⬜ **See every answer** ("including the N you missed")
- ⬜ Trash → confirm → gone
- ⬜ **Quiz me again**: card quiz → "Free to retake"; AI quiz → "New questions · 2 credits"

**Quiz me again (AI quiz)**
- ⬜ "Make a new quiz on the same topic?" → **Use 2 credits**
- ⬜ AI switched off in Settings → consent text inside this dialog
- ⬜ Not enough credits → "Out of credits" → Plans screen

**New quiz (AI makes 8 questions)**
- ⬜ **A topic**: 2–100 letters, keyboard Done works
- ⬜ **My sets** → Choose sets: 🔍 **search** (set name), sort (Recent / A to Z / Most cards), tick many → **Done, N sets** (off at 0)
- ⬜ Sets with under 4 cards total → warning, button off
- 👤 **A document** → first time content rules dialog → choose: My Media / Photo Library / Take Photo / Choose PDF
- ⬜ Upload progress + file name; cost "Photo · 3" / "PDF · 5"; **Remove**
- ⬜ Quiz name (optional, max 80) — empty → uses topic / set / file name
- ⬜ "You have N credits"; short → "Not enough credits… **Get credits**"
- ⬜ First AI use → consent → **I agree** / **Not now**
- ⬜ "Making your quiz…" → quiz opens
- ⬜ Credits go down the right amount (topic/sets 2, photo 3, PDF 5)

## 10. Quiz — playing & results

- ⬜ Full screen, no tab bar; swipe-back off
- ⬜ Progress bar + "N of M", mode + difficulty chips
- ⬜ **Multiple choice / Match the verse**: tap → right green, wrong shakes
- ⬜ **Type the answer / Type it out**: type → **Check**; capitals / punctuation / accents don't matter, spelling does
- ⬜ **Fill in the blanks**: tap words into gaps, tap gap to empty, **Check**
- ⬜ **Order the pieces**: tap in order, **Undo last**, **Check**
- ⬜ **Read & memorize**: reveal line by line, Continue after all shown, not scored
- ⬜ **Mix**: different types in one quiz
- ⬜ "Correct" / "Not quite" + right answer; real cards say "comes back tomorrow" → **Continue**
- ⬜ ✕ or phone back → "Leave this quiz?" → **Leave** / **Keep going**
- ⬜ **Results**: score ring, title by score, streak, "New best" / "Best: N%", time
- ⬜ Results stay until **Done**
- ⬜ **Practice the N you missed** → new run, "Practice · not saved"
- ⬜ **See every answer**: All / Right / Missed filter; share score
- ⬜ Quiz shows in Recent quizzes
- ⬜ After a review quiz → Home "cards ready" number goes down

---

## 11. Ask (AI)

**Consent**
- ⬜ First time → 3 info rows, "More about your data" opens
- ⬜ **I agree, let's start** → chat; **Not now** → Home
- ⬜ Terms / Privacy links open

**Chat**
- ⬜ Welcome: 4 starter questions (flashcard one shows "2 credits")
- ⬜ Ask → answer; "Costs 1 credit · N left" goes down
- ⬜ Ask for flashcards → 2 credits → "N cards ready" → **Save to a set**
- ⬜ Save sheet: pick set, or new set name (max 80) → **Create** → **Save N cards**
- 👤 📎 Attach: first time rules dialog → My Media / Photo Library (3) / Take Photo (3) / Choose PDF (5)
- ⬜ My Media picker: shows files + cost; no files → **Open My Media**
- ⬜ Attachment chip + ✕ remove
- ⬜ File with no text → asks "What are the main points of this file?"
- ⬜ Text max 1000, warning near 900
- ⬜ Send off when empty / busy / 0 credits
- ⬜ 0 credits → "No credits left… **Upgrade**"
- ⬜ Answer ⋯ (or hold): Copy · Share · Bookmark / Remove bookmark · Save as a card · Ask again
- ⬜ Your message ⋯: Copy · Share
- ⬜ "Keep going" follow-up chips send a question
- ⬜ Wi-Fi off → "Couldn't get an answer" → **Try again**
- ⬜ **+** → "Start a new chat?" (only shows when chat has messages)
- ⬜ ⋯ → **Share this conversation** (off when empty)
- ⬜ ⋯ → **Past conversations**

**Past conversations**
- ⬜ **All / Bookmarked** switch
- ⬜ 🔍 **Search** conversations
- ⬜ Topic chips filter
- ⬜ Today / Yesterday / Earlier groups; scroll → "Loading more…"
- ⬜ Tap → opens; shows "N questions · N credits"
- ⬜ **Continue this conversation**
- ⬜ ⋯: **Rename** (max 200) · **Edit topics** (up to 5, custom max 50) · **Delete** ("cards you saved stay")
- ⬜ Trash → **Clear all** history
- ⬜ Bookmarked tab: "Bookmarked on <date>"
- ⬜ 📄 Pull to refresh · empty · no internet

---

## 12. Profile & Settings

**Profile page**
- ⬜ Bell (count) → Notifications
- ⬜ Photo, name, streak ring; **Edit profile**
- ⬜ Tiles: Quizzes → Quiz hub · Sets → Library · Cards → Library · Notes → Notes
- ⬜ Free plan card → **See plans**
- ⬜ Storage "used of limit" → Media (over limit → Plans)
- ⬜ Rows: Achievements · My notes · My media · Friends · Invite friends · Leaderboard · My credits · Upgrade/Manage plan · Change password · Settings

**Edit profile**
- 👤 Change photo: library / camera → spinner → new photo everywhere
- ⬜ Name (2+), About (200), Church (100) → **Save changes** → "Profile updated"
- ⬜ Email can't be changed

**Change password**
- ⬜ Current + new (rules) + confirm → saved; new password works at login
- 👤 Google/Apple-only account → "Add a password" (no current field)

**Settings**
- ⬜ Theme: Light / Dark / Phone (Phone follows phone setting)
- ⬜ Language: English · Español · Português · Filipino · 한국어 · Français
- ⬜ Smart scheduling switch
- ⬜ AI helper switch off → next Ask / AI quiz shows consent again
- ⬜ Share usage data switch
- ⬜ Notification choices · Blocked people · About · Privacy Policy · Terms
- ⬜ **Sign out** → Stay / Sign out
- 👤 **Delete account** → list of what is deleted → Keep / **Delete forever** (⚠ spare account only)
- ⬜ Version line at bottom

**Notification choices**
- ⬜ 4 switches: Friend requests · Friend accepted · Achievements · News
- 👤 Turning one on asks phone permission; phone notifications off → "Notifications are off" → tap opens phone Settings

**Notifications list**
- ⬜ Today / Yesterday / Earlier, unread dot
- ⬜ Tap → marks read; friend → Friends, achievement → Achievements
- ⬜ Swipe left → **Delete**
- ⬜ **Mark all read**
- ⬜ Back (opened from Home) → Home
- ⬜ 📄 Pull to refresh · empty ("All quiet") · no internet

**Credits**
- ⬜ "You have N credits"
- ⬜ **Get more credits** → Plans
- ⬜ Chart Week / Month / Year; tap a bar → earned vs used
- ⬜ Ways to earn rows → Achievements / Invite / Plans
- ⬜ What things cost: question 1, cards/quiz 2, photo 3, PDF 5
- ⬜ History: Used / Reward / Plan / Bonus; scroll loads more
- ⬜ 📄 Pull to refresh · empty · no internet

**Plans (Paywall)**
- 👤 ✕ close, **Restore purchases**
- ⬜ Monthly / Yearly, "save N%"
- ⬜ Starter (100 credits, 2 GB) / Pro (500 credits, 10 GB); BEST VALUE / CURRENT PLAN
- ⬜ Button: Subscribe / Switch to X / Your plan (off)
- 👤 **Manage subscription** → store
- ⬜ Terms / Privacy links
- 👤 (Real buying only in a store test build)

**Achievements**
- ⬜ "N of M reached", groups, progress bars, "+N credits"
- 👤 Tap unlocked → celebration card → **Share** / **Continue**
- ⬜ Locked ones can't be tapped

**Leaderboard**
- ⬜ Friends by streak, "You're number N"
- ⬜ **Find friends** → search
- ⬜ 📄 Pull to refresh · empty · no internet

**About / Privacy**
- 👤 About: version, **Email us**, **Report a concern** (mail app), Privacy, Terms
- 👤 Privacy Policy: sections open/close, email link

---

## 13. Friends

**Find friends**
- ⬜ 🔍 **Search people** — **name**, needs 2+ letters, box opens focused
- ⬜ **Add** → "Request sent to X"
- ⬜ Person who asked you → **Accept**
- ⬜ "Requested" / "Friends" labels
- ⬜ Blocked people never show
- ⬜ No match → invite button

**Friends list**
- ⬜ Requests icon (count) + leaderboard icon
- ⬜ Banner "A and B want to study with you" → Requests
- ⬜ Rows show streak; tap → profile
- ⬜ ⋮: View profile · Remove friend (confirm) · Block (confirm)
- ⬜ Empty → **Search for friends** + invite
- ⬜ 📄 Pull to refresh · no internet

**Friend requests**
- ⬜ **For you · N**: **Accept** ("You're now friends") / **Decline**
- ⬜ **You sent**: **Cancel request**
- ⬜ Tap person → profile
- ⬜ 📄 Pull to refresh · empty · no internet

**Someone's profile**
- ⬜ Mutual friends, member since
- ⬜ Button by status: Add friend · Requested·Cancel · Accept/Decline · Friends (→ Remove / Block)
- ⬜ ⋯ → **Report**: 5 reasons + note (500) → **Send report** → "Report sent" → Done / Block
- 👤 Report email arrives
- ⬜ ⋯ → **Block**
- ⬜ Their sets → open read-only
- ⬜ 📄 Pull to refresh · no internet

**Blocked people**
- ⬜ **Unblock** → "Unblocked X" → they show in search again
- ⬜ Empty state

**Invite friends**
- ⬜ "+N for you and +N for your friend"
- ⬜ Code → **Copy** → "Copied" (2 sec)
- 👤 **Send on WhatsApp** / **More ways to share**
- ⬜ "N friends joined", cap "up to N friends"
- ⬜ Enter friend's code (max 16) → **Apply** → +credits → then shows "You used a friend's code"
- ⬜ Wrong code → error

## 14. Notes

**My notes**
- ⬜ 🔍 **Search** — note **title AND text**
- ⬜ Sort: Recent → A to Z → Oldest
- ⬜ Topic chips: All · Theology · Old Testament · New Testament · Prayer · History · Devotional · Prophecy
- ⬜ Swipe left → Delete → "Keep it" / Delete
- ⬜ **Write a note**
- ⬜ 📄 Pull to refresh · empty · no internet

**Note editor**
- ⬜ Title (max 500) + text
- ⬜ Saves by itself → "Saving…" → "Saved"
- ⬜ Only title or only text → "Add a title and a few words to save"
- ⬜ Wi-Fi off → "Couldn't save · Tap to retry"
- ⬜ Back / swipe back also saves
- ⬜ Topics → tick tags → Done → list filter finds it
- 👤 **Share** note
- ⬜ **Delete** note (confirm); unsaved new note → just closes
- ⬜ **Done** saves + closes

## 15. Media

- ⬜ "X of Y used" + **Get more room** → Plans
- ⬜ Free plan banner "kept for 30 days" + ✕ hides it; each file "N days left"
- ⬜ **Photos · N / PDFs · N** switch
- ⬜ 🔍 **Search** — file **name**
- ⬜ Sort: newest / oldest / A to Z
- 👤 **+** Add: Take a photo · Photo library · Choose a PDF → upload %
- 👤 Camera / photos permission denied → message
- ⬜ Tap photo → viewer: pinch zoom, swipe photos ("n of total"), tap hides controls, Share, Close
- ⬜ Tap PDF → reader: "Page n of total", Share; broken PDF → "Open in browser"
- 👤 Hold file → **Rename** (name selected, max 255) · **Share** · **Delete**
- ⬜ **Select** → tick many → **Delete N files**; **Cancel**
- ⬜ 📄 Pull to refresh · empty · no internet

---

## 16. Whole app

- ⬜ Every screen in **dark mode**
- ⬜ Wi-Fi off → offline banner
- ⬜ Tab bar hidden on: new/edit set, new/edit card, new plan, Plans, note editor, PDF
- ⬜ Switching tabs → Library / Quiz / Ask open at start page; Profile goes back to Profile
- 👤 Push notification tap → right screen (real phone)
- ⬜ Achievement unlocked → celebration card pops on any screen
- ⬜ Switch language → check Home, Library, Quiz, Profile

---

## Already known (found while making this list — not bugs you need to find)

1. **Card layout** setting (Default / Minimal / Detailed) on a set is saved but does nothing.
2. "Claim your daily credit" text in Ask points to a button that doesn't exist (credits are claimed automatically).
3. Bookmarks can't be removed from Past conversations (only from the chat).
4. Study plans can't be edited or reordered after creating.
5. Someone else's set has no "Start a quiz" button (you must Save a copy first).
6. Renaming the "Daily verses" set makes Memorize create a new one.
7. Edit set has no "you have unsaved changes" warning on Cancel.
8. Home has no pull-to-refresh.
9. Media says "Up to 20 MB" but the app doesn't check size before upload (server does).
