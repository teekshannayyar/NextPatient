# NextPatient

NextPatient is a smart front-desk tool for clinics and hospitals where patients self-report their symptoms and severity. The system computes a **triage priority score** to dynamically order the waiting queue, ensuring that critical cases are attended to first based on urgency rather than just arrival time.

> ⚠️ **Non-diagnostic disclaimer**: NextPatient does not diagnose medical conditions. It is an educational tool designed to determine waiting-room order based on self-reported symptoms, severity, duration, and specific risk factors. It is not a substitute for professional medical judgment.

---

## 🎯 Problem Statement

Traditional clinic waiting rooms often operate on a "first-come, first-served" basis. This approach is fundamentally flawed in medical settings where patient conditions vary drastically in urgency. A patient with severe chest pain might arrive after someone needing a routine checkup, but waiting in order of arrival could be fatal. 

**NextPatient** solves this by:
1. Collecting initial symptom and demographic data directly from the patient or intake staff.
2. Automatically calculating a triage score based on medical heuristics (e.g., pain levels, age risk factors, specific critical symptoms, and wait time).
3. Maintaining a live, prioritized queue for the staff and doctors, ensuring the most urgent patients are seen first.

---

## ✨ Features (Current Phase)

- **Smart Triage Scoring**: Calculates priority based on pain levels, breathing difficulty, critical symptom flags (fever, fainting, chest pain, bleeding, etc.), age brackets, gender-specific risks, and symptom duration.
- **Dynamic Queue Management**: Continuously updates patient priority based on their triage score and elapsed waiting time (anti-starvation mechanism).
- **Multiple Dashboards**:
  - **Intake/Patient Flow**: Symptom checklist and demographic form.
  - **Doctor View**: Interface to view the current queue, serve patients, and access patient history.
  - **Admin View**: Dashboard to manage user feedback, resolve and delete complaints via custom modals.
- **Authentication**: User login and signup with persistent "Remember Me" functionality.
- **RESTful API backend**: Powered by `json-server` to mock a realistic database with queues, users, and complaint data.

---

## 🚀 How to Start

NextPatient is split into a frontend UI (`phase1`) and a local mock backend (`server`). You need to run both to get the full experience.

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### 1. Start the Backend Server
The backend uses `json-server` to serve the mock database (`db.json`).

```bash
cd server
npm install
npx json-server --watch db.json --port 5000
```
*The server will start running at `http://localhost:5000`.*

### 2. Start the Frontend
You can serve the `phase1` folder using any static file server, such as Live Server (VS Code extension) or `http-server` via npm.

Using `http-server`:
```bash
npx http-server phase1
```
Or simply open the `phase1/index.html` file in your browser to begin, though a local server is recommended to avoid CORS issues with the API.

---

## 🧠 Design Decisions & Triage Logic

### Triage Scoring Formula
The priority score is computed dynamically using:
- **Pain / Breathing**: 1–5 slider values.
- **Symptom Flags**: Fixed bonuses based on severity (e.g., chest pain +40, bleeding +35, fainting +30).
- **Age Tier Bonus**: High-risk age groups (<5 years or >60 years) receive priority bumps.
- **Gender Specifics**: Certain symptoms (like bleeding) combined with female gender receive higher priority for potential obstetric/gynecological emergencies.
- **Wait Time (Anti-Starvation)**: For every 10 seconds of waiting (in this prototype), the patient's effective score increases, ensuring mild cases don't wait indefinitely.

### Queue Sorting & Insertion
The queue uses a custom insertion logic rather than a full re-sort on every addition. When patients have identical triage scores, the system falls back to a First-Come-First-Served (FCFS) tie-breaker using their arrival time.

### Patient vs. Staff Visibility
Raw triage scores are intended for staff views (Doctor/Admin). Patient-facing views ideally only see their relative position (e.g., "You are #4") to prevent anxiety and gamification of the symptom form.

---

## 📂 Folder Structure

```
NextPatient/
├── README.md
├── .gitignore
├── server/
│   ├── db.json             # Mock database
│   └── package.json        # Server dependencies
└── phase1/
    ├── index.html          # Landing page
    ├── intake.html         # Patient intake form
    ├── doctor.html         # Doctor queue dashboard
    ├── admin.html          # Admin dashboard (complaints)
    ├── login.html / signup.html
    ├── css/                # Styling and layout
    └── js/
        ├── api.js          # Central API wrappers & scoring logic
        ├── auth.js         # Authentication state management
        ├── admin.js        # Admin modal and complaint logic
        ├── doctor.js       # Queue rendering and serve logic
        └── ...
```