async function checkIfAdminExists() {
    let users = await getUsers();
    return users.some(function(user){
        return user.role === "admin";
    });
}

async function handleAdminSignup() {
    let adminExists = await checkIfAdminExists();

    if (adminExists) {
        document.getElementById("signupBlockedMessage").style.display = "block";
        return;
    }

    let username = document.getElementById("signupUsername").value.trim();
    let password = document.getElementById("signupPassword").value;

    if (username === "") {
        alert("Please enter a username");
        return;
    }
    if (password === "") {
        alert("Please enter a password");
        return;
    }

    let users = await getUsers();
    let usernameTaken = users.some(function(user){
        return user.username === username;
    });

    if (usernameTaken) {
        alert("That username is already taken");
        return;
    }

    let newAdmin = {
        username: username,
        password: password,
        role: "admin"
    };

    await fetch(`${API_BASE}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAdmin)
    });

    alert("Admin account created! Redirecting to login.");
    window.location.href = "login.html";
}

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

function handleLogout() {
    sessionStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function requireRole(allowedRole) {
    let loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

    if (!loggedInUser) {
        window.location.href = "login.html";
        return;
    }

    if (loggedInUser.role !== allowedRole) {
        alert("You don't have access to this page.");
        window.location.href = "login.html";
        return;
    }
}