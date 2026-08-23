// Check if logged in
let loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));
if (!loggedInUser) {
    window.location.href = "login.html";
}

function goBack() {
    if (loggedInUser.role === "doctor") {
        window.location.href = "doctor.html";
    } else if (loggedInUser.role === "receptionist") {
        window.location.href = "intake.html";
    } else {
        window.location.href = "index.html";
    }
}

async function submitContactForm() {
    let subject = document.getElementById("complaintSubject").value.trim();
    let message = document.getElementById("complaintMessage").value.trim();

    if (subject === "" || message === "") {
        document.getElementById("complaintError").style.display = "block";
        document.getElementById("complaintSuccess").style.display = "none";
        return;
    }
    
    document.getElementById("complaintError").style.display = "none";

    let newComplaint = {
        id: Date.now() + "-" + Math.random(),
        userId: loggedInUser.id,
        name: loggedInUser.username,
        role: loggedInUser.role,
        subject: subject,
        message: message,
        timestamp: Date.now()
    };

    await submitComplaint(newComplaint);

    document.getElementById("complaintSuccess").style.display = "block";
    document.getElementById("complaintSubject").value = "";
    document.getElementById("complaintMessage").value = "";
    
    setTimeout(() => {
        goBack();
    }, 2000);
}
