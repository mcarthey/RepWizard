# RepWizard — Manual Smoke Test Checklist

Run this checklist on a real device or emulator after any changes to UI, navigation, ViewModels, or DI registrations. Every item should pass before merging.

## Prerequisites

- [ ] Android emulator running (API 33+)
- [ ] API server running: `dotnet run --project RepWizard.Api --launch-profile https`
- [ ] App freshly deployed: `dotnet build RepWizard.App/RepWizard.App.csproj -f net9.0-android -c Debug -t:Run`

---

## 1. App Launch

- [ ] App opens without crash
- [ ] Splash screen displays (barbell emblem on dark background)
- [ ] Today tab loads as default
- [ ] Logo and "REPWIZARD" text visible in header
- [ ] Date and greeting text visible
- [ ] Tab bar shows Today, Progress, Coach with icons

## 2. Today Tab

- [ ] Weekly progress circle displays (0% with no data)
- [ ] "START WORKOUT" button is visible and tappable
- [ ] Tap "START WORKOUT" — navigates to Active Session page (no crash)
- [ ] Active Session page loads with exercise picker
- [ ] Back navigation returns to Today tab
- [ ] Metric chips show (Workouts, Minutes, Volume, Streak)

## 3. Active Session (requires starting a workout)

- [ ] Exercise picker dropdown works
- [ ] Can enter Weight, Reps values
- [ ] "LOG SET" button works — set appears in logged sets list
- [ ] Rest timer appears after logging a set
- [ ] "COMPLETE SESSION" button works — returns to Today tab
- [ ] After completing: Today tab shows updated workout count

## 4. Progress Tab

- [ ] Tap Progress tab — page loads
- [ ] Session history list shows (empty or with sessions)
- [ ] Tap "Charts" button — navigates to Charts page (no crash)
- [ ] Charts page loads and displays (empty state if no data)
- [ ] Back navigation returns to Progress tab
- [ ] Tap "Body" button — navigates to Measurements page (no crash)
- [ ] Measurements page loads
- [ ] Can open measurement logging form
- [ ] Can save a measurement (weight, body fat, etc.)
- [ ] Back navigation returns to Progress tab
- [ ] If sessions exist: tap a session — navigates to Session Detail (no crash)

## 5. Coach Tab

- [ ] Tap Coach tab — page loads with chat UI
- [ ] Empty state welcome message visible
- [ ] Tap "Programs" button — navigates to Programs page (no crash)
- [ ] Programs page loads (empty state if no programs)
- [ ] Back navigation returns to Coach tab
- [ ] Tap "Library" button — navigates to Exercise Library (no crash)
- [ ] Exercise list loads with exercises
- [ ] Search field works (filters exercises)
- [ ] Category filter chips work
- [ ] Tap an exercise — navigates to Exercise Detail (no crash)
- [ ] Exercise detail shows name, description, muscles, equipment
- [ ] Back navigation returns to Exercise Library

## 6. AI Chat (requires API running)

- [ ] Type a message and tap Send
- [ ] User message appears in chat (readable text on dark bubble)
- [ ] AI response streams in (or shows connection error if API not running)
- [ ] "New" button creates a new conversation
- [ ] Error banner shows if API is unreachable (doesn't crash)

## 7. Settings

- [ ] Navigate to Settings (if accessible)
- [ ] Profile fields load
- [ ] Can edit and save profile
- [ ] Sync status displays

## 8. Cross-Cutting

- [ ] Text is readable on all pages (no dark-on-dark or light-on-light)
- [ ] All navigation back buttons work
- [ ] App doesn't crash on any screen transition
- [ ] Tab switching works without losing state
- [ ] Error states show user-friendly messages (not raw exceptions)

---

## Quick Regression Check (2 minutes)

For minor changes, run this abbreviated set:

1. Launch app — Today tab loads
2. Tap Start Workout — Active Session opens
3. Go back, tap Progress tab
4. Tap Charts — Charts page opens
5. Go back, tap Body — Measurements page opens
6. Go back, tap Coach tab
7. Tap Programs — Programs page opens
8. Go back, tap Library — Exercise Library opens
9. Tap an exercise — Detail page opens

If all 9 navigations succeed without crash, the basic wiring is intact.
