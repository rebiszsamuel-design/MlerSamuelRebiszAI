const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const token =
    localStorage.getItem("mullar_token");

const $ = (id) =>
    document.getElementById(id);

if (!token) {
    window.location.href = "/login.html";
}


// ========================================
// TABY
// ========================================

document
    .querySelectorAll(".tab-button[data-tab]")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    button.dataset.tab;

                document
                    .querySelectorAll(
                        ".tab-button[data-tab]"
                    )
                    .forEach(item => {
                        item.classList.remove("active");
                    });

                document
                    .querySelectorAll(".panel")
                    .forEach(panel => {
                        panel.classList.remove("active");
                    });

                button.classList.add("active");

                const panel =
                    $(`tab-${target}`);

                if (panel) {
                    panel.classList.add("active");
                }
            }
        );
    });


// ========================================
// POBIERANIE KONTA
// ========================================

async function loadAccount() {

    try {

        const response =
            await fetch(
                `${API}/api/me`,
                {
                    method: "GET",
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();

        if (
            !response.ok ||
            !data.loggedIn
        ) {

            localStorage.removeItem(
                "mullar_token"
            );

            window.location.href =
                "/login.html";

            return;
        }

        const user =
            data.user;

        const username =
            user.username || "Użytkownik";

        const email =
            user.email || "—";

        const plan =
            String(
                user.plan || "free"
            ).toLowerCase();


        // HEADER

        if ($("accountUsername")) {

            $("accountUsername").textContent =
                username;
        }


        // USERNAME CARD

        if ($("accountUsernameCard")) {

            $("accountUsernameCard").textContent =
                username;
        }


        // EMAIL

        if ($("accountEmail")) {

            $("accountEmail").textContent =
                email;
        }


        // PLAN

        let planText =
            plan.toUpperCase();


        if (
            plan === "pro" &&
            user.plan_expires_at
        ) {

            const expiration =
                new Date(
                    user.plan_expires_at
                );


            if (
                !Number.isNaN(
                    expiration.getTime()
                )
            ) {

                planText +=
                    ` — do ${expiration.toLocaleDateString(
                        "pl-PL"
                    )}`;
            }
        }


        if (
            plan === "premium"
        ) {

            planText =
                "PREMIUM — BEZTERMINOWO";
        }


        if ($("accountPlan")) {

            $("accountPlan").textContent =
                planText;
        }


        // PUBLIC PROFILE

        const profileUrl =
            `/profile.html?user=${encodeURIComponent(
                username
            )}`;


        if ($("publicProfileLink")) {

            $("publicProfileLink").href =
                profileUrl;
        }


        if ($("publicProfileButton")) {

            $("publicProfileButton").href =
                profileUrl;
        }


        if ($("profilePreview")) {

            $("profilePreview").src =
                profileUrl;
        }


    } catch (error) {

        console.error(
            "Account error:",
            error
        );

        if ($("accountUsername")) {

            $("accountUsername").textContent =
                "Błąd";
        }

        if ($("accountEmail")) {

            $("accountEmail").textContent =
                error.message;
        }
    }
}


// ========================================
// AKTYWACJA KODU
// ========================================

const redeemButton =
    $("redeemBtn");

if (redeemButton) {

    redeemButton.addEventListener(
        "click",
        async () => {

            const code =
                $("activationCode")
                    ?.value
                    .trim()
                    .toUpperCase();


            const message =
                $("redeemMessage");


            if (!code) {

                if (message) {
                    message.textContent =
                        "Wpisz kod aktywacyjny.";
                }

                return;
            }


            if (message) {

                message.textContent =
                    "Aktywowanie...";
            }


            try {

                const response =
                    await fetch(
                        `${API}/api/redeem-code`,
                        {
                            method: "POST",

                            headers: {
                                Authorization:
                                    `Bearer ${token}`,

                                "Content-Type":
                                    "application/json"
                            },

                            body:
                                JSON.stringify({
                                    code
                                })
                        }
                    );


                const data =
                    await response.json();


                if (!response.ok) {

                    if (message) {
                        message.textContent =
                            data.message ||
                            "Nie udało się aktywować kodu.";
                    }

                    return;
                }


                if (message) {

                    message.textContent =
                        data.message ||
                        "Kod został aktywowany.";
                }


                $("activationCode").value =
                    "";


                await loadAccount();


            } catch (error) {

                console.error(
                    "Redeem error:",
                    error
                );

                if (message) {

                    message.textContent =
                        "Nie udało się połączyć z serwerem.";
                }
            }
        }
    );
}


// ========================================
// WYLOGOWANIE
// ========================================

const logoutButton =
    $("logoutButton");


if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                await fetch(
                    `${API}/api/logout`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`
                        }
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );
            }


            localStorage.removeItem(
                "mullar_token"
            );


            window.location.href =
                "/login.html";
        }
    );
}


// ========================================
// START
// ========================================

loadAccount();