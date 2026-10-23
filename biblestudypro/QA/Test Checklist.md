# Test Checklist — every feature, module by module

Made 2026-10-23 from the real app code. Tick each box when it works. If something is wrong,
write a short note next to it (e.g. `❌ button does nothing`).

Test in **light AND dark mode**. Test account (emulator, local DB): `qa@verdance.dev` / `Verdance123`.

---

## 1. First open & Sign-in

**Onboarding (first time only)**
- [ ] 3 slides show, "1 of 3" counter moves with **Next**
- [ ] **Skip** goes to Sign in
- [ ] Last slide: **Create my account** → Register
- [ ] Last slide: **Sign in** → Login
- [ ] Close and open app again → onboarding does not show again

**Login**
- [ ] Sign in with email + password
- [ ] Show / hide password eye
- [ ] Wrong password → error message
- [ ] Not-verified email → new code sent + "Enter the code" link
- [ ] **Continue with Google**
- [ ] Cancel Google → no error shown
- [ ] **Continue with Apple** (iPhone only)
- [ ] **Forgot password?** link
- [ ] **Create an account** link
- [ ] Terms / Privacy links open

**Register**
- [ ] Name, email, password fields
- [ ] Password rules turn green (8+ letters, 1 capital, 1 number)
- [ ] Without ticking "I agree" → error; Google/Apple also blocked
- [ ] Email already used → "Sign in instead" link
- [ ] Create account → goes to Verify email

**Verify email**
- [ ] Type 6-digit code → logs in by itself
- [ ] Wrong code → "That code didn't work"
- [ ] **Resend code** + countdown
- [ ] "Wrong email? Change it"

**Forgot / Reset password**
- [ ] Enter email → **Send reset code**
- [ ] Enter code + new password + confirm → "Passwords match"
- [ ] Wrong / old code → error
- [ ] **Save new password** → back to Login, new password works

---

## 2. Home

- [ ] Greeting changes by time (morning / afternoon / evening) + your name
- [ ] Avatar → Profile
- [ ] Ask icon → AI consent / chat
- [ ] Bell → Notifications, red count shows (9+ max)
- [ ] **Today card — cards due:** "N cards are ready" → **Start review** starts a quiz
- [ ] **Today card — nothing due:** "Pick up where you left off" → **Open set**
- [ ] **Today card — new user, no sets:** **Create a set**
- [ ] Streak shows on the card
- [ ] **Today's verse:** new verse each day, NEW tag
- [ ] **Memorize this** → card added to "Daily verses" set, button turns off for today
- [ ] Verse **Share** → phone share sheet
- [ ] Sunday only: Sunday card → **Share on WhatsApp**, ✕ hides it
- [ ] 8 shortcuts all open the right screen: New set, Study plans, Achievements, Leaderboard, Notes, Media, Explore, Friends
- [ ] Recent sets + **See all**
- [ ] Friends' sets row + **See all**
- [ ] "What friends are doing" list
- [ ] "From the community" row + **See all**
- [ ] Daily free credit: "+1 credit claimed" message once a day

---

## 3. Library — Sets

- [ ] **My sets / Folders** switch
- [ ] Search sets by name
- [ ] Sort: Recent → A to Z → Most cards
- [ ] Pull down to refresh
- [ ] **Create a set:** title, description, folder, colour, who can see it (Private / Friends / Public)
- [ ] Title empty → cannot save
- [ ] **Edit set** → change things → **Save changes**
- [ ] **Delete set** (from ⋮ menu) → confirm → gone
- [ ] **Delete set** (from Edit screen) → confirm → gone
- [ ] Set ⋮ menu: Start a quiz, Add a card, Move to folder, Edit, Delete — all work
- [ ] **Move to folder** → toast "Moved to folder"; choose "No folder" → "Removed from folder"
- [ ] Empty library → "Create a set" button
- [ ] Search with no match → "Clear search"
- [ ] "Explore public sets" link at the bottom

## 4. Library — Folders

- [ ] **Create folder:** name (200 max, counter), colour
- [ ] Open folder → shows its sets + counts
- [ ] **Edit folder** (name / colour)
- [ ] **Delete folder** → sets stay in library
- [ ] **New set in this folder** → folder already picked
- [ ] Search inside folder
- [ ] Empty folder state

## 5. Library — Inside a set (Set detail)

- [ ] Shows card count + Private/Friends/Public
- [ ] "X of Y learned" bar + ⓘ explanation
- [ ] **Start a quiz** → mode picker
- [ ] **+** Add card
- [ ] Search cards (question or answer)
- [ ] **Share** → WhatsApp / more ways
- [ ] ⋮ Set options: Add card, Edit set, Hide all answers / Show all answers, Reorder cards
- [ ] **Reorder:** hold and drag → **Save** → "Order saved"; **Cancel** undoes
- [ ] List / Grid view switch
- [ ] Eye icon hides / shows one answer
- [ ] Note icon → write a private note (500 max) → **Save note**
- [ ] Empty set → "Add cards"

## 6. Library — Cards

- [ ] **Create Q&A card:** question (2–300), answer (2–1000), optional hint
- [ ] **Create Story card:** reference, passage (2–2000), optional note
- [ ] Tap preview → card flips
- [ ] **Add card** (closes) / **Add & next** (stays, form clears)
- [ ] Too short text → cannot save
- [ ] **Edit card** → **Save**
- [ ] Card type is locked when editing
- [ ] **Duplicate card**
- [ ] **Move to another set**
- [ ] **Ask AI about this card** → chat opens and asks it
- [ ] **Delete card** → confirm → gone

## 7. Library — Explore & Friends' sets

- [ ] Explore: list of public sets + count
- [ ] Explore search
- [ ] Friends' sets: list + search
- [ ] Open someone's set → read only, shows "by Name"
- [ ] **Save a copy** → "Saved to your library"
- [ ] **+ Add** on a row → "Added ✓"
- [ ] Your own sets have no Add button
- [ ] Scroll down loads more
- [ ] No friends → "Find friends"

## 8. Library — Study plans

- [ ] Open from Home shortcut
- [ ] **Create plan:** name, description, tap sets in order (numbers show), tap again to remove
- [ ] Button says "Create plan (N steps)", off until name + 1 set
- [ ] No sets → "You need a set first"
- [ ] Plan list: progress ring %, search
- [ ] Plan detail: progress bar, "Up next" → **Open this set**
- [ ] Tap circle → step done / not done
- [ ] All done → "Plan complete" card
- [ ] Deleted set → step shows "Set removed"
- [ ] **Share** plan
- [ ] **Delete plan** → sets stay

---

## 9. Quiz — Hub, details, setup

- [ ] **Quiz mode picker** (from a set): Mix, Type the answer, Multiple choice, Fill in the blanks, Type it out, Order the pieces, Read & memorize, Match the verse
- [ ] Fewer than 4 cards → Multiple choice / Match the verse greyed out
- [ ] **Quiz hub:** "N cards are ready" → **Start**
- [ ] Recent quizzes list (score, name, mode, date)
- [ ] Search quizzes
- [ ] Row ⋮: Details, See every answer, Quiz me again, Delete from history
- [ ] **Quiz details:** score, right count, time, dates, delete
- [ ] **Quiz me again:** free for card quizzes; AI quiz asks "Use 2 credits"
- [ ] Not enough credits → "Out of credits" → Plans screen
- [ ] **New quiz from a topic** (2–100 letters)
- [ ] **New quiz from my sets** → choose sets (search, sort, multi-select); under 4 cards → warning
- [ ] **New quiz from a document:** PDF or photo (My Media / Photos / Camera / PDF), cost shows 3 or 5, **Remove**
- [ ] Quiz name (optional)
- [ ] First AI use → consent → **I agree** / **Not now**
- [ ] "Making your quiz…" screen, then quiz opens
- [ ] Credits go down by the right amount

## 10. Quiz — Playing & results

- [ ] **Multiple choice / Match the verse:** tap answer → right is green, wrong shakes
- [ ] **Type the answer / Type it out:** type → **Check** (capitals & punctuation don't matter)
- [ ] **Fill in the blanks:** tap words into gaps, tap gap to empty, **Check**
- [ ] **Order the pieces:** tap in order, **Undo last**, **Check**
- [ ] **Read & memorize:** reveal line by line, then Continue (no score)
- [ ] **Mix:** different types in one quiz
- [ ] "Correct" / "Not quite" + right answer → **Continue**
- [ ] Progress bar + "N of M"
- [ ] ✕ or phone back → "Leave this quiz?" → **Leave** / **Keep going**
- [ ] **Results:** score ring, streak, "New best", time
- [ ] Results stay until you tap **Done**
- [ ] **Practice the N you missed** (not saved)
- [ ] **See every answer:** All / Right / Missed filter
- [ ] Share score
- [ ] Quiz appears in Recent quizzes after
- [ ] After a review quiz, Home "cards ready" number goes down

---

## 11. Ask (AI)

- [ ] First time → consent screen → **I agree** → chat; **Not now** → Home
- [ ] 4 starter questions work
- [ ] Ask a question → answer comes, credits −1
- [ ] Ask for flashcards → costs 2, "N cards ready" → **Save to a set**
- [ ] Save to existing set / new set name → **Save N cards**
- [ ] Attach photo (−3) / PDF (−5) → answer about it
- [ ] Attach from My Media
- [ ] Remove attachment ✕
- [ ] Text limit 1000 (warning near 900)
- [ ] 0 credits → send is off + "Upgrade" message
- [ ] Answer ⋯ menu: Copy, Share, Bookmark, Save as a card, Ask again
- [ ] Your message ⋯: Copy, Share
- [ ] Follow-up chips send a new question
- [ ] Turn off internet → "Couldn't get an answer" → **Try again**
- [ ] **+ New conversation** → confirm
- [ ] ⋯ → **Share this conversation**
- [ ] **Past conversations:** All / Bookmarked, search, topic filter
- [ ] Open old chat → **Continue this conversation**
- [ ] **Rename** chat
- [ ] **Edit topics** (up to 5)
- [ ] **Delete** one chat
- [ ] **Clear all** history

---

## 12. Profile & Settings

**Profile page**
- [ ] Name, photo, streak ring
- [ ] Tiles open: Quizzes, Sets, Cards, Notes
- [ ] Storage line → Media (or Plans if over limit)
- [ ] All rows open the right screen

**Edit profile**
- [ ] Change photo (library / camera)
- [ ] Change name, about (200), church (100) → **Save changes**
- [ ] Email can't be changed

**Change password**
- [ ] Current + new + confirm → saved, new password works at login
- [ ] Google/Apple-only account → "Add a password"

**Settings**
- [ ] Theme: Light / Dark / Phone
- [ ] Language: English, Español, Português, Filipino, 한국어, Français
- [ ] Smart scheduling switch
- [ ] AI helper switch off → next Ask shows consent again
- [ ] Share usage data switch
- [ ] Blocked people opens
- [ ] About, Privacy Policy, Terms open
- [ ] **Sign out** → Stay / Sign out
- [ ] **Delete account** → Keep / Delete forever (⚠ test with a spare account only)

**Notifications**
- [ ] Notification choices: 4 switches; turning on asks phone permission
- [ ] Notification list: Today / Yesterday / Earlier, unread dot
- [ ] Tap → marks read + opens right screen
- [ ] Swipe left → Delete
- [ ] **Mark all read**

**Credits**
- [ ] Balance shows
- [ ] Chart: Week / Month / Year, tap a bar
- [ ] Ways to earn rows open the right screen
- [ ] History list (Used / Reward / Plan / Bonus)

**Plans (Paywall)**
- [ ] Monthly / Yearly switch, "save N%"
- [ ] Starter / Pro cards, current plan badge
- [ ] **Restore purchases**
- [ ] **Manage subscription** opens store
- [ ] (Real purchase only works in a store build)

**Achievements & Leaderboard**
- [ ] "N of M reached", progress bars
- [ ] Tap unlocked achievement → celebration card + Share
- [ ] Leaderboard: friends by streak, "You're number N"

---

## 13. Friends

- [ ] **Find friends:** search 2+ letters → **Add** → "Request sent"
- [ ] **Friend requests:** For you → **Accept** / **Decline**
- [ ] You sent → **Cancel request**
- [ ] Friends list → tap → their profile
- [ ] Friend ⋮: View profile, Remove friend, Block
- [ ] **User profile:** Add / Cancel / Accept / Decline buttons by status
- [ ] Their sets list → open read only
- [ ] **Report** a user: pick reason + note → "Report sent" (email arrives)
- [ ] **Block** → they disappear from search
- [ ] **Blocked people** → **Unblock**
- [ ] **Invite friends:** Copy code ("Copied"), WhatsApp, more ways
- [ ] Enter a friend's code → **Apply** → +credits

## 14. Notes

- [ ] **Write a note** → title + text → saves by itself ("Saved")
- [ ] No title → "Add a title and a few words to save"
- [ ] Topics → pick tags
- [ ] **Share** note
- [ ] **Delete** note (in editor and by swipe)
- [ ] Notes list: search, sort (Recent / A to Z / Oldest), topic filter

## 15. Media

- [ ] Storage "X of Y used"
- [ ] Free plan: "kept for 30 days" banner + days left on each file
- [ ] Photos / PDFs switch
- [ ] Add: take photo, choose photo, choose PDF → upload %
- [ ] Open photo → zoom, swipe between photos, share
- [ ] Open PDF → pages, "Page n of total", share
- [ ] Hold a file → Rename / Share / Delete
- [ ] **Select** many → **Delete N files**
- [ ] Search + sort

---

## 16. Whole app

- [ ] Every screen in **dark mode** looks right
- [ ] Turn off internet → offline banner shows
- [ ] Tab bar hides on full-screen forms (new set, new card, note editor, PDF, plans)
- [ ] Switching tabs works and each tab opens at its start page
- [ ] Push notification tap opens the right screen (needs real phone)
- [ ] Other languages: switch language, check a few screens

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
