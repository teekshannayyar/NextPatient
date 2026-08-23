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
