# TheMeet  
*A Modern Web App for Hosting Seamless Video Meetings*

---

## 🚀 Tech Stack

**Frontend:**  
- **Vue.js**  
- Tailwind CSS  
- Vanilla JavaScript *(for additional interactivity if needed)*

**Backend:**  
- **Firebase** (Authentication, Firestore)

**Real-Time Communication:**  
- WebRTC  
- Socket.io *(if needed for extra signaling, though Firebase can handle real-time updates)*

---

## ⚙️ Key Features

1. **Ultra-Fast Real-Time Video Meetings**  
   - Experience video meetings that are “faster than light” with low latency real-time connections via WebRTC.

2. **Live Chat & Collaboration**  
   - Integrated chat powered by Firebase for instant messaging during sessions.

3. **Screen Sharing**  
   - Seamlessly share your screen for presentations, coding sessions, or just to show off something cool.

4. **Custom Themes**  
   - Toggle between light/dark modes and customize further to match your style.

5. **Instant, Install-Free Access**  
   - Everything runs directly in the browser. Join a meeting with a click—no downloads required.

---

## 📁 Project Structure

```bash
TheMeet/
├── public/               # Static assets (favicon, images, etc.)
│   ├── css/              # Tailwind CSS builds and custom styles
│   ├── js/               # Any vanilla JS utilities
│   └── assets/           # Logos, icons, etc.
├── src/                  
│   ├── components/       # Vue.js single-file components (SFCs)
│   ├── views/            # Vue.js views for routing
│   ├── router/           # Vue Router setup
│   ├── store/            # Vuex (or Pinia) for state management
│   ├── firebase/         # Firebase configuration and services
│   └── utils/            # Utility functions and shared logic
├── test/                 # Unit and integration tests
├── .env                  # Environment variables (Firebase configs, etc.)
├── Dockerfile            # Container configuration (if applicable)
├── package.json          # Project metadata and dependencies
└── README.md             # This file
```
