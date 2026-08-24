const API_BASE = "http://localhost:5000";

// ===== Utility Functions =====

function calculateTriageScore(pain, breathing, hasfever, hasfainting, haschestPain, hasbleeding, hasvomiting, hasdizziness, age, duration, gender) {
    let score = parseInt(pain) + parseInt(breathing);

    if (hasfever) score += 10;
    if (hasfainting) score += 30;
    if (haschestPain) score += 40;
    if (hasbleeding) score += 35;
    if (hasvomiting) score += 10;
    if (hasdizziness) score += 15;

    if (age >= 60 && age < 80) score += 5;
    if (age >= 80 || age < 5) score += 10;

    if (duration === "acute" && score >= 40) score += 15;
    else if (duration === "chronic" && score >= 40) score -= 5;
    else if (duration === "chronic" && score < 40) score -= 10;

    // Gender specific adjustments
    if (gender === 'Female' && hasbleeding) {
        score += 15; // Higher priority for potential obstetric/gynecological emergencies
    }

    return score;
}

function getEffectiveScore(patient) {
    // 10000ms = 10 seconds for testing
    let waitingTimeMs = Date.now() - patient.arrivalTime;
    let intervalsPassed = Math.floor(waitingTimeMs / 10000); 
    
    let bonus = intervalsPassed * 10;
    return patient.triageScore + bonus;
}

function isToday(timestamp) {
    let visitDate = new Date(timestamp);
    let now = new Date();

    return visitDate.getDate() === now.getDate() &&
           visitDate.getMonth() === now.getMonth() &&
           visitDate.getFullYear() === now.getFullYear();
}

// ===== API Wrappers =====

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

async function getUsers() {
    let response = await fetch(`${API_BASE}/users`, { cache: 'no-store' });
    let users = await response.json();
    return users;
}

async function searchByPhone(phoneNumber) {
    let history = await getServedHistory();
    let matches = history.filter(function (patient) {
        return patient.phone === phoneNumber;
    });
    return matches;
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
    if (queue.length <= 1) return;

    let newQueue = [];
    
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

async function autoCallNextIfAvailable() {
    let currentlyServing = await getCurrentlyServing();
    if (currentlyServing != null) return;

    let queue = await getQueue();
    if (queue.length == 0) return;

    let nextPatient = queue.shift();
    await setCurrentlyServing(nextPatient);
    await saveQueue(queue);
}

// ===== Complaints API =====

async function getComplaints() {
    try {
        let response = await fetch(`${API_BASE}/complaints`);
        if (response.ok) {
            return await response.json();
        }
    } catch(e) {}
    return [];
}

async function submitComplaint(complaint) {
    await fetch(`${API_BASE}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complaint)
    });
}

async function deleteComplaint(id) {
    try {
        await fetch(`${API_BASE}/complaints/${id}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error(e);
    }
}
