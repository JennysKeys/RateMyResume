function createUser(event) {
    event.preventDefault();

    const username = document.getElementById("uname").value;
    const password = document.getElementById("psw").value;

    fetch("/create-user", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("User created successfully!");
                // Optionally, redirect or clear form fields
            } else {
                alert(data.error || "Failed to create user");
            }
            console.log(data);
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

document.getElementById("createAccountButton").addEventListener("click", createUser);
