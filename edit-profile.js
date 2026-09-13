const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const token =
    localStorage.getItem(
        "mullar_token"
    );

if (!token) {

    window.location.href =
        "/login.html";
}


const $ =
    (id) => document.getElementById(id);


const form =
    $("profileForm");


let currentUser =
    null;


// ========================================
// PLAN
// ========================================

function getPlan() {

    return String(
        currentUser?.plan ||
        "free"
    ).toLowerCase();
}


function isPro() {

    return (
        getPlan() === "pro" ||
        getPlan() === "premium"
    );
}


function isPremium() {

    return (
        getPlan() === "premium"
    );
}


// ========================================
// KOLORY
// ========================================

function validColor(value) {

    return /^#[0-9a-fA-F]{6}$/.test(
        value
    );
}


function setupColor(
    pickerId,
    defaultValue
) {

    const picker =
        $(pickerId);

    if (!picker) {
        return;
    }

    picker.value =
        validColor(
            picker.value
        )
            ? picker.value
            : defaultValue;
}


// ========================================
// DODATKOWE LINKI
// ========================================

function parseLinks(value) {

    if (Array.isArray(value)) {
        return value;
    }

    try {

        const parsed =
            JSON.parse(
                value || "[]"
            );

        return Array.isArray(parsed)
            ? parsed
            : [];

    } catch {

        return [];
    }
}


function renderLinks() {

    const container =
        $("linksList");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    let limit = 0;


    if (isPremium()) {

        limit = 5;

    } else if (isPro()) {

        limit = 2;
    }


    if (limit === 0) {

        container.innerHTML = `
            <div class="link-item">
                <strong>
                    Dodatkowe linki są dostępne od PRO.
                </strong>

                <div class="hint">
                    Aktywuj PRO lub Premium w panelu konta.
                </div>
            </div>
        `;

        return;
    }


    const links =
        parseLinks(
            currentUser.extra_links
        );


    for (
        let i = 0;
        i < limit;
        i++
    ) {

        const link =
            links[i] || {};


        const box =
            document.createElement(
                "div"
            );

        box.className =
            "link-item";


        box.innerHTML = `
            <div class="link-head">

                <span class="link-number">
                    LINK ${i + 1}
                </span>

                <span class="badge">
                    ${
                        isPremium()
                            ? "PREMIUM"
                            : "PRO"
                    }
                </span>

            </div>

            <div class="fields two">

                <div class="field">

                    <label>
                        NAZWA
                    </label>

                    <input
                        id="link_title_${i}"
                        type="text"
                        value=""
                        placeholder="Moja strona"
                    >

                </div>


                <div class="field">

                    <label>
                        URL
                    </label>

                    <input
                        id="link_url_${i}"
                        type="url"
                        value=""
                        placeholder="https://..."
                    >

                </div>

                ${
                    isPremium()
                        ? `
                            <div class="field">

                                <label>
                                    IKONA URL
                                </label>

                                <input
                                    id="link_icon_${i}"
                                    type="url"
                                    value=""
                                    placeholder="https://..."
                                >

                            </div>
                        `
                        : ""
                }

            </div>
        `;


        container.appendChild(
            box
        );


        $(
            `link_title_${i}`
        ).value =
            link.title || "";


        $(
            `link_url_${i}`
        ).value =
            link.url || "";


        if (
            isPremium() &&
            $(`link_icon_${i}`)
        ) {

            $(`link_icon_${i}`).value =
                link.icon || "";
        }
    }
}


// ========================================
// WCZYTANIE DANYCH
// ========================================

async function loadProfile() {

    try {

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


        currentUser =
            data.user;


        $("bio").value =
            currentUser.bio || "";


        $("discord").value =
            currentUser.discord || "";


        $("github").value =
            currentUser.github || "";


        $("instagram").value =
            currentUser.instagram || "";


        $("og_hidden").checked =
            Number(
                currentUser.og_hidden || 0
            ) === 1;


        $("views_enabled").checked =
            Number(
                currentUser.views_enabled ?? 1
            ) === 1;


        $("likes_enabled").checked =
            Number(
                currentUser.likes_enabled || 0
            ) === 1;


        $("profile_color").value =
            currentUser.profile_color ||
            "#0e0e0e";


        $("glow1_color").value =
            currentUser.glow1_color ||
            "#6b4cff";


        $("glow2_color").value =
            currentUser.glow2_color ||
            "#00aaff";


        $("name_color").value =
            currentUser.name_color ||
            "#ffffff";


        $("neon_name").checked =
            Number(
                currentUser.neon_name || 0
            ) === 1;


        $("music_url").value =
            currentUser.music_url || "";


        updateRestrictions();

        renderLinks();


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        setMessage(
            error.message ||
            "Nie udało się pobrać profilu.",
            true
        );
    }
}


// ========================================
// OGRANICZENIA PLANÓW
// ========================================

function updateRestrictions() {

    const pro =
        isPro();

    const premium =
        isPremium();


    const likes =
        $("likes_enabled");

    const neon =
        $("neon_name");

    const music =
        $("music_url");


    if (likes) {

        likes.disabled =
            !pro;

        if (!pro) {
            likes.checked =
                false;
        }
    }


    if (neon) {

        neon.disabled =
            !premium;

        if (!premium) {
            neon.checked =
                false;
        }
    }


    if (music) {

        music.disabled =
            !premium;

        if (!premium) {
            music.value =
                "";
        }
    }


    [
        "profile_color",
        "glow1_color",
        "glow2_color",
        "name_color"
    ].forEach(
        id => {

            const element =
                $(id);

            if (element) {

                element.disabled =
                    !pro;
            }
        }
    );
}


// ========================================
// LINKI
// ========================================

function collectLinks() {

    let limit =
        isPremium()
            ? 5
            : isPro()
                ? 2
                : 0;


    const links = [];


    for (
        let i = 0;
        i < limit;
        i++
    ) {

        const titleInput =
            $(`link_title_${i}`);

        const urlInput =
            $(`link_url_${i}`);

        const iconInput =
            $(`link_icon_${i}`);


        if (!titleInput || !urlInput) {
            continue;
        }


        const title =
            titleInput.value.trim();

        const url =
            urlInput.value.trim();

        const icon =
            iconInput
                ? iconInput.value.trim()
                : "";


        if (!title && !url) {
            continue;
        }


        if (!title || !url) {

            throw new Error(
                `Uzupełnij nazwę i URL linku ${i + 1}.`
            );
        }


        links.push({
            title,
            url,
            icon
        });
    }


    return links;
}


// ========================================
// KOMUNIKAT
// ========================================

function setMessage(
    text,
    error = false
) {

    const element =
        $("saveStatus");


    if (!element) {
        return;
    }


    element.textContent =
        text;


    element.className =
        error
            ? "save-status error"
            : "save-status ok";
}


// ========================================
// ZAPIS
// ========================================

form.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const saveButton =
            $("saveBtn");


        saveButton.disabled =
            true;

        saveButton.textContent =
            "Zapisywanie...";


        try {

            const payload = {

                bio:
                    $("bio").value.trim(),

                discord:
                    $("discord").value.trim(),

                github:
                    $("github").value.trim(),

                instagram:
                    $("instagram").value.trim(),

                og_hidden:
                    $("og_hidden").checked
                        ? 1
                        : 0,

                views_enabled:
                    $("views_enabled").checked
                        ? 1
                        : 0,

                likes_enabled:
                    isPro() &&
                    $("likes_enabled").checked
                        ? 1
                        : 0,

                profile_color:
                    isPro()
                        ? $("profile_color").value
                        : "#0e0e0e",

                glow1_color:
                    isPro()
                        ? $("glow1_color").value
                        : "#6b4cff",

                glow2_color:
                    isPro()
                        ? $("glow2_color").value
                        : "#00aaff",

                name_color:
                    isPro()
                        ? $("name_color").value
                        : "#ffffff",

                neon_name:
                    isPremium() &&
                    $("neon_name").checked
                        ? 1
                        : 0,

                extra_links:
                    collectLinks(),

                music_url:
                    isPremium()
                        ? $("music_url")
                            .value
                            .trim()
                        : ""
            };


            const response =
                await fetch(
                    `${API}/api/profile/update`,
                    {
                        method: "POST",

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    data.error ||
                    `Błąd HTTP ${response.status}`
                );
            }


            setMessage(
                "✓ Profil został zapisany!"
            );


            currentUser =
                await (
                    await fetch(
                        `${API}/api/me`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`
                            }
                        }
                    )
                ).json();


            if (
                currentUser.user
            ) {

                currentUser =
                    currentUser.user;
            }


            updateRestrictions();

            renderLinks();


        } catch (error) {

            console.error(
                "Save error:",
                error
            );

            setMessage(
                error.message ||
                "Nie udało się zapisać profilu.",
                true
            );

        } finally {

            saveButton.disabled =
                false;

            saveButton.textContent =
                "Zapisz zmiany";
        }
    }
);


// ========================================
// NAWIGACJA EDYTORA
// ========================================

document
    .querySelectorAll(".nav-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const target =
                    button.dataset.section;


                document
                    .querySelectorAll(
                        ".nav-btn"
                    )
                    .forEach(item => {
                        item.classList.remove(
                            "active"
                        );
                    });


                document
                    .querySelectorAll(
                        ".section"
                    )
                    .forEach(section => {
                        section.classList.remove(
                            "active"
                        );
                    });


                button.classList.add(
                    "active"
                );


                const section =
                    $(
                        `section-${target}`
                    );


                if (section) {

                    section.classList.add(
                        "active"
                    );
                }

            }
        );
    });


// ========================================
// START
// ========================================

setupColor(
    "profile_color",
    "#0e0e0e"
);

setupColor(
    "glow1_color",
    "#6b4cff"
);

setupColor(
    "glow2_color",
    "#00aaff"
);

setupColor(
    "name_color",
    "#ffffff"
);


loadProfile();