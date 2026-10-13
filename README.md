S Service — Electrical & Motor Repair
Responsive HTML/CSS/JavaScript web app using Firebase Authentication + Cloud Firestore.
Included
Customer registration and email/password login
Service cards, search, booking form, booking reference and approximate price
Customer booking list with status
Owner dashboard, booking status updates and technician management
Responsive layout for phone and desktop
1. Create Firebase project
Open https://console.firebase.google.com/ and create a project.
Add a Web app from Project Overview.
Copy the Firebase config into firebase-config.js.
Authentication → Sign-in method → enable Email/Password.
Firestore Database → Create database.
Firestore → Rules: paste firestore.rules and publish.
2. Run locally
ES modules require a local web server (do not open index.html directly from file://).
Install VS Code and the Live Server extension, open this folder, right-click index.html, choose Open with Live Server.
Or, if Python is installed, run python -m http.server 5500 in this folder and visit http://localhost:5500.
3. Make your account an owner
Register through the app as a normal customer.
Firebase Console → Firestore Database → users collection.
Open the document whose ID matches your Firebase Authentication UID.
Change role from customer to owner and save.
Sign out and sign in again. Owner Dashboard and Technicians tabs should appear.
Only do this manually for accounts you trust. Never let customers choose their own owner role.
4. Deploy (optional)
Firebase Console → Hosting → Get started, install Firebase CLI (npm install -g firebase-tools), then in the project folder:
firebase login
firebase init hosting
# choose this folder as public directory; configure as a single-page app: No
firebase deploy
If using Firebase Hosting, deploy only the app files, not private service-account credentials (none are needed in this frontend).
Important notes
This starter uses email/password, not phone OTP. Phone OTP requires Firebase Phone Authentication, reCAPTCHA verifier, authorized domains, and testing on the deployed domain.
Firebase web config is not a server secret. Firestore Security Rules protect the data. Do not loosen the rules to allow read, write: if true.
This is a starter app, not a complete production booking platform. Before public launch, add phone verification, validation/rate limiting (usually via trusted backend/Cloud Functions), privacy policy, consent, backups, technician assignment, payment integration if needed, and error monitoring.
The shown repair amounts are sample estimates. Update the services array in app.js to your actual prices.
If you change query patterns, Firestore may show a message asking you to create an index; follow the console link to create it.
