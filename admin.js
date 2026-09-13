const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";

const generateProButton =
    document.getElementById("generatePro");

const generatePremiumButton =
    document.getElementById("generatePremium");

const result =
    document.getElementById("result");


async function generateCode(plan) {

    const adminKey =
        prompt("Podaj klucz administratora:");

    if (!adminKey) {
        result.textContent =
            "Anulowano.";
        return;
    }


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

                    body:
                        JSON.stringify({
                            plan
                        })
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            result.textContent =
                data.message ||
                "Nie udało się wygenerować kodu.";

            return;
        }


        if (!data.success) {

            result.textContent =
                data.message ||
                "Nie udało się wygenerować kodu.";

            return;
        }


        result.innerHTML = `
            <div class="generated-code">
                <div>
                    Kod ${plan === "pro"
                        ? "PRO"
                        : "PREMIUM"}:
                </div>

                <strong>
                    ${data.code}
                </strong>

                <button
                    type="button"
                    id="copyCode"
                >
                    Kopiuj kod
                </button>
            </div>
        `;


        const copyButton =
            document.getElementById(
                "copyCode"
            );


        if (copyButton) {

            copyButton.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator.clipboard.writeText(
                            data.code
                        );

                        copyButton.textContent =
                            "Skopiowano ✓";

                    } catch (error) {

                        copyButton.textContent =
                            "Nie udało się skopiować";
                    }
                }
            );
        }

    } catch (error) {

        console.error(
            "Generate code error:",
            error
        );

        result.textContent =
            "Nie udało się połączyć z serwerem.";
    }
}


if (generateProButton) {

    generateProButton.addEventListener(
        "click",
        () => {
            generateCode("pro");
        }
    );
}


if (generatePremiumButton) {

    generatePremiumButton.addEventListener(
        "click",
        () => {
            generateCode("premium");
        }
    );
}