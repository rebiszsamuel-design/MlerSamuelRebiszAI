const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";

const welcome =
    document.getElementById("welcome");

const accountInfo =
    document.getElementById("accountInfo");

const logoutButton =
    document.getElementById("logoutButton");

const redeemForm =
    document.getElementById("redeemForm");

const activationCode =
    document.getElementById("activationCode");

const redeemMessage =
    document.getElementById("redeemMessage");

const profileLink =
    document.getElementById("profileLink");


function getToken() {
    return localStorage.getItem(
        "mullar_token"
    );
}


// ========================================
// LOAD ACCOUNT
// ========================================

async function loadAccount() {

    const token =
        getToken();

    if (!token) {

        window.location.href =
            "/login.html";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/me`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
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


        welcome.textContent =
            `Cześć, ${user.username}!`;


        let planText =
            String(
                user.plan || "free"
            ).toUpperCase();


        if (
            user.plan === "pro" &&
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
                    ` — ważny do ${expiration.toLocaleDateString(
                        "pl-PL"
                    )}`;
            }
        }


        if (
            user.plan === "premium"
        ) {

            planText =
                "PREMIUM — NA ZAWSZE";
        }


        accountInfo.innerHTML = `
            Plan:
            <strong>${planText}</strong>
            <br>
            Email:
            ${user.email}
        `;


        if (profileLink) {

            profileLink.href =
                `/profile.html?user=${encodeURIComponent(
                    user.username
                )}`;
        }


    } catch (error) {

        console.error(
            "Account error:",
            error
        );

        accountInfo.textContent =
            "Nie udało się pobrać danych konta.";
    }
}


// ========================================
// REDEEM CODE
// ========================================

if (redeemForm) {

    redeemForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();


            const token =
                getToken();


            if (!token) {

                window.location.href =
                    "/login.html";

                return;
            }


            const code =
                activationCode.value
                    .trim()
                    .toUpperCase();


            if (!code) {

                redeemMessage.textContent =
                    "Wpisz kod aktywacyjny.";

                return;
            }


            redeemMessage.textContent =
                "Sprawdzanie kodu...";


            try {

                const response =
                    await fetch(
                        `${API_URL}/api/redeem-code`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`
                            },

                            body:
                                JSON.stringify({
                                    code
                                })
                        }
                    );


                const data =
                    await response.json();


                if (
                    !response.ok ||
                    !data.success
                ) {

                    redeemMessage.textContent =
                        data.message ||
                        "Nie udało się aktywować kodu.";

                    return;
                }


                redeemMessage.textContent =
                    `✓ ${data.message}`;


                activationCode.value =
                    "";


                await loadAccount();

            } catch (error) {

                console.error(
                    "Redeem error:",
                    error
                );

                redeemMessage.textContent =
                    "Nie udało się połączyć z serwerem.";
            }
        }
    );
}


// ========================================
// LOGOUT
// ========================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async () => {

            const token =
                getToken();


            try {

                if (token) {

                    await fetch(
                        `${API_URL}/api/logout`,
                        {
                            method: "POST",

                            headers: {
                                "Authorization":
                                    `Bearer ${token}`
                            }
                        }
                    );
                }

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