// ===== Admin Dashboard Logic =====

const sectionTitles = {
    dashboard:    'Overview',
    history:      'Patient History',
    addstaff:     'Add Staff',
    currentstaff: 'Current Staff',
    complaints:   'Complaints & Feedback'
};

function showSection(sectionId, clickedLink) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    document.getElementById('pageTitle').textContent = sectionTitles[sectionId];
    document.querySelectorAll('.sidebar-nav a:not(.logout-btn)').forEach(a => a.classList.remove('active'));
    clickedLink.classList.add('active');

    if (sectionId === 'currentstaff') renderStaffList();
    if (sectionId === 'dashboard')    renderAdminStats();
    if (sectionId === 'complaints')   renderComplaints();

    return false;
}

async function renderAdminStats() {
    let statsContainer = document.getElementById("statsContainer");
    if (!statsContainer) return;

    let stats = await getTodaysStats();

    statsContainer.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${stats.totalServedToday}</div>
            <div class="stat-label">Patients Served Today</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${stats.currentlyWaiting}</div>
            <div class="stat-label">Currently Waiting</div>
        </div>
        <div class="stat-card">
            <div class="stat-value emergency">${stats.emergencyCount}</div>
            <div class="stat-label">Emergency Cases (>60)</div> 
        </div>
    `;

    // Now Serving widget
    let nowServingAdminDiv = document.getElementById("nowServingAdmin");
    let currentlyServing = await getCurrentlyServing();
    
    if (currentlyServing != null) {
        nowServingAdminDiv.innerHTML = `
            <div class="now-serving-badge">
                <span class="status-dot"></span>
                <strong>${currentlyServing.name}</strong> 
                <span style="color:var(--text-muted); font-size:0.85rem; margin-left:8px;">(Triage: ${currentlyServing.triageScore})</span>
            </div>
        `;
    } else {
        nowServingAdminDiv.innerHTML = `<p class="empty-role-msg" style="margin:0;">No patient currently being served.</p>`;
    }

    // Recent Visits widget
    let history = await getServedHistory();
    let todaysVisits = history.filter(v => isToday(v.servedTime));
    let recentVisitsDiv = document.getElementById("recentVisitsAdmin");

    if (todaysVisits.length === 0) {
        recentVisitsDiv.innerHTML = `<p class="empty-role-msg" style="margin:0;">No visits recorded today yet.</p>`;
    } else {
        todaysVisits.sort((a, b) => b.servedTime - a.servedTime);
        let recentFive = todaysVisits.slice(0, 5);
        let html = '<ul class="recent-visits-list">';
        recentFive.forEach(v => {
            let timeString = new Date(v.servedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            html += `
                <li>
                    <span><strong>${v.name}</strong></span>
                    <span style="color:var(--text-muted); font-size:0.85rem;">${timeString}</span>
                </li>`;
        });
        html += '</ul>';
        recentVisitsDiv.innerHTML = html;
    }

    // Top Symptoms widget
    let topSymptomsDiv = document.getElementById("topSymptomsAdmin");
    if (todaysVisits.length === 0) {
        topSymptomsDiv.innerHTML = `<p class="empty-role-msg" style="margin:0;">No symptoms recorded today yet.</p>`;
    } else {
        let symptomCounts = {};
        todaysVisits.forEach(v => {
            if (v.symptoms && v.symptoms.length > 0) {
                v.symptoms.forEach(s => {
                    symptomCounts[s] = (symptomCounts[s] || 0) + 1;
                });
            }
        });
        let sortedSymptoms = Object.keys(symptomCounts).sort((a, b) => symptomCounts[b] - symptomCounts[a]).slice(0, 5);
        if (sortedSymptoms.length === 0) {
            topSymptomsDiv.innerHTML = `<p class="empty-role-msg" style="margin:0;">No specific symptoms logged.</p>`;
        } else {
            let html = '<div style="display:flex; flex-wrap:wrap; gap:8px;">';
            sortedSymptoms.forEach(s => {
                html += `<span class="symptom-tag" style="background:#e0e7ff; color:#4338ca;">${s} <span style="background:rgba(255,255,255,0.6); padding:2px 6px; border-radius:50px; margin-left:4px; font-size:0.75rem;">${symptomCounts[s]}</span></span>`;
            });
            html += '</div>';
            topSymptomsDiv.innerHTML = html;
        }
    }
}

async function renderStaffList() {
    let doctorListDiv = document.getElementById("doctorList");
    let receptionistListDiv = document.getElementById("receptionistList");
    
    if (!doctorListDiv && !receptionistListDiv) return;

    let users = await getUsers();

    const roleColors = {
        doctor: { icon: "🩺", bg: "#e0f2fe", color: "#0369a1" },
        receptionist: { icon: "📞", bg: "#fef08a", color: "#854d0e" },
        admin: { icon: "⚙️", bg: "#e5e7eb", color: "#374151" }
    };

    if (doctorListDiv) {
        doctorListDiv.innerHTML = "";
        let doctors = users.filter(u => u.role === "doctor");
        if (doctors.length === 0) {
            doctorListDiv.innerHTML = "<p class='empty-role-msg'>No doctors added yet.</p>";
        } else {
            doctors.forEach(function (user) {
                let rc = roleColors.doctor;
                let card = document.createElement("div");
                card.className = "staff-member-card";
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div class="staff-avatar" style="background:${rc.bg}; color:${rc.color};">${rc.icon}</div>
                            <div class="staff-info">
                                <strong>${user.username}</strong>
                                <span class="staff-role-badge" style="background:${rc.bg}; color:${rc.color};">${user.role}</span>
                            </div>
                        </div>
                        <button onclick="handleDeleteStaff('${user.id}')" class="delete-staff-btn" title="Delete Staff">🗑️</button>
                    </div>`;
                doctorListDiv.appendChild(card);
            });
        }
    }

    if (receptionistListDiv) {
        receptionistListDiv.innerHTML = "";
        let receptionists = users.filter(u => u.role === "receptionist");
        if (receptionists.length === 0) {
            receptionistListDiv.innerHTML = "<p class='empty-role-msg'>No receptionists added yet.</p>";
        } else {
            receptionists.forEach(function (user) {
                let rc = roleColors.receptionist;
                let card = document.createElement("div");
                card.className = "staff-member-card";
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                        <div style="display:flex; align-items:center; gap:1rem;">
                            <div class="staff-avatar" style="background:${rc.bg}; color:${rc.color};">${rc.icon}</div>
                            <div class="staff-info">
                                <strong>${user.username}</strong>
                                <span class="staff-role-badge" style="background:${rc.bg}; color:${rc.color};">${user.role}</span>
                            </div>
                        </div>
                        <button onclick="handleDeleteStaff('${user.id}')" class="delete-staff-btn" title="Delete Staff">🗑️</button>
                    </div>`;
                receptionistListDiv.appendChild(card);
            });
        }
    }
}

async function handleAddStaff() {
    let username = document.getElementById("staffUsername").value.trim();
    let password = document.getElementById("staffPassword").value;
    let role = document.getElementById("staffRole").value;

    if (username === "") {
        alert("Please enter a username");
        return;
    }
    if (password === "") {
        alert("Please enter a password");
        return;
    }

    let users = await getUsers();
    let usernameTaken = users.some(u => u.username === username);
    if (usernameTaken) {
        alert("That username is already taken");
        return;
    }

    let newUser = { username, password, role };

    await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
    });

    document.getElementById("staffUsername").value = "";
    document.getElementById("staffPassword").value = "";
    renderStaffList();
}

async function addStaffAndRefresh() {
    await handleAddStaff();
    if (document.getElementById('staffUsername').value === '') {
        let msg = document.getElementById('staffSuccessMsg');
        msg.style.display = 'block';
        setTimeout(() => msg.style.display = 'none', 3000);
    }
}

let staffToDeleteId = null;

function handleDeleteStaff(userId) {
    staffToDeleteId = userId;
    document.getElementById("deleteModal").style.display = "flex";
    let confirmBtn = document.getElementById("confirmDeleteBtn");
    confirmBtn.onclick = null; 
    confirmBtn.onclick = confirmDeleteStaff;
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
    staffToDeleteId = null;
}

async function confirmDeleteStaff() {
    if (!staffToDeleteId) return;

    try {
        await fetch(`${API_BASE}/users/${staffToDeleteId}`, {
            method: "DELETE"
        });
        if (typeof renderStaffList === "function") {
            renderStaffList();
        }
    } catch (error) {
        console.error("Error deleting staff:", error);
        alert("Failed to delete staff member.");
    }
    closeDeleteModal();
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
    matches.sort((a, b) => b.servedTime - a.servedTime);

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
            <p>Age: ${patient.age} ${patient.gender ? '(' + patient.gender + ')' : ''}</p>
            <p>Symptoms: ${symptomsText} (Duration: ${durationText})</p>
            <p>Treatment/Notes: ${patient.doctorNotes ? patient.doctorNotes : "—"}</p>
            <p>Visit Date: ${new Date(patient.servedTime).toLocaleString()}</p>`;

            resultsDiv.appendChild(patientCard);
        });
    }
}

// Initial render for Admin Dashboard
renderAdminStats();

async function renderComplaints() {
    let complaintsDiv = document.getElementById("complaintsList");
    if (!complaintsDiv) return;

    let complaints = await getComplaints();
    complaintsDiv.innerHTML = "";

    if (complaints.length === 0) {
        complaintsDiv.innerHTML = "<p>No complaints or feedback submitted.</p>";
        return;
    }

    complaints.sort((a, b) => b.timestamp - a.timestamp);

    complaints.forEach(c => {
        let card = document.createElement("div");
        card.className = "dashboard-card";
        card.style.marginBottom = "1rem";
        
        let dateString = new Date(c.timestamp).toLocaleString();
        let roleBadgeColor = c.role === "doctor" ? "#e0f2fe" : "#fef08a";
        let roleTextColor = c.role === "doctor" ? "#0369a1" : "#854d0e";

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom: 0.5rem;">
                <h4 style="margin:0; text-align:left; color:var(--primary-dark);">${c.subject}</h4>
                <span style="font-size:0.8rem; color:var(--text-muted);">${dateString}</span>
            </div>
            <p style="text-align:left; color:var(--text); margin-bottom:1rem; white-space: pre-wrap;">${c.message}</p>
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.85rem;">
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <strong>${c.name}</strong>
                    <span class="staff-role-badge" style="background:${roleBadgeColor}; color:${roleTextColor}; font-size:0.7rem; padding: 2px 6px;">${c.role}</span>
                </div>
                <button onclick="resolveComplaint('${c.id}')" style="background:none; border:1px solid #10b981; color:#10b981; padding:4px 10px; border-radius:4px; font-size:0.8rem; cursor:pointer; width:auto; box-shadow:none;">✅ Mark Resolved</button>
            </div>
        `;
        complaintsDiv.appendChild(card);
    });
}

let complaintToResolveId = null;

function resolveComplaint(id) {
    complaintToResolveId = id;
    document.getElementById("resolveModal").style.display = "flex";
    
    let confirmBtn = document.getElementById("confirmResolveBtn");
    confirmBtn.onclick = null;
    confirmBtn.onclick = confirmResolveComplaint;
}

function closeResolveModal() {
    document.getElementById("resolveModal").style.display = "none";
    complaintToResolveId = null;
}

async function confirmResolveComplaint() {
    if (!complaintToResolveId) return;
    
    try {
        await deleteComplaint(complaintToResolveId);
        await renderComplaints();
    } catch (e) {
        console.error(e);
    }
    
    closeResolveModal();
}
