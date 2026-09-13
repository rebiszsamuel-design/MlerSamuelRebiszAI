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


// ================================
// LOAD ACCOUNT
// ================================

async function loadAccount() {

    try {

        const response =
            await fetch("/api/me");

        const data =
            await response.json();

        if (!data.loggedIn) {

            window.location.href =
                "/login.html";

            return;
        }

        const user =
            data.user;

        welcome.textContent =
            `Cześć, ${user.username}!`;

        let planText =
            user.plan.toUpperCase();

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

        if (user.plan === "premium") {

            planText =
                "PREMIUM — NA ZAWSZE";
        }

        accountInfo.innerHTML = `
            Plan:
            <strong>
                ${planText}
            </strong>

            <br>

            Email:
            ${user.email}
        `;


        const profileLink =
            document.getElementById(
                "profileLink"
            );

        if (profileLink) {

            profileLink.href =
                `/u/${encodeURIComponent(
                    user.username
                )}`;
        }

    } catch (error) {

        console.error(error);

        accountInfo.textContent =
            "Nie udało się pobrać danych konta.";
    }
}


// ================================
// REDEEM CODE
// ================================

redeemForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const code =
            activationCode.value.trim();

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
                    "/api/redeem-code",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            code: code
                        })
                    }
                );

            const data =
                await response.json();

            if (!data.success) {

                redeemMessage.textContent =
                    data.message;

                return;
            }

            redeemMessage.textContent =
                `✓ ${data.message}`;

            activationCode.value = "";

            await loadAccount();

        } catch (error) {

            console.error(error);

            redeemMessage.textContent =
                "Wystąpił błąd podczas aktywacji kodu.";
        }
    }
);


// ================================
// LOGOUT
// ================================

logoutButton.addEventListener(
    "click",
    async () => {

        await fetch(
            "/api/logout",
            {
                method: "POST"
            }
        );

        window.location.href =
            "/login.html";
    }
);


// ================================
// START
// ================================

loadAccount();