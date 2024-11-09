function loginUser(event) {
    event.preventDefault();

    const username = document.getElementById("uname").value;
    const password = document.getElementById("psw").value;

    fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert("Login successful!");
            } else {
                alert("Invalid credentials");
            }
            console.log(data); // prints the
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

document.getElementById("loginForm").addEventListener("submit", loginUser);
