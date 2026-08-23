async function handleLogin() {
    let username = document.getElementById("loginUsername").value.trim();
    let password = document.getElementById("loginPassword").value;

    let users = await getUsers();

    let matchedUser = users.find(function(user){
        return user.username === username && user.password === password;
    });

    if (!matchedUser) {
        document.getElementById("loginError").style.display = "block";
        return;
    }

    sessionStorage.setItem("loggedInUser", JSON.stringify(matchedUser));

    if (matchedUser.role === "admin") {
        window.location.href = "admin.html";
    }
    else if (matchedUser.role === "doctor") {
        window.location.href = "doctor.html";
    }
    else if (matchedUser.role === "receptionist") {
        window.location.href = "intake.html";
    }
}
