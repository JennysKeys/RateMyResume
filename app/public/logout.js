function logoutUser() {
    localStorage.removeItem("token");
    alert("You have been logged out.");

    // below line will redirect to home page
    // window.location.href = "/index.html";
}

document.getElementById("logoutButton").addEventListener("click", logoutUser);
