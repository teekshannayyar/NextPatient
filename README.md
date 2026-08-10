# NextPatient

A campus/clinic front-desk tool where patients self-report symptoms and severity, and the system computes a **triage priority score** to automatically order the waiting queue.

> ⚠️ **Non-diagnostic disclaimer**: NextPatient does not diagnose medical conditions. It only determines waiting-room order based on self-reported symptom severity, duration, and risk factors. It is an educational/prototype tool, not a substitute for professional medical judgment. If you are experiencing a medical emergency, call emergency services immediately.

---

## Project Phases

| Phase | Stack | Status |
|---|---|---|
| **Phase 1** | Vanilla HTML/CSS/JS + LocalStorage | 🚧 In progress |
| **Phase 2** | React + Express + MongoDB + JWT auth | 📋 Planned |

### Phase 1 (current)
- Symptom checklist form with severity sliders
- Vanilla JS computes a **triage score** on submit
- Patient inserted into a **sorted LocalStorage queue** using **custom insertion-sort logic** (not `Array.sort()`) — justified below
- DOM renders a live-updating queue

### Phase 2 (planned)
- React receptionist dashboard with real-time queue (`useEffect` polling)
- Patient-facing controlled form
- Express API: `POST /api/queue/add` (recalculates + re-sorts server-side), `PUT /api/queue/:id/serve`
- MongoDB models: `Patient`, `QueueEntry` (with `triageScore`)
- JWT roles: `staff` vs `patient` — staff can view/verify/override self-reported entries before they're finalized in the live queue

---

## Design Decisions

### 1. Self-report vs. staff-verified entry (gaming risk)
Self-reported severity can be exaggerated to skip the queue. Phase 1 has **no authentication** and trusts self-reported input at face value — this is a known, intentional limitation, not an oversight. It is resolved in Phase 2 via staff accounts that can review and override patient-submitted entries before they affect the real queue.

### 2. Triage scoring formula
```
triageScore = painSeverity + breathingDifficulty
            + symptomFlags (fever, fainting, chestPain, bleeding, vomiting, dizziness)
            + ageTierBonus
```
- **Pain / Breathing**: 1–5 slider values, summed directly.
- **Symptom flags**: fixed additive bonuses, weighted by real-world urgency (e.g., chest pain +40, fainting +30, bleeding +35, fever +10, vomiting +10, dizziness +15).
- **Age tier bonus**: age is a recognized risk multiplier in real triage protocols (not just adults — very young children and seniors are both higher-risk). Tiers: age 60–79 → +5, age 80+ or age < 5 → +10. Kept intentionally small relative to symptom flags so age alone cannot outrank a patient with genuine red-flag symptoms.
- **Duration** (planned addition): symptom duration is not yet factored in — acute onset of severe symptoms should score differently than chronic mild ones. Scoped as a near-term addition.

### 3. Tie-breaking rule
When two patients have an equal `triageScore`, the patient with the **earlier `arrivalTime`** is placed first — consistent with standard triage fairness norms (first-come-first-served among equally urgent cases). This is implemented explicitly in the insertion logic, not left to incidental loop behavior.

### 4. Custom insertion sort (not `Array.sort()`)
The queue is always already sorted; each new arrival only needs to find its one correct insertion point. This is an O(n) insert per arrival instead of a full O(n log n) re-sort on every submission — a deliberate efficiency choice for a queue that grows incrementally rather than being rebuilt from scratch.

### 5. Patient-facing vs. staff-facing display
Raw `triageScore` values will **not** be shown on the public/patient-facing queue display — only a queue position number (e.g., "You are #4," "Now Serving #2"), similar to a numbered-ticket system. Reasoning:
- Exposing the scoring logic invites patients to learn which symptoms "score higher" and describe symptoms more dramatically to jump the queue.
- Seeing a low score next to someone else's high score can cause unnecessary distress, even though the tool is explicitly non-diagnostic.
- Full `triageScore` visibility remains appropriate for a **staff-facing view**, where the reasoning behind ordering needs to be inspectable. This foreshadows the `staff` vs `patient` role split planned for Phase 2.

### 6. "Serve" flow (Domino's-style "Now Serving")
Rather than a per-card "serve" button on every patient (which would let staff serve out of order), the queue highlights only the **front of the line** as "Now Serving." Marking a patient served always acts on `queue[0]`, naturally enforcing the priority order the whole system exists to compute. A lightweight served-count/history is kept so staff have a visible record of patients seen.

### 7. Future enhancements (explicitly out of scope for Phase 1)
- **Aging / anti-starvation**: a patient with mild symptoms could theoretically wait indefinitely if higher-priority patients keep arriving. Planned fix: effective score = `triageScore + (waitingMinutes × agingRate)`, recalculated periodically so no patient waits forever, while still respecting urgency.
- **Doctor specialty matching**: assigning patients to specific doctors based on specialty is a meaningfully larger scheduling/matching problem, outside the original Patient/QueueEntry scope. Parked as a possible Phase 3 stretch goal.

---

## Data Model (Phase 1)

```js
{
  id: "string (timestamp + random, unique per patient)",
  name: "string",
  age: "number",
  triageScore: "number (computed)",
  arrivalTime: "number (ms timestamp, used for tie-breaking)",
  status: "waiting" | "served"
}
```

---

## Folder Structure

```
NextPatient/
├── README.md
├── .gitignore
└── phase1/
    ├── index.html      # form structure + queue display
    ├── style.css        # styling, urgency color-coding
    ├── triage.js         # scoring logic, insertion sort, LocalStorage read/write
    └── render.js          # DOM rendering of the live queue
```