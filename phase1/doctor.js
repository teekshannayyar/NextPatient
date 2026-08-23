// ===== Doctor page rendering =====

async function renderDoctorView() {
    let workspaceContent = document.getElementById("doctorWorkspaceContent");
    if (!workspaceContent) return;

    let currentlyServing = await getCurrentlyServing();

    if (currentlyServing == null) {
        let stats = await getTodaysStats();
        
        workspaceContent.innerHTML = `
            <div class="doctor-empty" style="height: auto; margin-top: 4rem;">
                <div class="doctor-empty-icon" style="font-size: 3rem; margin-bottom: 0;">🏥</div>
                <h2 style="margin-bottom: 2rem;">No Patients Waiting</h2>
                
                <div class="dashboard-card" style="width: 100%; max-width: 600px; text-align: left;">
                    <div class="workspace-card-header" style="justify-content: center;">
                        <span>📊 Today's Clinic Summary</span>
                    </div>
                    <div class="workspace-card-body">
                        <div class="patient-meta-grid" style="grid-template-columns: 1fr 1fr 1fr; margin-bottom: 0;">
                            <div class="meta-item" style="text-align: center;">
                                <span>Total Served</span>
                                <strong style="font-size: 1.5rem;">${stats.totalServedToday}</strong>
                            </div>
                            <div class="meta-item" style="text-align: center;">
                                <span>In Queue</span>
                                <strong style="font-size: 1.5rem;">${stats.currentlyWaiting}</strong>
                            </div>
                            <div class="meta-item" style="text-align: center;">
                                <span>Emergencies</span>
                                <strong style="font-size: 1.5rem; color: var(--danger);">${stats.emergencyCount}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return;
    }

    // If there is a patient, fetch their history first
    let pastVisits = await searchByPhone(currentlyServing.phone);
    pastVisits.sort((a, b) => b.servedTime - a.servedTime);

    // Build Symptoms tags
    let todaysSymptoms = (currentlyServing.symptoms && currentlyServing.symptoms.length > 0)
        ? currentlyServing.symptoms.map(s => `<span class="symptom-tag">${s}</span>`).join("")
        : "<span class='symptom-tag' style='background:#e5e7eb; color:#374151;'>None reported</span>";

    // Build History HTML
    let historyHTML = "";
    if (pastVisits.length === 0) {
        historyHTML = "<p class='empty-role-msg' style='padding:1rem;'>No previous visits found.</p>";
    } else {
        historyHTML = pastVisits.map(visit => {
            let symptomsText = (visit.symptoms && visit.symptoms.length > 0)
                ? visit.symptoms.join(", ")
                : "None reported";
            return `
            <div class="history-item">
                <div class="date">${new Date(visit.servedTime).toLocaleString()}</div>
                <div class="details">
                    <p><strong>Symptoms:</strong> ${symptomsText}</p>
                    <p><strong>Treatment:</strong> ${visit.doctorNotes ? visit.doctorNotes : "—"}</p>
                </div>
            </div>`;
        }).join("");
    }

    // Render Dual-Column Layout
    workspaceContent.innerHTML = `
        <div class="workspace-grid">
            <!-- Left Column: Active Patient -->
            <div class="workspace-card">
                <div class="workspace-card-header">
                    <span>🔴 Currently Serving</span>
                </div>
                <div class="workspace-card-body">
                    <h3>${currentlyServing.name}</h3>
                    <div class="patient-meta-grid">
                        <div class="meta-item">
                            <span>Age</span>
                            <strong>${currentlyServing.age}</strong>
                        </div>
                        <div class="meta-item">
                            <span>Phone Number</span>
                            <strong>${currentlyServing.phone}</strong>
                        </div>
                        <div class="meta-item">
                            <span>Arrival Time</span>
                            <strong>${new Date(currentlyServing.arrivalTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</strong>
                        </div>
                        <div class="meta-item">
                            <span>Triage Score</span>
                            <strong style="color:var(--danger);">${currentlyServing.triageScore}</strong>
                        </div>
                    </div>
                    
                    <h4 style="margin-top:0; color:var(--text); font-size:0.9rem; text-transform:uppercase;">Reported Symptoms</h4>
                    <div class="symptoms-tags">
                        ${todaysSymptoms}
                    </div>

                    <h4 style="margin-top:0; color:var(--text); font-size:0.9rem; text-transform:uppercase;">Treatment & Notes</h4>
                    <textarea id="doctorNotes" class="treatment-textarea" placeholder="Enter treatment given, medicines prescribed, or clinical notes here..."></textarea>
                    
                    <button onclick="handleServePatient()" style="width:100%; font-size:1.1rem;">✅ Mark as Treated & Call Next</button>
                </div>
            </div>

            <!-- Right Column: Patient History -->
            <div class="workspace-card">
                <div class="workspace-card-header">
                    <span>📋 Patient History</span>
                </div>
                <div class="workspace-card-body">
                    <div class="history-timeline">
                        ${historyHTML}
                    </div>
                </div>
            </div>
        </div>
    `;
}
renderDoctorView();


async function handleServePatient() {
    let servedPatient = await getCurrentlyServing();
    if (servedPatient == null) return;

    servedPatient.status = "served";
    servedPatient.servedTime = Date.now();
    servedPatient.doctorNotes = document.getElementById("doctorNotes") ? document.getElementById("doctorNotes").value.trim() : "";

    let history = await getServedHistory();
    history.push(servedPatient);
    await saveServedHistory(history);

    await setCurrentlyServing(null);

    await autoCallNextIfAvailable();
    await renderDoctorView();
}

// ===== Sidebar Navigation =====
const doctorSectionTitles = {
    workstation: 'Workstation',
    history:     'Patient Lookup'
};

function showDoctorSection(sectionId, clickedLink) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    
    let titleEl = document.getElementById('pageTitle');
    if (titleEl) titleEl.textContent = doctorSectionTitles[sectionId];
    
    document.querySelectorAll('.sidebar-nav a:not(.logout-btn)').forEach(a => a.classList.remove('active'));
    if (clickedLink) clickedLink.classList.add('active');

    return false;
}

// ===== Patient Lookup (Doctor Search) =====
async function handleDoctorSearch() {
    let searchPhoneInput = document.getElementById("searchPhoneDoctor");
    if (!searchPhoneInput) return;

    let searchPhone = searchPhoneInput.value.trim();
    if (searchPhone.length !== 10) {
        alert("Please enter a valid 10-digit phone number");
        return;
    }

    let matches = await searchByPhone(searchPhone);
    matches.sort((a, b) => b.servedTime - a.servedTime);

    let resultsDiv = document.getElementById("searchResultsDoctor");
    resultsDiv.innerHTML = "";

    if (matches.length === 0) {
        resultsDiv.innerHTML = "<p class='empty-role-msg'>No records found for this phone number.</p>";
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
            <p><strong>Age:</strong> ${patient.age}</p>
            <p><strong>Symptoms:</strong> ${symptomsText} <span style="color:var(--text-muted); font-size:0.85rem;">(Duration: ${durationText})</span></p>
            <p><strong>Treatment/Notes:</strong> ${patient.doctorNotes ? patient.doctorNotes : "—"}</p>
            <p><strong>Visit Date:</strong> ${new Date(patient.servedTime).toLocaleString()}</p>`;

            resultsDiv.appendChild(patientCard);
        });
    }
}
