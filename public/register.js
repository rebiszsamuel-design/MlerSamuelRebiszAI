const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    message.textContent = "Tworzenie konta...";

    try {
        const response = await fetch("/api/register", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                username,
                email,
                password
            })
        });

        const data = await response.json();

        message.textContent = data.message;

        if (data.success) {
            registerForm.reset();

            setTimeout(() => {
                window.location.href = "/login.html";
            }, 1200);
        }

    } catch (error) {
        console.error(error);

        message.textContent =
            "Nie udało się połączyć z serwerem.";
    }
});