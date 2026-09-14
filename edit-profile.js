const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const token =
    localStorage.getItem(
        "mullar_token"
    );


const $ =
    id =>
        document.getElementById(id);


if (!token) {
    window.location.href =
        "/login.html";
}


let currentUser = null;


const form =
    $("profileForm");


function plan() {

    return String(
        currentUser?.plan ||
        "free"
    ).toLowerCase();
}


function isPro() {

    return (
        plan() === "pro" ||
        plan() === "premium"
    );
}


function isPremium() {

    return plan() === "premium";
}


function setStatus(
    message,
    type = ""
) {

    const element =
        $("saveStatus");

    if (!element) {
        return;
    }

    element.textContent =
        message;

    element.className =
        "save-status";

    if (type) {
        element.classList.add(
            type
        );
    }
}


function parseLinks(
    value
) {

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


function renderAvatarPreview(
    url,
    fallback
) {

    const preview =
        $("avatarPreview");

    preview.innerHTML =
        "";


    if (url) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            url;

        image.alt =
            "Avatar";

        image.onerror =
            () => {

                preview.innerHTML =
                    "";

                preview.textContent =
                    fallback;
            };

        preview.appendChild(
            image
        );

    } else {

        preview.textContent =
            fallback;
    }
}


function renderLinks() {

    const container =
        $("linksList");

    container.innerHTML =
        "";


    const limit =
        isPremium()
            ? 5
            : isPro()
                ? 2
                : 0;


    if (!limit) {

        container.innerHTML = `
            <div class="link-item">
                <strong>
                    Dodatkowe linki są dostępne od PRO.
                </strong>

                <div class="hint">
                    Aktywuj plan w panelu konta.
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


        const item =
            document.createElement(
                "div"
            );

        item.className =
            "link-item";


        item.innerHTML = `
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

                <div>

                    <label>
                        NAZWA
                    </label>

                    <input
                        id="link_title_${i}"
                        type="text"
                        placeholder="Moja strona"
                    >

                </div>

                <div>

                    <label>
                        URL
                    </label>

                    <input
                        id="link_url_${i}"
                        type="url"
                        placeholder="https://..."
                    >

                </div>

                ${
                    isPremium()
                        ? `
                            <div>

                                <label>
                                    IKONA URL
                                </label>

                                <input
                                    id="link_icon_${i}"
                                    type="url"
                                    placeholder="https://..."
                                >

                            </div>
                        `
                        : ""
                }

            </div>
        `;


        container.appendChild(
            item
        );


        $(`link_title_${i}`).value =
            link.title || "";


        $(`link_url_${i}`).value =
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


function updateRestrictions() {

    const pro =
        isPro();

    const premium =
        isPremium();


    $("likes_enabled").disabled =
        !pro;

    if (!pro) {
        $("likes_enabled").checked =
            false;
    }


    $("profile_color").disabled =
        !pro;

    $("name_color").disabled =
        !pro;

    $("glow1_color").disabled =
        !pro;

    $("glow2_color").disabled =
        !pro;


    $("neon_name").disabled =
        !premium;

    if (!premium) {
        $("neon_name").checked =
            false;
    }


    $("music_url").disabled =
        !premium;

    if (!premium) {
        $("music_url").value =
            "";
    }


    $("profile_animation").disabled =
        !premium;

    if (!premium) {

        $("profile_animation").value =
            "none";

        $("animationHint").textContent =
            "Animacje są dostępne dla Premium.";

    } else {

        $("animationHint").textContent =
            "Wybierz animację Premium.";

    }


    $("likesHint").textContent =
        pro
            ? "Odwiedzający mogą polubić Twój profil."
            : "Dostępne dla PRO i Premium.";
}


async function getMe() {

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

        return null;
    }


    return data.user;
}


async function uploadAvatar(
    file
) {

    const formData =
        new FormData();

    formData.append(
        "file",
        file
    );


    const response =
        await fetch(
            `${API}/api/profile/avatar`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${token}`
                },

                body:
                    formData
            }
        );


    const data =
        await response.json();


    if (!response.ok) {

        throw new Error(
            data.message ||
            "Nie udało się przesłać avatara."
        );
    }


    if (!data.url) {

        throw new Error(
            "Serwer nie zwrócił adresu avatara."
        );
    }


    return data.url;
}


function collectLinks() {

    const max =
        isPremium()
            ? 5
            : isPro()
                ? 2
                : 0;


    const links = [];


    for (
        let i = 0;
        i < max;
        i++
    ) {

        const title =
            $(`link_title_${i}`)
                ?.value
                .trim() || "";

        const url =
            $(`link_url_${i}`)
                ?.value
                .trim() || "";

        const icon =
            $(`link_icon_${i}`)
                ?.value
                .trim() || "";


        if (
            !title &&
            !url
        ) {
            continue;
        }


        if (
            !title ||
            !url
        ) {

            throw new Error(
                `Uzupełnij nazwę i URL linku ${i + 1}.`
            );
        }


        links.push({
            title,
            url,
            icon:
                isPremium()
                    ? icon
                    : ""
        });
    }


    return links;
}


async function saveProfile(
    event
) {

    event.preventDefault();


    const button =
        $("saveBtn");


    button.disabled =
        true;

    button.textContent =
        "Zapisywanie...";


    try {

        let avatar =
            currentUser.avatar ||
            "";


        const avatarFile =
            $("avatarFile")
                .files?.[0];


        if (avatarFile) {

            setStatus(
                "Przesyłanie avatara..."
            );


            avatar =
                await uploadAvatar(
                    avatarFile
                );
        }


        const payload = {

            bio:
                $("bio").value.trim(),

            discord:
                $("discord")
                    .value
                    .trim(),

            github:
                $("github")
                    .value
                    .trim(),

            instagram:
                $("instagram")
                    .value
                    .trim(),

            avatar,

            banner:
                currentUser.banner ||
                "",

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
                $("profile_color").value,

            name_color:
                $("name_color").value,

            neon_name:
                isPremium() &&
                $("neon_name").checked
                    ? 1
                    : 0,

            glow1_color:
                $("glow1_color").value,

            glow2_color:
                $("glow2_color").value,

            extra_links:
                collectLinks(),

            music_url:
                isPremium()
                    ? $("music_url")
                        .value
                        .trim()
                    : "",

            profile_animation:
                isPremium()
                    ? $("profile_animation")
                        .value
                    : "none"
        };


        setStatus(
            "Zapisywanie profilu..."
        );


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


        currentUser =
            await getMe();


        if (!currentUser) {
            return;
        }


        renderAvatarPreview(
            currentUser.avatar,
            String(
                currentUser.username ||
                "M"
            )
                .charAt(0)
                .toUpperCase()
        );


        updateRestrictions();

        renderLinks();


        $("avatarFile").value =
            "";


        $("profile_animation").value =
            currentUser.profile_animation ||
            "none";


        setStatus(
            "✓ Profil został zapisany.",
            "ok"
        );


    } catch (error) {

        console.error(
            "Mullar profile save:",
            error
        );


        setStatus(
            `✕ ${error.message}`,
            "error"
        );

    } finally {

        button.disabled =
            false;

        button.textContent =
            "Zapisz zmiany";
    }
}


$("avatarFile")
    .addEventListener(
        "change",
        () => {

            const file =
                $("avatarFile")
                    .files?.[0];


            if (!file) {
                return;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                setStatus(
                    "✕ Avatar może mieć maksymalnie 5 MB.",
                    "error"
                );

                $("avatarFile").value =
                    "";

                return;
            }


            const allowed =
                new Set([
                    "image/jpeg",
                    "image/png",
                    "image/webp",
                    "image/gif"
                ]);


            if (
                !allowed.has(
                    file.type
                )
            ) {

                setStatus(
                    "✕ Dozwolone są JPG, PNG, WEBP i GIF.",
                    "error"
                );

                $("avatarFile").value =
                    "";

                return;
            }


            const reader =
                new FileReader();


            reader.onload =
                event => {

                    renderAvatarPreview(
                        event.target.result,
                        "M"
                    );
                };


            reader.readAsDataURL(
                file
            );
        }
    );


document
    .querySelectorAll(
        ".nav-btn"
    )
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


                $(
                    `section-${target}`
                )?.classList.add(
                    "active"
                );


                if (
                    target ===
                    "appearance"
                ) {

                    history.replaceState(
                        null,
                        "",
                        "#appearance"
                    );
                } else {

                    history.replaceState(
                        null,
                        "",
                        "#basic"
                    );
                }
            }
        );
    });


async function init() {

    try {

        currentUser =
            await getMe();


        if (!currentUser) {
            return;
        }


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


        $("name_color").value =
            currentUser.name_color ||
            "#ffffff";


        $("glow1_color").value =
            currentUser.glow1_color ||
            "#6b4cff";


        $("glow2_color").value =
            currentUser.glow2_color ||
            "#00aaff";


        $("neon_name").checked =
            Number(
                currentUser.neon_name || 0
            ) === 1;


        $("music_url").value =
            currentUser.music_url || "";


        $("profile_animation").value =
            currentUser.profile_animation ||
            "none";


        $("profileLink").href =
            `/profile.html?user=${encodeURIComponent(
                currentUser.username
            )}`;


        renderAvatarPreview(
            currentUser.avatar,
            String(
                currentUser.username ||
                "M"
            )
                .charAt(0)
                .toUpperCase()
        );


        updateRestrictions();

        renderLinks();


        if (
            window.location.hash ===
            "#appearance"
        ) {

            document
                .querySelector(
                    '[data-section="appearance"]'
                )
                ?.click();
        }


        form.addEventListener(
            "submit",
            saveProfile
        );


    } catch (error) {

        console.error(
            "Mullar editor init:",
            error
        );


        setStatus(
            `✕ ${error.message}`,
            "error"
        );
    }
}


init();