# LFD Project Reorganization TODO

## Current Progress
- [x] Renamed public → frontend, db → backend
- [x] Updated server.js paths/DB import

## Remaining Steps
1. Create backend subfolders: controllers/, middleware/, routes/, db/
2. Move backend/database.js → backend/db/database.js, update server.js import
3. Extract middleware from server.js → backend/middleware/auth.js, admin.js
4. Extract controllers:
   - authController.js (register/login/session)
   - lostController.js (lost items)
   - foundController.js
   - notificationController.js
   - adminController.js
   - profileController.js
5. Create route files: backend/routes/authRoutes.js, lostRoutes.js, etc. + app.use('/api', router)
6. Frontend reorganization:
   - frontend/admin/admin.html
   - frontend/client/ (dashboard.html, index.html?)
   - frontend/css/style.css → split client.css/admin.css if needed
   - frontend/js/ → group auth.js, dashboard.js, admin.js
   - frontend/images/ ← uploads/
7. Add .gitignore
8. Test: node server.js, check all features/DB/uploads/UI

Updated: Backend subfolders created (controllers, middleware, routes, db). database.js moved to backend/db/. server.js import updated.

- [x] Extracted middleware → backend/middleware/authMiddleware.js

- [x] Created authController.js + authRoutes.js

- [x] Created lostController.js + lostRoutes.js

Next: foundController, notifications, etc.





