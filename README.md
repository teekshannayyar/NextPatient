# NextPatient

NextPatient is a smart front-desk tool for clinics and hospitals where patients self-report their symptoms and severity. The system computes a **triage priority score** to dynamically order the waiting queue, ensuring that critical cases are attended to first based on urgency rather than just arrival time.

> ⚠️ **Non-diagnostic disclaimer**: NextPatient does not diagnose medical conditions. It is an educational tool designed to determine waiting-room order based on self-reported symptoms, severity, duration, and specific risk factors. It is not a substitute for professional medical judgment.

---

## 1. Problem Statement

Traditional clinic waiting rooms often operate on a "first-come, first-served" basis. This approach is fundamentally flawed in medical settings where patient conditions vary drastically in urgency. A patient with severe chest pain might arrive after someone needing a routine checkup, but waiting in order of arrival could be fatal. 

---

## 2. Project Description

**NextPatient** solves this by:
1. Collecting initial symptom and demographic data directly from the patient or intake staff.
2. Automatically calculating a triage score based on medical heuristics (e.g., pain levels, age risk factors, specific critical symptoms, and wait time).
3. Maintaining a live, prioritized queue for the staff and doctors, ensuring the most urgent patients are seen first.

### Key Features
- **Smart Triage Scoring**: Calculates priority based on pain levels, breathing difficulty, critical symptom flags (fever, fainting, chest pain, bleeding, etc.), age brackets, gender-specific risks, and symptom duration.
- **Dynamic Queue Management**: Continuously updates patient priority based on their triage score and elapsed waiting time (anti-starvation mechanism).
- **Multiple Dashboards**: Intake (patient flow), Doctor View, and Admin View.
- **Authentication**: User login and signup with role-based access.

---

## 3. Setup Instructions

NextPatient is split into a frontend UI (`phase1`) and a local mock backend (`server`). You need to run both to get the full experience.

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your machine.

### Step 1: Start the Backend Server
The backend uses `json-server` to serve the mock database (`db.json`).

```bash
cd server
npm install
npx json-server --watch db.json --port 5000
```
*The server will start running at `http://localhost:5000`.*

### Step 2: Start the Frontend
You can serve the `phase1` folder using any static file server, such as `http-server`.

```bash
npx http-server phase1
```
Alternatively, you can open the `phase1/index.html` file in your browser, but using a local server is recommended to avoid CORS issues.

---

## 4. Architecture Explanation

The NextPatient application uses a client-server architecture with a mock backend.

### Frontend (`phase1`)
- Built with vanilla HTML, CSS, and JavaScript.
- Uses `api.js` to manage all external calls to the backend and handle core triage logic.
- Implements dynamic queue re-sorting based on elapsed wait times and incoming urgent cases.

### Backend (`server`)
- Powered by `json-server` for a quick RESTful mock API.
- Stores state in `db.json` which tracks `users`, `queueData`, `currentlyServingData`, `servedHistoryData`, and `complaints`.

### Triage Scoring Logic
The priority score is computed dynamically on the client side before insertion:
- **Pain / Breathing**: 1–5 slider values.
- **Symptom Flags**: Fixed bonuses based on severity (e.g., chest pain +40, bleeding +35, fainting +30).
- **Age Tier Bonus**: High-risk age groups (<5 years or >60 years) receive priority bumps.
- **Gender Specifics**: Higher priority for potential obstetric emergencies (e.g., bleeding combined with female gender).
- **Wait Time (Anti-Starvation)**: For every 10 seconds of waiting, the patient's effective score increases, ensuring mild cases don't wait indefinitely.

When patients have identical triage scores, the system falls back to a First-Come-First-Served (FCFS) tie-breaker using their arrival time.

---

## 5. Screenshots

*(Replace the placeholders below with actual screenshots of your application)*

- **Patient Intake Form:** 
  ![Intake Form Placeholder](https://via.placeholder.com/800x400.png?text=Intake+Form+Screenshot)
- **Doctor Dashboard:** 
  ![Doctor Dashboard Placeholder](https://via.placeholder.com/800x400.png?text=Doctor+Dashboard+Screenshot)
- **Admin Panel:** 
  ![Admin Panel Placeholder](https://via.placeholder.com/800x400.png?text=Admin+Panel+Screenshot)

---

## 6. API Documentation

The backend exposes the following RESTful endpoints running at `http://localhost:5000`.

### Queue Management
- **`GET /queueData`**
  - Retrieves the current waiting queue of patients.
- **`PUT /queueData`**
  - Replaces the current queue array. Used when adding a patient or updating queue order.

### Serving Patients
- **`GET /currentlyServingData`**
  - Retrieves the patient currently being seen by a doctor.
- **`PUT /currentlyServingData`**
  - Sets the patient that is currently being seen.
- **`GET /servedHistoryData`**
  - Retrieves the history of all patients who have already been served.
- **`PUT /servedHistoryData`**
  - Updates the history list when a patient visit is completed.

### Complaints (Admin)
- **`GET /complaints`**
  - Retrieves all user complaints/feedback.
- **`POST /complaints`**
  - Submits a new complaint. Payload requires complaint details.
- **`DELETE /complaints/:id`**
  - Resolves/Deletes a specific complaint by ID.

### Users & Auth
- **`GET /users`**
  - Retrieves the list of registered users. Returns roles (admin, doctor, receptionist) and credentials.

---

## 7. Folder Structure

```text
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