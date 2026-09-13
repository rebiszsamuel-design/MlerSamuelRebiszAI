const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const token =
    localStorage.getItem("mullar_token");

if (!token) {
    window.location.href = "/login.html";
}

const $ = (id) =>
    document.getElementById(id);


async function getAccount() {

    const response =
        await fetch(
            `${API}/api/me`,
            {
                headers: {
                    Authorization:
                        `Bearer ${token}`
                }
            }
        );

    let data;

    try {
        data =
            await response.json();
    } catch {
        throw new Error(
            "Nieprawidłowa odpowiedź serwera."
        );
    }

    if (
        !response.ok ||
        !data.loggedIn
    ) {

        localStorage.removeItem(
            "mullar_token"
        );

        window.location.href =
            "/login.html";

        return null;
    }

    return data.user;
}


async function loadAccount() {

    try {

        const user =
            await getAccount();

        if (!user) {
            return;
        }

        const username =
            user.username;

        $("accountUsername").textContent =
            username;

        $("accountUsernameCard").textContent =
            username;

        $("accountEmail").textContent =
            user.email || "—";

        const plan =
            String(
                user.plan || "free"
            ).toLowerCase();

        let planText =
            plan.toUpperCase();

        if (
            plan === "pro" &&
            user.plan_expires_at
        ) {

            const date =
                new Date(
                    user.plan_expires_at
                );

            if (!Number.isNaN(date.getTime())) {

                planText +=
                    ` — do ${date.toLocaleDateString(
                        "pl-PL"
                    )}`;
            }
        }

        if (plan === "premium") {
            planText =
                "PREMIUM — BEZTERMINOWO";
        }

        $("accountPlan").textContent =
            planText;

        const profileUrl =
            `/profile.html?user=${encodeURIComponent(
                username
            )}`;

        $("publicProfileLink").href =
            profileUrl;

        $("publicProfileButton").href =
            profileUrl;

        $("profilePreview").src =
            profileUrl;

    } catch (error) {

        console.error(error);

        $("accountUsername").textContent =
            "Błąd";

        $("accountPlan").textContent =
            error.message;
    }
}


// ========================================
// TABY
// ========================================

document
    .querySelectorAll(".tab-button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".tab-button"
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

                const target =
                    document.getElementById(
                        `tab-${button.dataset.tab}`
                    );

                if (target) {
                    target.classList.add(
                        "active"
                    );
                }
            }
        );

    });


// ========================================
// AKTYWACJA
// ========================================

$("redeemButton")
    .addEventListener(
        "click",
        async () => {

            const code =
                $("activationCode")
                    .value
                    .trim()
                    .toUpperCase();

            const message =
                $("redeemMessage");

            if (!code) {

                message.textContent =
                    "Wpisz kod.";

                return;
            }

            message.textContent =
                "Aktywowanie...";

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

                    message.textContent =
                        data.message ||
                        "Nie udało się aktywować kodu.";

                    return;
                }

                message.textContent =
                    data.message ||
                    "Aktywowano.";

                $("activationCode").value =
                    "";

                await loadAccount();

            } catch (error) {

                console.error(error);

                message.textContent =
                    "Nie udało się połączyć z serwerem.";
            }
        }
    );


// ========================================
// WYLOGOWANIE
// ========================================

$("logoutButton")
    .addEventListener(
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

            } catch {
                // Nawet jeśli API nie odpowie,
                // lokalna sesja zostanie usunięta.
            }

            localStorage.removeItem(
                "mullar_token"
            );

            window.location.href =
                "/login.html";
        }
    );


loadAccount();