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

const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";

const token =
    localStorage.getItem("mullar_token");


async function loadAccount() {

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
                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );

        const data =
            await response.json();


        if (!response.ok || !data.loggedIn) {

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
            (user.plan || "free")
                .toUpperCase();


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
// LOGOUT
// ========================================

logoutButton.addEventListener(
    "click",
    async () => {

        try {

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


// ========================================
// START
// ========================================

loadAccount();