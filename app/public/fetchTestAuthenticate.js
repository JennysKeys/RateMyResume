document.getElementById("fetchTestAuthenticateTokenButton").addEventListener("click", () => {
    fetch("/test-authenticate-token", {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
    })

        .then(response => {
            if (response.ok) {
                return response.json(); // Parse JSON if request is successful
            } else {
                throw new Error("Failed to authenticate token or request is unauthorized");
            }
        })
        .then(data => {
            console.log("Response from /test-authenticate-token:", data);
            alert("Response received: " + JSON.stringify(data)); // Show response in an alert
        })
        .catch(error => {
            console.error("Error:", error);
            alert("Error calling /test-authenticate-token: " + error.message); // Show error in an alert
        });
});