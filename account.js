const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const token =
    localStorage.getItem("mullar_token");

const $ =
    (id) => document.getElementById(id);


// ========================================
// SESJA
// ========================================

if (!token) {
    window.location.href =
        "/login.html";
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
                        item.classList.remove(
                            "active"
                        );
                    });


                document
                    .querySelectorAll(
                        ".panel"
                    )
                    .forEach(panel => {
                        panel.classList.remove(
                            "active"
                        );
                    });


                button.classList.add(
                    "active"
                );


                const panel =
                    $(`tab-${target}`);


                if (panel) {
                    panel.classList.add(
                        "active"
                    );
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
            !data.loggedIn ||
            !data.user
        ) {

            localStorage.removeItem(
                "mullar_token"
            );

            window.location.href =
                "/login.html";

            return null;
        }


        const user =
            data.user;


        const username =
            user.username ||
            "Użytkownik";


        const email =
            user.email ||
            "—";


        const plan =
            String(
                user.plan ||
                "free"
            ).toLowerCase();


        // USERNAME

        const usernameHeader =
            $("accountUsername");

        if (usernameHeader) {

            usernameHeader.textContent =
                username;
        }


        const usernameCard =
            $("accountUsernameCard");

        if (usernameCard) {

            usernameCard.textContent =
                username;
        }


        // EMAIL

        const emailElement =
            $("accountEmail");

        if (emailElement) {

            emailElement.textContent =
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

                planText =
                    `PRO — do ${expiration.toLocaleDateString(
                        "pl-PL"
                    )}`;
            }
        }


        if (plan === "premium") {

            planText =
                "PREMIUM";
        }


        const planElement =
            $("accountPlan");

        if (planElement) {

            planElement.textContent =
                planText;
        }


        // PUBLICZNY PROFIL

        const profileUrl =
            `/profile.html?user=${encodeURIComponent(
                username
            )}`;


        const publicProfileLink =
            $("publicProfileLink");

        if (publicProfileLink) {

            publicProfileLink.href =
                profileUrl;
        }


        const publicProfileButton =
            $("publicProfileButton");

        if (publicProfileButton) {

            publicProfileButton.href =
                profileUrl;
        }


        const preview =
            $("profilePreview");

        if (preview) {

            preview.src =
                profileUrl;
        }


        return user;

    } catch (error) {

        console.error(
            "Mullar account error:",
            error
        );


        const usernameElement =
            $("accountUsername");

        if (usernameElement) {

            usernameElement.textContent =
                "Błąd";
        }


        const emailElement =
            $("accountEmail");

        if (emailElement) {

            emailElement.textContent =
                "Nie udało się pobrać danych.";
        }


        return null;
    }
}


// ========================================
// AKTYWACJA PRO / PREMIUM
// ========================================

const redeemButton =
    $("redeemButton");


if (redeemButton) {

    redeemButton.addEventListener(
        "click",
        async () => {

            const input =
                $("activationCode");

            const message =
                $("redeemMessage");


            if (!input || !message) {
                return;
            }


            const code =
                input.value
                    .trim()
                    .toUpperCase();


            if (!code) {

                message.textContent =
                    "Wpisz kod aktywacyjny.";

                return;
            }


            redeemButton.disabled =
                true;

            redeemButton.textContent =
                "Aktywowanie...";

            message.textContent =
                "Sprawdzanie kodu...";


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


                let data = null;


                try {

                    data =
                        await response.json();

                } catch {

                    throw new Error(
                        `Serwer zwrócił nieprawidłową odpowiedź HTTP ${response.status}.`
                    );
                }


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        data.error ||
                        `Nie udało się aktywować kodu. HTTP ${response.status}`
                    );
                }


                message.textContent =
                    data.message ||
                    "Plan został aktywowany.";


                input.value = "";


                /*
                  Pobieramy konto ponownie,
                  żeby od razu pokazać nowy plan.
                */

                await loadAccount();


                /*
                  Automatycznie przechodzimy
                  do zakładki wyglądu,
                  żeby od razu można było używać
                  funkcji nowego planu.
                */

                const appearanceButton =
                    document.querySelector(
                        '.tab-button[data-tab="appearance"]'
                    );


                if (appearanceButton) {

                    appearanceButton.click();
                }

            } catch (error) {

                console.error(
                    "Redeem error:",
                    error
                );


                message.textContent =
                    `✕ ${error.message}`;
            } finally {

                redeemButton.disabled =
                    false;

                redeemButton.textContent =
                    "Aktywuj";
            }
        }
    );
}


// ========================================
// ENTER = AKTYWUJ
// ========================================

const activationInput =
    $("activationCode");


if (activationInput) {

    activationInput.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Enter"
            ) {

                event.preventDefault();

                redeemButton?.click();
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