
# 💕 Couple To-Do List App

A collaborative to-do list for couples with a soft, romantic design, real-time sync, and invite-based pairing — built with React, Tailwind CSS, and Supabase.

---

## 1. Authentication
- Email/password sign-up and login pages
- Clean auth forms with the romantic design theme (soft pinks, lavenders, rounded corners)

## 2. Couple Pairing via Invite Code
- After signing up, a user can **create a couple list** which generates a unique invite code
- The partner signs up separately and **joins using the invite code**
- Once paired, both users share the same to-do list
- A settings area shows the pairing status and partner info

## 3. Shared To-Do List
- Both partners see the same list of tasks in real-time
- Each task includes:
  - **Title** — what needs to be done
  - **Priority** — High, Medium, or Low (color-coded)
  - **Assigned to** — "Him" or "Her" with cute labels/icons
  - **Completed status** — checkbox with a satisfying animation
- Add, edit, and delete tasks
- Filter/sort by priority, assignee, or completion status

## 4. Real-Time Updates
- Supabase real-time subscriptions so both partners see changes instantly
- When one partner adds, completes, or edits a task, it appears live for the other

## 5. Romantic & Soft UI Design
- Pastel color palette (pinks, lavenders, soft whites)
- Rounded cards, gentle shadows, warm typography
- Heart-themed accents and couple-friendly iconography
- Mobile-responsive layout so it works great on phones
- Empty state illustrations encouraging teamwork

## 6. Database Structure
- **Couples table** — stores the pair relationship and invite code
- **Tasks table** — linked to a couple, with title, priority, assigned_to, and completed fields
- **User roles table** — for role management
- Row-level security ensuring only paired partners can access their shared list
