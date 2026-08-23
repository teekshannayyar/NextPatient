
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