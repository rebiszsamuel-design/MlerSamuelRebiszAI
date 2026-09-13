const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const login = document.getElementById("login").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Logowanie...";

    try {
        const response = await fetch("/api/login", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                login,
                password
            })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (data.success) {
            setTimeout(() => {
                window.location.href = "/account.html";
            }, 700);
        }

    } catch (error) {
        console.error(error);

        message.textContent =
            "Nie udało się połączyć z serwerem.";
    }
});