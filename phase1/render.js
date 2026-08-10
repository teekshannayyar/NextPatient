function renderQueue() {
    let container = document.getElementById("queue_container");
    container.innerHTML = "";
    let queue = getQueue();

    queue.forEach((patient, index) => {
        let patientCard = document.createElement("div");
        patientCard.className = "patientCard"

        patientCard.innerHTML =
            `<h3>${index + 1} - ${patient.name}</h3> 
        <p>Priority Score: ${patient.triageScore}</p>`;

        container.appendChild(patientCard);
    });
}
renderQueue()


document.getElementById("PainSeverity").addEventListener("input", function () {
    document.getElementById("painValue").textContent = this.value;
});

document.getElementById("BreathingDifficulty").addEventListener("input", function () {
    document.getElementById("breathingValue").textContent = this.value;
});