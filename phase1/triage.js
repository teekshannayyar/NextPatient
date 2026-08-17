const API_BASE = "http://localhost:5000";

function calculateTriageScore(pain, breathing, hasfever, hasfainting, haschestPain, hasbleeding, hasvomiting, hasdizziness, age, duration) {
    let score = parseInt(pain) + parseInt(breathing);

    if (hasfever) score += 10;
    if (hasfainting) score += 30;
    if (haschestPain) score += 40;
    if (hasbleeding) score += 35;
    if (hasvomiting) score += 10;
    if (hasdizziness) score += 15;

    if (age >= 60 && age < 80) {
        score += 5;
    }
    if (age >= 80 || age < 5) {
        score += 10;
    }

    if (duration === "acute" && score >= 40) {
        score += 15;
    } else if (duration === "chronic" && score >= 40) {
        score -= 5;
    } else if (duration === "chronic" && score < 40) {
        score -= 10;
    }

    return score;
}


async function handleFormsubmit(event) {
    event.preventDefault();

    let name = document.getElementById("name").value.trim()
    let age = parseInt(document.getElementById("age").value);
    let phone = document.getElementById("phone").value.trim();
    let pain = document.getElementById("PainSeverity").value;
    let breathing = document.getElementById("BreathingDifficulty").value;
    let hasfever = document.getElementById("fever").checked;
    let hasfainting = document.getElementById("fainting").checked;
    let haschestPain = document.getElementById("chestPain").checked;
    let hasbleeding = document.getElementById("bleeding").checked;
    let hasvomiting = document.getElementById("vomiting").checked;
    let hasdizziness = document.getElementById("dizziness").checked;
    let duration = document.getElementById("symptomDuration").value;

    if (name == "") {
        alert("Please enter patient name");
        return;
    }
    if (isNaN(age) || age <= 0 || age > 120) {
        alert("Please enter valid age");
        return;
    }

    if (phone.length !== 10) {
        alert("Please enter a valid 10-digit phone number");
        return;
    }

    let score = calculateTriageScore(pain, breathing, hasfever, hasfainting, haschestPain, hasbleeding, hasvomiting, hasdizziness, age, duration);

    let symptomsList = [];
    if (hasfever) symptomsList.push("Fever");
    if (hasfainting) symptomsList.push("Fainting / Loss of Consciousness");
    if (haschestPain) symptomsList.push("Chest Pain");
    if (hasbleeding) symptomsList.push("Severe Bleeding");
    if (hasvomiting) symptomsList.push("Vomiting");
    if (hasdizziness) symptomsList.push("Dizziness");

    const patient = {
        id: Date.now() + "-" + Math.random(),
        name: name,
        age: age,
        phone: phone,
        triageScore: score,
        symptoms: symptomsList,
        duration: duration,
        arrivalTime: Date.now(),
        status: "waiting",
    }

    console.log(patient);
    await addPatientToQueue(patient);
    await renderQueue();

    document.getElementById("name").value = "";
    document.getElementById("age").value = "";
    document.getElementById("phone").value = "";
    document.getElementById("PainSeverity").value = "1";
    document.getElementById("painValue").textContent = "1";
    document.getElementById("BreathingDifficulty").value = "1";
    document.getElementById("breathingValue").textContent = "1";
    document.getElementById("fever").checked = false;
    document.getElementById("fainting").checked = false;
    document.getElementById("chestPain").checked = false;
    document.getElementById("bleeding").checked = false;
    document.getElementById("vomiting").checked = false;
    document.getElementById("dizziness").checked = false;
    document.getElementById("symptomDuration").value = "acute";
}


// ===== Queue storage (json-server) =====

async function getQueue() {
    let response = await fetch(`${API_BASE}/queueData`);
    let data = await response.json();
    return data.patients;
}

async function saveQueue(queue) {
    await fetch(`${API_BASE}/queueData`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, patients: queue })
    });
}

async function getServedHistory() {
    let response = await fetch(`${API_BASE}/servedHistoryData`);
    let data = await response.json();
    return data.visits;
}

async function saveServedHistory(history) {
    await fetch(`${API_BASE}/servedHistoryData`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, visits: history })
    });
}

async function getCurrentlyServing() {
    let response = await fetch(`${API_BASE}/currentlyServingData`);
    let data = await response.json();
    return data.patient;
}

async function setCurrentlyServing(patient) {
    await fetch(`${API_BASE}/currentlyServingData`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: 1, patient: patient })
    });
}

function getEffectiveScore(patient) {
    // For testing purposes, we use 10 seconds. Change 10000 to (1000 * 60 * 15) for 15 minutes!
    let waitingTimeMs = Date.now() - patient.arrivalTime;
    let intervalsPassed = Math.floor(waitingTimeMs / 10000); // 10000ms = 10 seconds
    
    let bonus = intervalsPassed * 10;
    return patient.triageScore + bonus;
}

async function addPatientToQueue(patient) {
    let queue = await getQueue();
    let inserted = false;

    for (let i = 0; i < queue.length; i++) {
        let newPatientScore = getEffectiveScore(patient);
        let existingPatientScore = getEffectiveScore(queue[i]);

        if (newPatientScore > existingPatientScore) {
            queue.splice(i, 0, patient)
            inserted = true;
            break;
        }
        else if (newPatientScore == existingPatientScore) {
            if (patient.arrivalTime < queue[i].arrivalTime) {
                queue.splice(i, 0, patient);
                inserted = true;
                break;
            }
        }
    }
    if (inserted == false) {
        queue.push(patient)
    }

    await saveQueue(queue);
}

async function refreshQueueOrder() {
    let queue = await getQueue();
    if (queue.length <= 1) return; // Nothing to sort

    let newQueue = [];
    
    // Custom Insertion Sort: re-insert every patient into a new array based on current effective scores
    for (let p = 0; p < queue.length; p++) {
        let patient = queue[p];
        let inserted = false;
        
        let newPatientScore = getEffectiveScore(patient);

        for (let i = 0; i < newQueue.length; i++) {
            let existingPatientScore = getEffectiveScore(newQueue[i]);

            if (newPatientScore > existingPatientScore) {
                newQueue.splice(i, 0, patient);
                inserted = true;
                break;
            } else if (newPatientScore == existingPatientScore) {
                if (patient.arrivalTime < newQueue[i].arrivalTime) {
                    newQueue.splice(i, 0, patient);
                    inserted = true;
                    break;
                }
            }
        }
        
        if (!inserted) {
            newQueue.push(patient);
        }
    }

    await saveQueue(newQueue);
}

async function finishVisit() {
    let servedPatient = await getCurrentlyServing();

    if (servedPatient == null) {
        return;
    }

    servedPatient.status = "served";
    servedPatient.servedTime = Date.now();
    servedPatient.doctorNotes = document.getElementById("doctorNotes") ? document.getElementById("doctorNotes").value.trim() : "";

    let history = await getServedHistory();
    history.push(servedPatient);
    await saveServedHistory(history);

    await setCurrentlyServing(null);

    if (document.getElementById("doctorNotes")) {
        document.getElementById("doctorNotes").value = "";
    }

    await autoCallNextIfAvailable();
    await renderQueue();
    await renderDoctorView();
}

async function searchByPhone(phoneNumber) {
    let history = await getServedHistory();

    let matches = history.filter(function (patient) {
        return patient.phone === phoneNumber;
    });

    return matches;
}

function isToday(timestamp) {
    let visitDate = new Date(timestamp);
    let now = new Date();

    return visitDate.getDate() === now.getDate() &&
           visitDate.getMonth() === now.getMonth() &&
           visitDate.getFullYear() === now.getFullYear();
}

async function getTodaysStats() {
    let history = await getServedHistory();

    let todaysVisits = history.filter(function(visit){
        return isToday(visit.servedTime);
    });

    let emergencyCount = todaysVisits.filter(function(visit){
        return visit.triageScore >= 60;
    }).length;

    let queue = await getQueue();

    return {
        totalServedToday: todaysVisits.length,
        emergencyCount: emergencyCount,
        currentlyWaiting: queue.length
    };
}

async function getUsers() {
    let response = await fetch(`${API_BASE}/users`);
    let users = await response.json();
    return users;
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

    let usernameTaken = users.some(function (user) {
        return user.username === username;
    });

    if (usernameTaken) {
        alert("That username is already taken");
        return;
    }

    let newUser = {
        username: username,
        password: password,
        role: role
    };

    await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
    });

    document.getElementById("staffUsername").value = "";
    document.getElementById("staffPassword").value = "";

    renderStaffList();
}

async function autoCallNextIfAvailable() {
    let currentlyServing = await getCurrentlyServing();

    if (currentlyServing != null) {
        return;
    }

    let queue = await getQueue();

    if (queue.length == 0) {
        return;
    }

    let nextPatient = queue.shift();
    await setCurrentlyServing(nextPatient);
    await saveQueue(queue);
}