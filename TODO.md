# OfficerDashboard Improvements: Quick Actions, Notifications, Export
Current Working Directory: c:/Users/RESHMA VARGHESE/Desktop/disaster-assessment

## Plan Status
- [ ] Step 1: Create TODO.md ✅ **Done**
- [ ] Step 2: Read ResourceManagementPanel.jsx (if needed for resources)
- [ ] Step 3: Update frontend/src/pages/OfficerDashboard.jsx
  - Quick Actions: Persist broadcasts to localStorage, emit socket, toast.
  - Notifications: localStorage for activityFeed/notifications, unread count, clear old.
  - Export: Add date-range preview count, Excel option (simple CSV enhance).
- [ ] Step 4: Minor backend/api.py - Add socket listener for 'broadcast_alert' emit to all.
- [ ] Step 5: Test frontend/backend integration
- [ ] Step 6: Update TODO.md with completion, attempt_completion

**Notes**: No new DB. Focus workable frontend logic + existing backend sockets/APIs. Export already client-side functional.

