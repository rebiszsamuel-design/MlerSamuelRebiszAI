const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const params =
    new URLSearchParams(
        window.location.search
    );

const username =
    params.get("user");

const loading =
    document.getElementById("loading");

const errorScreen =
    document.getElementById("errorScreen");

const profileCard =
    document.getElementById("profileCard");

const usernameElement =
    document.getElementById("username");

const handleElement =
    document.getElementById("handle");

const planElement =
    document.getElementById("plan");

const ogBadge =
    document.getElementById("ogBadge");

const avatarElement =
    document.getElementById("avatar");

const bioElement =
    document.getElementById("bio");

const profileLinks =
    document.getElementById("profileLinks");

const profileBanner =
    document.getElementById("profileBanner");

const glow1 =
    document.getElementById("glow1");

const glow2 =
    document.getElementById("glow2");

const viewsStat =
    document.getElementById("viewsStat");

const viewsCount =
    document.getElementById("viewsCount");

const likesStat =
    document.getElementById("likesStat");

const likesCount =
    document.getElementById("likesCount");

const likeButton =
    document.getElementById("likeButton");

const memberSince =
    document.getElementById("memberSince");

const musicPlayer =
    document.getElementById("musicPlayer");

const profileAudio =
    document.getElementById("profileAudio");


let profile = null;


function safeUrl(value) {

    try {

        const url =
            new URL(value);

        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {
            return null;
        }

        return url.href;

    } catch {

        return null;
    }
}


function planClass(plan) {

    const value =
        String(
            plan || "free"
        ).toLowerCase();

    if (value === "premium") {
        return "premium-badge";
    }

    if (value === "pro") {
        return "pro-badge";
    }

    return "free-badge";
}


function loadPlan() {

    const plan =
        String(
            profile.plan || "free"
        ).toLowerCase();

    planElement.textContent =
        plan.toUpperCase();

    planElement.className =
        `badge ${planClass(plan)}`;

}


function renderAvatar() {

    const url =
        safeUrl(profile.avatar);

    avatarElement.innerHTML =
        "";

    if (url) {

        const image =
            document.createElement("img");

        image.src =
            url;

        image.alt =
            profile.username;

        image.onerror =
            () => {

                avatarElement.innerHTML =
                    profile.username
                        .charAt(0)
                        .toUpperCase();
            };

        avatarElement.appendChild(
            image
        );

        return;
    }

    avatarElement.textContent =
        profile.username
            .charAt(0)
            .toUpperCase();
}


function renderLinks() {

    profileLinks.innerHTML =
        "";

    const social = [
        ["Discord", profile.discord],
        ["GitHub", profile.github],
        ["Instagram", profile.instagram]
    ];

    social.forEach(
        ([name, value]) => {

            const url =
                safeUrl(value);

            if (!url) {
                return;
            }

            const link =
                document.createElement("a");

            link.className =
                "profile-link";

            link.href =
                url;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";

            link.textContent =
                name;

            profileLinks.appendChild(
                link
            );
        }
    );


    let extra = [];

    try {

        extra =
            Array.isArray(
                profile.extra_links
            )
                ? profile.extra_links
                : JSON.parse(
                    profile.extra_links || "[]"
                );

    } catch {

        extra = [];
    }


    if (!Array.isArray(extra)) {
        extra = [];
    }


    extra.forEach(
        item => {

            const url =
                safeUrl(item.url);

            if (!url) {
                return;
            }

            const link =
                document.createElement("a");

            link.className =
                "profile-link";

            link.href =
                url;

            link.target =
                "_blank";

            link.rel =
                "noopener noreferrer";


            if (item.icon) {

                const iconUrl =
                    safeUrl(item.icon);

                if (iconUrl) {

                    const img =
                        document.createElement("img");

                    img.className =
                        "profile-link-icon";

                    img.src =
                        iconUrl;

                    img.alt =
                        "";

                    link.appendChild(
                        img
                    );
                }
            }


            const text =
                document.createElement("span");

            text.textContent =
                item.title || "Link";

            link.appendChild(
                text
            );

            profileLinks.appendChild(
                link
            );
        }
    );


    profileLinks.style.display =
        profileLinks.children.length
            ? "flex"
            : "none";
}


function renderColors() {

    const background =
        profile.profile_color ||
        "#0e0e0e";

    const firstGlow =
        profile.glow1_color ||
        "#6b4cff";

    const secondGlow =
        profile.glow2_color ||
        "#00aaff";

    const nameColor =
        profile.name_color ||
        "#ffffff";


    profileCard.style.background =
        background;

    glow1.style.background =
        firstGlow;

    glow2.style.background =
        secondGlow;

    usernameElement.style.color =
        nameColor;


    if (
        Number(profile.neon_name || 0) === 1
    ) {

        usernameElement.style.textShadow =
            `
            0 0 7px ${nameColor},
            0 0 18px ${nameColor},
            0 0 30px ${nameColor}
            `;

    } else {

        usernameElement.style.textShadow =
            "none";
    }
}


function renderOG() {

    if (
        profile.og_visible === false ||
        Number(profile.og_hidden || 0) === 1
    ) {

        ogBadge.style.display =
            "none";

        return;
    }

    if (
        profile.og_eligible === false
    ) {

        ogBadge.style.display =
            "none";

        return;
    }

    ogBadge.style.display =
        "inline-flex";
}


function renderStats() {

    const viewsEnabled =
        Number(
            profile.views_enabled ?? 1
        ) === 1;

    viewsStat.style.display =
        viewsEnabled
            ? "flex"
            : "none";

    viewsCount.textContent =
        Number(
            profile.views_count || 0
        ).toLocaleString("pl-PL");


    const likesEnabled =
        Number(
            profile.likes_enabled || 0
        ) === 1;

    const paid =
        profile.plan === "pro" ||
        profile.plan === "premium";


    likesStat.style.display =
        likesEnabled && paid
            ? "flex"
            : "none";


    if (
        likesEnabled &&
        paid
    ) {

        likesCount.textContent =
            Number(
                profile.likes_count || 0
            ).toLocaleString("pl-PL");


        const key =
            `mullar_like_${profile.username}`;

        const liked =
            localStorage.getItem(
                key
            ) === "1";


        likeButton.disabled =
            liked;

        likeButton.textContent =
            liked
                ? "♥"
                : "♡";

        likeButton.classList.toggle(
            "liked",
            liked
        );
    }
}


function renderMusic() {

    const url =
        safeUrl(profile.music_url);

    if (
        !url ||
        String(profile.plan).toLowerCase() !==
            "premium"
    ) {

        musicPlayer.style.display =
            "none";

        return;
    }

    profileAudio.src =
        url;

    musicPlayer.style.display =
        "flex";
}


function renderProfile() {

    document.title =
        `${profile.username} — Mullar.Online`;

    usernameElement.textContent =
        profile.username;

    handleElement.textContent =
        `@${profile.username}`;

    bioElement.textContent =
        profile.bio ||
        "Brak opisu.";

    memberSince.textContent =
        profile.created_at
            ? new Date(
                profile.created_at
              ).toLocaleDateString(
                "pl-PL"
              )
            : "—";


    loadPlan();
    renderAvatar();
    renderLinks();
    renderColors();
    renderOG();
    renderStats();
    renderMusic();


    if (profile.banner) {

        const banner =
            safeUrl(
                profile.banner
            );

        if (banner) {

            profileBanner.style.display =
                "block";

            profileBanner.style.backgroundImage =
                `url("${banner}")`;
        }
    }


    profileCard.style.display =
        "block";

    loading.style.display =
        "none";
}


async function registerView() {

    if (
        Number(
            profile.views_enabled ?? 1
        ) !== 1
    ) {
        return;
    }


    const key =
        `mullar_view_${profile.username}`;

    if (
        localStorage.getItem(key) === "1"
    ) {
        return;
    }


    try {

        const response =
            await fetch(
                `${API}/api/profile/${encodeURIComponent(
                    profile.username
                )}/view`,
                {
                    method: "POST"
                }
            );


        if (!response.ok) {
            return;
        }


        const data =
            await response.json();


        if (
            typeof data.views_count ===
            "number"
        ) {

            viewsCount.textContent =
                data.views_count.toLocaleString(
                    "pl-PL"
                );
        }


        localStorage.setItem(
            key,
            "1"
        );

    } catch (error) {

        console.error(error);
    }
}


async function likeProfile() {

    if (!profile) {
        return;
    }


    if (
        Number(
            profile.likes_enabled || 0
        ) !== 1
    ) {
        return;
    }


    const plan =
        String(
            profile.plan || "free"
        ).toLowerCase();


    if (
        plan !== "pro" &&
        plan !== "premium"
    ) {
        return;
    }


    const key =
        `mullar_like_${profile.username}`;


    if (
        localStorage.getItem(key) === "1"
    ) {
        return;
    }


    likeButton.disabled =
        true;


    try {

        const response =
            await fetch(
                `${API}/api/profile/${encodeURIComponent(
                    profile.username
                )}/like`,
                {
                    method: "POST"
                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.message ||
                "Nie udało się polubić profilu."
            );
        }


        localStorage.setItem(
            key,
            "1"
        );


        likeButton.textContent =
            "♥";

        likeButton.classList.add(
            "liked"
        );


        if (
            typeof data.likes_count ===
            "number"
        ) {

            likesCount.textContent =
                data.likes_count.toLocaleString(
                    "pl-PL"
                );
        }

    } catch (error) {

        console.error(error);

        likeButton.disabled =
            false;
    }
}


async function start() {

    if (!username) {

        showError();

        return;
    }


    try {

        const response =
            await fetch(
                `${API}/api/profile/${encodeURIComponent(
                    username
                )}`
            );


        if (!response.ok) {

            showError();

            return;
        }


        const data =
            await response.json();


        if (
            !data.success ||
            !data.profile
        ) {

            showError();

            return;
        }


        profile =
            data.profile;


        renderProfile();

        await registerView();

    } catch (error) {

        console.error(error);

        showError();
    }
}


function showError() {

    loading.style.display =
        "none";

    profileCard.style.display =
        "none";

    errorScreen.style.display =
        "flex";
}


likeButton.addEventListener(
    "click",
    likeProfile
);


profileCard.style.display =
    "none";

errorScreen.style.display =
    "none";

start();