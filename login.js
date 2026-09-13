const loginForm =
    document.getElementById("loginForm");

const message =
    document.getElementById("message");

const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";


loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const login =
            document
                .getElementById("login")
                .value
                .trim();

        const password =
            document
                .getElementById("password")
                .value;

        message.textContent =
            "Logowanie...";


        try {

            const response =
                await fetch(
                    `${API_URL}/api/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            login,
                            password
                        })
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                message.textContent =
                    data.error ||
                    "Nieprawidłowy login lub hasło.";

                return;
            }


            if (!data.token) {

                message.textContent =
                    "Serwer nie zwrócił sesji.";

                return;
            }


            localStorage.setItem(
                "mullar_token",
                data.token
            );


            message.textContent =
                data.message ||
                "Zalogowano!";


            setTimeout(() => {

                window.location.href =
                    "/account.html";

            }, 700);


        } catch (error) {

            console.error(
                "Login error:",
                error
            );

            message.textContent =
                "Nie udało się połączyć z serwerem.";
        }
    }
);