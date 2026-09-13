const generateProButton =
    document.getElementById("generatePro");

const generatePremiumButton =
    document.getElementById("generatePremium");

const result =
    document.getElementById("result");

const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";

async function generateCode(plan) {

    const adminKey =
        prompt("Podaj klucz administratora:");

    if (!adminKey) {
        result.textContent =
            "Anulowano.";
        return;
    }

    result.className =
        "admin-result";

    result.textContent =
        "Generowanie kodu...";

    try {

        const response =
            await fetch(
                `${API_URL}/api/admin/generate-code`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "X-Admin-Key":
                            adminKey
                    },

                    body: JSON.stringify({
                        plan: plan
                    })
                }
            );

        const data =
            await response.json();

        if (!response.ok || !data.success) {

            result.textContent =
                data.message ||
                "Nie udało się wygenerować kodu.";

            return;
        }

        result.className =
            "admin-result success";

        result.innerHTML = `
            Kod ${data.plan.toUpperCase()}:

            <strong class="admin-code">
                ${data.code}
            </strong>
        `;

    } catch (error) {

        console.error(error);

        result.textContent =
            "Nie udało się połączyć z serwerem.";
    }
}


generateProButton.addEventListener(
    "click",
    () => {
        generateCode("pro");
    }
);


generatePremiumButton.addEventListener(
    "click",
    () => {
        generateCode("premium");
    }
);