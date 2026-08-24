async function handleFormsubmit(event) {
    event.preventDefault();

    let name = document.getElementById("name").value.trim()
    let age = parseInt(document.getElementById("age").value);
    let phone = document.getElementById("phone").value.trim();
    let gender = document.getElementById("gender").value;
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

    let score = calculateTriageScore(pain, breathing, hasfever, hasfainting, haschestPain, hasbleeding, hasvomiting, hasdizziness, age, duration, gender);

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
        gender: gender,
        phone: phone,
        triageScore: score,
        symptoms: symptomsList,
        duration: duration,
        arrivalTime: Date.now(),
        status: "waiting",
    }

    await addPatientToQueue(patient);
    await renderQueue();

    // Reset form
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

async function renderQueue() {
    let container = document.getElementById("queue_container");
    if (!container) return;

    await autoCallNextIfAvailable();

    container.innerHTML = "";
    let queue = await getQueue();

    let nowServingDiv = document.getElementById("now_serving");
    let currentlyServing = await getCurrentlyServing();

    if (nowServingDiv) {
        if (currentlyServing != null) {
            let sScore = currentlyServing.triageScore;
            let sUrgencyText = "Standard";
            if (sScore >= 80) sUrgencyText = "Critical";
            else if (sScore >= 60) sUrgencyText = "Urgent";
            else if (sScore >= 40) sUrgencyText = "Moderate";
            nowServingDiv.innerHTML = `${currentlyServing.name} <br> <span style="font-size:0.9rem; font-weight:500; color:#b91c1c;">(Priority: ${sUrgencyText})</span>`;
        } else {
            nowServingDiv.innerHTML = `No one is currently waiting`;
        }
    }

    if (queue.length === 0) {
        container.innerHTML = "<p class='empty-role-msg' style='text-align:center;'>The queue is empty.</p>";
        return;
    }

    queue.forEach((patient, index) => {
        let patientCard = document.createElement("div");
        let effectiveScore = getEffectiveScore(patient);
        
        let isEmergency = effectiveScore >= 60;
        patientCard.className = isEmergency ? "modern-queue-item emergency-bg" : "modern-queue-item";

        let urgencyText = "Standard";
        if (effectiveScore >= 80) urgencyText = "Critical";
        else if (effectiveScore >= 60) urgencyText = "Urgent";
        else if (effectiveScore >= 40) urgencyText = "Moderate";

        let scoreHTML = effectiveScore > patient.triageScore
            ? `<span class="mq-score ${isEmergency ? 'danger' : ''}">${urgencyText} ⬆️</span>`
            : `<span class="mq-score ${isEmergency ? 'danger' : ''}">${urgencyText}</span>`;

        let waitMinutes = Math.floor((Date.now() - patient.arrivalTime) / 60000);
        let waitText = waitMinutes < 1 ? "Just arrived" : `${waitMinutes} min ago`;

        patientCard.innerHTML = `
            <div class="mq-rank">${index + 1}</div>
            <div class="mq-info">
                <strong>${patient.name}</strong> <span style="font-size:0.85rem; color:var(--text-muted); margin-left: 6px;">${patient.age}${patient.gender ? patient.gender.substring(0,1) : ''}</span>
                <br><span>Waiting: ${waitText}</span>
            </div>
            <div>${scoreHTML}</div>
        `;

        container.appendChild(patientCard);
    });
}

// Initial Render
renderQueue();

// Anti-Starvation Heartbeat: Runs every 10 seconds to re-sort the queue
setInterval(async () => {
    if (document.getElementById("queue_container")) {
        await refreshQueueOrder();
        await renderQueue();
    }
}, 10000);

// Input Slider Listeners
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
const intakeSectionTitles = {
    'form': 'Patient Registration',
    'queue': 'Live Waiting Queue'
};

function showIntakeSection(sectionId, clickedLink) {
    document.querySelectorAll('.dashboard-section').forEach(s => s.style.display = 'none');
    document.getElementById('section-' + sectionId).style.display = 'block';
    document.getElementById('pageTitle').textContent = intakeSectionTitles[sectionId];
    document.querySelectorAll('.sidebar-nav a:not(.logout-btn)').forEach(a => a.classList.remove('active'));
    clickedLink.classList.add('active');
}
