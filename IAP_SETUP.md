# App Store Connect — IAP Setup Checklist (Phase E)

Everything needed to make the Paywall's Subscribe button actually charge. This is
**config, not code** — the app + backend are already built. Do it in order.

Product IDs and prices are fixed by code + locked decision #4. They must match exactly:

| Product ID | Tier | Period | Price |
|---|---|---|---|
| `com.biblestudypro.starter.monthly` | Starter | Monthly | $4.99 |
| `com.biblestudypro.starter.annual`  | Starter | Annual  | $39.99 |
| `com.biblestudypro.pro.monthly`     | Pro     | Monthly | $9.99 |
| `com.biblestudypro.pro.annual`      | Pro     | Annual  | $79.99 |

Source of truth: `backend/src/config/plans.ts` and `frontend/src/types/subscription.types.ts`.
If you change an ID here, change it in **both** files.

---

## 1. Apple Developer / agreements (one-time)

- [ ] Enrolled in the Apple Developer Program (paid).
- [ ] App Store Connect → **Business** → **Paid Apps Agreement** is *Active*
      (Subscribe returns nothing until this is signed — most common blocker).
- [ ] Tax & banking info completed under the same agreement.

## 2. Xcode — capability + build

- [ ] `react-native-nitro-modules` must be a **direct** dependency (already in
      `package.json`). react-native-iap v16 is built on Nitro; without the direct dep,
      autolinking skips `NitroModules.podspec` and pod install fails with
      *"Unable to find a specification for `NitroModules` depended upon by `NitroIap`"*.
- [ ] `cd frontend/ios && pod install` (re-run after any `npm install`).
- [ ] Open `frontend/ios/*.xcworkspace` (workspace, not project).
- [ ] Target → **Signing & Capabilities** → **+ Capability** → **In-App Purchase**.
- [ ] Bundle identifier matches the app record in App Store Connect.
- [ ] Build to a **real iPhone** (StoreKit purchases do **not** work in the Simulator).

## 3. App Store Connect — create the app record (if not done)

- [ ] My Apps → **+** → New App → pick the bundle ID → create.

## 4. Create a Subscription Group + the 4 products

App Store Connect → your app → **Monetization → Subscriptions**.

- [ ] Create **one Subscription Group** (e.g. `BibleStudyPro Premium`). All four
      products go in it so users can upgrade/downgrade between them.
- [ ] Add the 4 subscriptions using the **exact** Product IDs from the table above.
- [ ] For each: set the price (matching the table), a display name, and a description.
- [ ] Set the rank order in the group (Pro above Starter) — affects upgrade/downgrade proration.
- [ ] Each product needs a **localization** (display name + description) or it stays in
      "Missing Metadata" and won't be fetchable.
- [ ] Add a **subscription review screenshot** + review notes (required before the products
      leave "Missing Metadata"; for sandbox testing "Ready to Submit" is enough — you do
      **not** need the app approved).

> Products are usually fetchable in sandbox within minutes to a few hours of reaching
> "Ready to Submit". If `fetchProducts` returns empty, they're not ready yet.

## 5. App-specific Shared Secret (for backend receipt verification)

The backend verifies receipts with Apple's `verifyReceipt` using this secret.

- [ ] App Store Connect → your app → **App Information** →
      **App-Specific Shared Secret** → *Manage* → generate → copy.
- [ ] Put it in `backend/.env`:
      ```
      APPLE_IAP_SHARED_SECRET=<the-secret>
      ```
- [ ] Restart the backend (`cd backend && npm run dev`).

## 6. Sandbox tester

- [ ] App Store Connect → **Users and Access → Sandbox → Testers** → **+**.
- [ ] Use an email you do **not** already use for a real Apple ID (a `+alias` works).
- [ ] On the iPhone: **Settings → App Store → Sandbox Account** (bottom) → sign in with
      the sandbox tester. (Do **not** sign out of your real Apple ID from Settings top.)

## 7. Test the purchase flow

- [ ] Backend running with `APPLE_IAP_SHARED_SECRET` set.
- [ ] App running on the real device (release or debug build with the IAP capability).
- [ ] Profile → **Upgrade to Premium** → the 4 products load with prices.
- [ ] Tap Subscribe → the sandbox purchase sheet appears → confirm with the sandbox tester.
- [ ] Expected result:
  - App calls `POST /api/v1/subscriptions/verify` with the receipt.
  - Backend sets `user.plan`, bumps `storageLimit`, grants credits
    (Starter 100 / Pro 500 monthly; **annual grants 12×** upfront).
  - Paywall button flips to **Current Plan**; Profile badge shows the new plan;
    credit balance jumps.
- [ ] Kill + reopen the app → **verify-on-open** re-syncs (plan/expiry stay correct).
- [ ] **Restore Purchases** on a fresh install returns the entitlement.

### Sandbox renewal speed
Sandbox subscriptions renew fast so you can watch renewals:
monthly ≈ every 5 min, annual ≈ every 1 hr (auto-renews ~6 times then stops).
Use this to confirm renewal credit grants are **idempotent** (credits granted once
per new transaction, not on every verify-on-open).

---

## Google Play (deferred)

Backend `verifyGoogle` is a guarded stub and the paywall passes the Android
`purchaseToken`, but Play verification isn't wired yet. When you tackle Android:

- [ ] Play Console → create the same 4 subscription products (base plans).
- [ ] Create a Play service account with **Android Publisher** access; download its JSON.
- [ ] Set `GOOGLE_PLAY_SA_JSON` in `backend/.env` (stringified JSON).
- [ ] Implement `verifyGoogle` in `backend/src/modules/subscriptions/subscriptions.service.ts`
      (Play Developer API `purchases.subscriptionsv2.get`).
- [ ] Add license testers in Play Console for sandbox purchases.

---

## Common blockers (check these first if Subscribe does nothing)

- Paid Apps Agreement not Active → products never load.
- Products still "Missing Metadata" → `fetchProducts` returns empty.
- Testing on Simulator → purchases silently fail.
- `APPLE_IAP_SHARED_SECRET` missing/wrong → verify returns `RECEIPT_INVALID` /
  `IAP_NOT_CONFIGURED` (503).
- Signed into a real Apple ID instead of the Sandbox Account → real purchase prompt.
- Product ID typo → the product just won't appear (unknown SKUs are silently omitted).
