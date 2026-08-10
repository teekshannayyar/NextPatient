function calculateTriageScore(pain, breathing, hasfever, hasfainting, haschestPain, hasbleeding, hasvomiting, hasdizziness, age) {
    let score = parseInt(pain) + parseInt(breathing);

    if (hasfever)     score += 10;
    if (hasfainting)  score += 30;
    if (haschestPain) score += 40;
    if (hasbleeding)  score += 35;
    if (hasvomiting)  score += 10;
    if (hasdizziness) score += 15;

    if(age>=60 && age<80){
        score+=5;
    }
    if(age>=80 || age<5){
        score+=10;
    }

    return score;
}


function handleFormsubmit(event) {
    event.preventDefault();

    let name = document.getElementById("name").value.trim()
    let age = parseInt(document.getElementById("age").value);
    let pain = document.getElementById("PainSeverity").value;
    let breathing = document.getElementById("BreathingDifficulty").value;
    let hasfever = document.getElementById("fever").checked;
    let hasfainting = document.getElementById("fainting").checked;
    let haschestPain = document.getElementById("chestPain").checked;
    let hasbleeding = document.getElementById("bleeding").checked;
    let hasvomiting = document.getElementById("vomiting").checked;
    let hasdizziness = document.getElementById("dizziness").checked;

    if(name==""){
        alert("Please enter patient name");
        return;
    }
    if(isNaN(age) || age<=0 || age>120){
        alert("Please enter valid age");
        return;
    }

    let score = calculateTriageScore(pain, breathing, hasfever, hasfainting, haschestPain, hasbleeding, hasvomiting, hasdizziness,age);

    const patient = {
        id: Date.now() + "-" + Math.random(),
        name: name,
        age:age,
        triageScore: score,
        arrivalTime: Date.now(),
        status:"waiting",
    }

    console.log(patient);
    addPatientToQueue(patient);
    renderQueue();
}


function getQueue(){
    let savedQueue = localStorage.getItem("patientQueue")

    if(savedQueue){
        return JSON.parse(savedQueue);
    }
    else{
        return[];
    }
}

function addPatientToQueue(patient){
    let queue = getQueue();
    let inserted = false;

    for(let i =0;i<queue.length;i++){
        if(patient.triageScore > queue[i].triageScore){
            queue.splice(i,0,patient)
            inserted = true;
            break;
        }
        else if(patient.triageScore == queue[i].triageScore){
            if(patient.arrivalTime<queue[i].arrivalTime){
                queue.splice(i,0,patient);
                inserted=true;
                break;
            }
        }

    }
    if(inserted==false){
        queue.push(patient)
    }

    localStorage.setItem("patientQueue", JSON.stringify(queue));
    
}