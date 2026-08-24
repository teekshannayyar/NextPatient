
function getLoggedInUser() {
    let user = sessionStorage.getItem("loggedInUser");
    if (!user) {
        user = localStorage.getItem("loggedInUser");
    }
    return user ? JSON.parse(user) : null;
}

function handleLogout() {
    sessionStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInUser");
    window.location.href = "index.html";
}

function requireRole(allowedRole) {
    let loggedInUser = getLoggedInUser();

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