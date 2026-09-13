const generateProButton =
    document.getElementById("generatePro");

const generatePremiumButton =
    document.getElementById("generatePremium");

const result =
    document.getElementById("result");


async function generateCode(plan) {

    result.className =
        "admin-result";

    result.textContent =
        "Generowanie kodu...";

    try {

        const response =
            await fetch(
                "/api/admin/generate-code",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        plan: plan
                    })
                }
            );

        const data =
            await response.json();

        if (!data.success) {

            result.textContent =
                data.message;

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
            "Wystąpił błąd serwera.";
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