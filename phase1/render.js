async function renderQueue() {
    let container = document.getElementById("queue_container");
    if (!container) return;

    await autoCallNextIfAvailable();

    container.innerHTML = "";
    let queue = await getQueue();

    let nowServingDiv = document.getElementById("now_serving");
    let currentlyServing = await getCurrentlyServing();

    if (currentlyServing != null) {
        nowServingDiv.innerHTML = `<h2>Now Serving: ${currentlyServing.name}</h2>`;
    }
    else {
        nowServingDiv.innerHTML = `<h2>No one is currently waiting</h2>`;
    }

    queue.forEach((patient, index) => {
        let patientCard = document.createElement("div");
        patientCard.className = "patientCard";

        let effectiveScore = getEffectiveScore(patient);
        let scoreHTML = effectiveScore > patient.triageScore
            ? `<span style="color: #ff4d4f;">${effectiveScore} (Aged Priority)</span>`
            : `${patient.triageScore}`;

        patientCard.innerHTML =
            `<h3>${index + 1} - ${patient.name}</h3>
             <p>Score: ${scoreHTML}</p>`;

        container.appendChild(patientCard);
    });
}
renderQueue();

// Anti-Starvation Heartbeat: Runs every 10 seconds for testing!
// This will re-sort the queue and refresh the UI automatically.
setInterval(async () => {
    if (document.getElementById("queue_container")) {
        await refreshQueueOrder();
        await renderQueue();
    }
}, 10000);

let painSlider = document.getElementById("PainSeverity");
if (painSlider) {
    painSlider.addEventListener("input", function () {
        document.getElementById("painValue").textContent = this.value;
    });
}

let breathingSlider = document.getElementById("BreathingDifficulty");
if (breathingSlider) {
    breathingSlider.addEventListener("input", function () {
        document.getElementById("breathingValue").textContent = this.value;
    });
}

async function handleSearch() {
    let searchPhoneInput = document.getElementById("searchPhone");
    if (!searchPhoneInput) return;

    let searchPhone = searchPhoneInput.value.trim();

    if (searchPhone.length !== 10) {
        alert("Please enter a valid 10-digit phone number");
        return;
    }

    let matches = await searchByPhone(searchPhone);

    matches.sort(function (a, b) {
        return b.servedTime - a.servedTime;
    });

    let resultsDiv = document.getElementById("searchResults");
    resultsDiv.innerHTML = "";

    if (matches.length === 0) {
        resultsDiv.innerHTML = "<p>No records found.</p>";
    }
    else {
        matches.forEach(function (patient) {
            let patientCard = document.createElement("div");
            patientCard.className = "patientCard"

            let symptomsText = (patient.symptoms && patient.symptoms.length > 0)
                ? patient.symptoms.join(", ")
                : "None reported";
            
            let durationLabels = {
                "acute": "Under 24 hours",
                "short_term": "1-3 days",
                "medium_term": "4-7 days",
                "chronic": "More than a week"
            };
            let durationText = patient.duration ? durationLabels[patient.duration] : "Unknown";

            patientCard.innerHTML =
                `<h3>${patient.name}</h3>
            <p>Age: ${patient.age}</p>
            <p>Symptoms: ${symptomsText} (Duration: ${durationText})</p>
            <p>Treatment/Notes: ${patient.doctorNotes ? patient.doctorNotes : "—"}</p>
            <p>Visit Date: ${new Date(patient.servedTime).toLocaleString()}</p>`;

            resultsDiv.appendChild(patientCard);
        });
    }
}

// ===== Doctor page rendering =====

async function renderDoctorView() {
    let profileDiv = document.getElementById("patientProfile");
    if (!profileDiv) return;

    let nowServingDiv = document.getElementById("now_serving");
    if (!nowServingDiv) return;

    let currentlyServing = await getCurrentlyServing();

    if (currentlyServing == null) {
        nowServingDiv.innerHTML = `<h2>No patient currently waiting</h2>`;
        profileDiv.innerHTML = "";
        return;
    }

    nowServingDiv.innerHTML =
        `<h2 onclick="openPatientProfile()" style="cursor:pointer; text-decoration:underline;">
        Now Serving: ${currentlyServing.name} (click to view)
    </h2>`;

    profileDiv.innerHTML = "";
}
renderDoctorView();

async function openPatientProfile() {
    let currentlyServing = await getCurrentlyServing();
    if (currentlyServing == null) return;

    let pastVisits = await searchByPhone(currentlyServing.phone);

    pastVisits.sort(function (a, b) {
        return b.servedTime - a.servedTime;
    });

    let profileDiv = document.getElementById("patientProfile");

    let historyHTML = "";

    if (pastVisits.length === 0) {
        historyHTML = "<p>No previous visits found.</p>";
    }
    else {
        pastVisits.forEach(function (visit) {
            let symptomsText = (visit.symptoms && visit.symptoms.length > 0)
                ? visit.symptoms.join(", ")
                : "None reported";

            historyHTML += `
            <div class="patientCard">
                <p><strong>Date:</strong> ${new Date(visit.servedTime).toLocaleString()}</p>
                <p><strong>Symptoms:</strong> ${symptomsText}</p>
                <p><strong>Treatment given:</strong> ${visit.doctorNotes ? visit.doctorNotes : "—"}</p>
            </div>`;
        });
    }

    let todaysSymptoms = (currentlyServing.symptoms && currentlyServing.symptoms.length > 0)
        ? currentlyServing.symptoms.join(", ")
        : "None reported";

    profileDiv.innerHTML =
        `<h3>${currentlyServing.name} — Age ${currentlyServing.age}</h3>
    <p>Symptoms today: ${todaysSymptoms}</p>
    <h4>Past Visits</h4>
    ${historyHTML}
    <textarea id="doctorNotes" placeholder="Enter treatment/medicines given..."></textarea>
    <button onclick="finishVisit()">Finish Visit</button>`;
}

async function renderAdminStats() {
    let statsContainer = document.getElementById("statsContainer");
    if (!statsContainer) return;

    let stats = await getTodaysStats();

    statsContainer.innerHTML = `
        <div class="patientCard">
            <p><strong>Patients Served Today:</strong> ${stats.totalServedToday}</p>
            <p><strong>Emergency Cases Today:</strong> ${stats.emergencyCount}</p>
            <p><strong>Currently Waiting:</strong> ${stats.currentlyWaiting}</p>
        </div>`;
}
renderAdminStats();

async function renderStaffList() {
    let staffListDiv = document.getElementById("staffList");
    if (!staffListDiv) return;

    let users = await getUsers();

    if (users.length === 0) {
        staffListDiv.innerHTML = "<p>No staff accounts yet.</p>";
        return;
    }

    staffListDiv.innerHTML = "";

    users.forEach(function (user) {
        let userCard = document.createElement("div");
        userCard.className = "patientCard";
        userCard.innerHTML = `<p><strong>${user.username}</strong> — ${user.role}</p>`;
        staffListDiv.appendChild(userCard);
    });
}
renderStaffList();