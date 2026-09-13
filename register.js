const registerForm =
    document.getElementById("registerForm");

const message =
    document.getElementById("message");

const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";


registerForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const username =
            document
                .getElementById("username")
                .value
                .trim();

        const email =
            document
                .getElementById("email")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;


        message.textContent =
            "Tworzenie konta...";


        try {

            const response =
                await fetch(
                    `${API_URL}/api/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            username,
                            email,
                            password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.error ||
                    "Nie udało się utworzyć konta.";

                return;
            }


            message.textContent =
                data.message ||
                "Konto zostało utworzone!";


            registerForm.reset();


            setTimeout(() => {

                window.location.href =
                    "/login.html";

            }, 1200);


        } catch (error) {

            console.error(
                "Register error:",
                error
            );

            message.textContent =
                "Nie udało się połączyć z serwerem.";
        }
    }
);