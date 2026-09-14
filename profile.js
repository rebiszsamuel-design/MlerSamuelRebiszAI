const API =
    "https://mullar-api.sameksamuel17.workers.dev";

const params =
    new URLSearchParams(
        window.location.search
    );

const username =
    params.get("user");


const loading =
    document.getElementById(
        "loading"
    );

const errorScreen =
    document.getElementById(
        "errorScreen"
    );

const profileCard =
    document.getElementById(
        "profileCard"
    );

const usernameElement =
    document.getElementById(
        "username"
    );

const handleElement =
    document.getElementById(
        "handle"
    );

const planElement =
    document.getElementById(
        "plan"
    );

const ogBadge =
    document.getElementById(
        "ogBadge"
    );

const avatarElement =
    document.getElementById(
        "avatar"
    );

const bioElement =
    document.getElementById(
        "bio"
    );

const profileLinks =
    document.getElementById(
        "profileLinks"
    );

const profileBanner =
    document.getElementById(
        "profileBanner"
    );

const glow1 =
    document.getElementById(
        "glow1"
    );

const glow2 =
    document.getElementById(
        "glow2"
    );

const profileStats =
    document.getElementById(
        "profileStats"
    );

const viewsStat =
    document.getElementById(
        "viewsStat"
    );

const viewsCount =
    document.getElementById(
        "viewsCount"
    );

const likesStat =
    document.getElementById(
        "likesStat"
    );

const likesCount =
    document.getElementById(
        "likesCount"
    );

const likeButton =
    document.getElementById(
        "likeButton"
    );

const memberSince =
    document.getElementById(
        "memberSince"
    );

const musicPlayer =
    document.getElementById(
        "musicPlayer"
    );

const profileAudio =
    document.getElementById(
        "profileAudio"
    );


let profile = null;

let animationHandles = [];


function safeUrl(value) {

    if (!value) {
        return null;
    }

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


function safeColor(
    value,
    fallback
) {

    if (
        typeof value === "string" &&
        /^#[0-9a-fA-F]{6}$/.test(
            value.trim()
        )
    ) {
        return value.trim();
    }

    return fallback;
}


function planName(plan) {

    const value =
        String(
            plan || "free"
        ).toLowerCase();

    if (
        value === "premium"
    ) {
        return "PREMIUM";
    }

    if (
        value === "pro"
    ) {
        return "PRO";
    }

    return "FREE";
}


function planClass(plan) {

    const value =
        String(
            plan || "free"
        ).toLowerCase();

    if (
        value === "premium"
    ) {
        return "premium-badge";
    }

    if (
        value === "pro"
    ) {
        return "pro-badge";
    }

    return "free-badge";
}


function parseLinks(value) {

    if (
        Array.isArray(value)
    ) {
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


function renderPlan() {

    if (!planElement) {
        return;
    }

    planElement.textContent =
        planName(
            profile.plan
        );

    planElement.className =
        `badge ${planClass(
            profile.plan
        )}`;
}


function renderAvatar() {

    if (!avatarElement) {
        return;
    }

    avatarElement.innerHTML =
        "";

    const avatarUrl =
        safeUrl(
            profile.avatar
        );


    if (avatarUrl) {

        const image =
            document.createElement(
                "img"
            );

        image.src =
            avatarUrl;

        image.alt =
            `${profile.username} avatar`;

        image.loading =
            "lazy";


        image.onerror =
            () => {

                avatarElement.innerHTML =
                    "";

                avatarElement.textContent =
                    String(
                        profile.username ||
                        "M"
                    )
                    .charAt(0)
                    .toUpperCase();
            };


        avatarElement.appendChild(
            image
        );

    } else {

        avatarElement.textContent =
            String(
                profile.username ||
                "M"
            )
            .charAt(0)
            .toUpperCase();
    }
}


function addLink(
    title,
    url,
    icon = ""
) {

    const safe =
        safeUrl(
            url
        );

    if (!safe) {
        return;
    }


    const link =
        document.createElement(
            "a"
        );

    link.className =
        "profile-link";

    link.href =
        safe;

    link.target =
        "_blank";

    link.rel =
        "noopener noreferrer";


    if (icon) {

        const safeIcon =
            safeUrl(
                icon
            );


        if (safeIcon) {

            const image =
                document.createElement(
                    "img"
                );

            image.className =
                "profile-link-icon";

            image.src =
                safeIcon;

            image.alt =
                "";

            image.loading =
                "lazy";


            image.onerror =
                () => {
                    image.remove();
                };


            link.appendChild(
                image
            );
        }
    }


    const text =
        document.createElement(
            "span"
        );

    text.textContent =
        title;


    link.appendChild(
        text
    );


    profileLinks.appendChild(
        link
    );
}


function renderLinks() {

    if (!profileLinks) {
        return;
    }


    profileLinks.innerHTML =
        "";


    addLink(
        "Discord",
        profile.discord
    );


    addLink(
        "GitHub",
        profile.github
    );


    addLink(
        "Instagram",
        profile.instagram
    );


    const extra =
        parseLinks(
            profile.extra_links
        );


    extra.forEach(
        item => {

            if (
                !item ||
                typeof item !==
                    "object"
            ) {
                return;
            }


            addLink(
                item.title ||
                    "Link",
                item.url,
                item.icon || ""
            );
        }
    );


    profileLinks.style.display =
        profileLinks.children.length
            ? "flex"
            : "none";
}


function renderColors() {

    const cardColor =
        safeColor(
            profile.profile_color,
            "#0e0e0e"
        );


    const firstGlow =
        safeColor(
            profile.glow1_color,
            "#6b4cff"
        );


    const secondGlow =
        safeColor(
            profile.glow2_color,
            "#00aaff"
        );


    const nameColor =
        safeColor(
            profile.name_color,
            "#ffffff"
        );


    if (profileCard) {

        profileCard.style.background =
            cardColor;
    }


    if (glow1) {

        glow1.style.background =
            firstGlow;
    }


    if (glow2) {

        glow2.style.background =
            secondGlow;
    }


    if (usernameElement) {

        usernameElement.style.color =
            nameColor;


        const neon =
            Number(
                profile.neon_name || 0
            ) === 1 &&
            String(
                profile.plan ||
                "free"
            ).toLowerCase() ===
                "premium";


        usernameElement.style.textShadow =
            neon
                ? `
                    0 0 6px ${nameColor},
                    0 0 15px ${nameColor},
                    0 0 28px ${nameColor}
                  `
                : "none";
    }
}


function renderOG() {

    if (!ogBadge) {
        return;
    }


    const eligible =
        Boolean(
            profile.og_eligible
        );


    const hidden =
        Number(
            profile.og_hidden || 0
        ) === 1;


    ogBadge.style.display =
        eligible && !hidden
            ? "inline-flex"
            : "none";
}


function renderStats() {

    if (!profileStats) {
        return;
    }


    const viewsEnabled =
        Number(
            profile.views_enabled ??
            1
        ) === 1;


    const likesEnabled =
        Number(
            profile.likes_enabled ||
            0
        ) === 1;


    const plan =
        String(
            profile.plan ||
            "free"
        ).toLowerCase();


    const paid =
        plan === "pro" ||
        plan === "premium";


    if (viewsEnabled) {

        viewsStat.style.display =
            "flex";

        viewsCount.textContent =
            Number(
                profile.views_count ||
                0
            ).toLocaleString(
                "pl-PL"
            );

    } else {

        viewsStat.style.display =
            "none";
    }


    if (
        likesEnabled &&
        paid
    ) {

        likesStat.style.display =
            "flex";

        likesCount.textContent =
            Number(
                profile.likes_count ||
                0
            ).toLocaleString(
                "pl-PL"
            );


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

    } else {

        likesStat.style.display =
            "none";
    }


    profileStats.style.display =
        viewsEnabled ||
        (likesEnabled && paid)
            ? "flex"
            : "none";
}


function renderMusic() {

    const url =
        safeUrl(
            profile.music_url
        );


    const premium =
        String(
            profile.plan ||
            "free"
        ).toLowerCase() ===
        "premium";


    if (
        !url ||
        !premium
    ) {

        musicPlayer.style.display =
            "none";

        profileAudio.removeAttribute(
            "src"
        );

        return;
    }


    profileAudio.src =
        url;

    musicPlayer.style.display =
        "flex";
}


function renderBanner() {

    if (!profileBanner) {
        return;
    }


    const banner =
        safeUrl(
            profile.banner
        );


    profileBanner.style.display =
        "block";


    if (banner) {

        profileBanner.style.backgroundImage =
            `url("${banner}")`;

        profileBanner.classList.add(
            "has-banner"
        );

    } else {

        profileBanner.style.backgroundImage =
            "";

        profileBanner.classList.remove(
            "has-banner"
        );
    }
}


function clearAnimations() {

    animationHandles.forEach(
        handle => {

            try {
                handle.cancel();
            } catch {
                // Ignore.
            }
        }
    );


    animationHandles =
        [];
}


function animateElement(
    element,
    keyframes,
    options
) {

    if (!element) {
        return;
    }


    if (
        typeof element.animate !==
        "function"
    ) {
        return;
    }


    const animation =
        element.animate(
            keyframes,
            options
        );


    animationHandles.push(
        animation
    );
}


function renderAnimation() {

    clearAnimations();


    if (!profileCard) {
        return;
    }


    const plan =
        String(
            profile.plan ||
            "free"
        ).toLowerCase();


    const animation =
        String(
            profile.profile_animation ||
            "none"
        ).toLowerCase();


    if (
        plan !== "premium" ||
        animation === "none"
    ) {

        profileCard.style.transform =
            "";

        return;
    }


    if (
        animation === "float"
    ) {

        animateElement(
            profileCard,

            [
                {
                    transform:
                        "translateY(0)"
                },

                {
                    transform:
                        "translateY(-5px)"
                }
            ],

            {
                duration:
                    3000,

                iterations:
                    Infinity,

                direction:
                    "alternate",

                easing:
                    "ease-in-out"
            }
        );

        return;
    }


    if (
        animation === "pulse"
    ) {

        animateElement(
            profileCard,

            [
                {
                    boxShadow:
                        "0 32px 90px rgba(0,0,0,.55)"
                },

                {
                    boxShadow:
                        "0 32px 90px rgba(118,87,255,.38)"
                },

                {
                    boxShadow:
                        "0 32px 90px rgba(0,0,0,.55)"
                }
            ],

            {
                duration:
                    2200,

                iterations:
                    Infinity,

                easing:
                    "ease-in-out"
            }
        );

        return;
    }


    if (
        animation === "glow"
    ) {

        animateElement(
            glow1,

            [
                {
                    opacity: .14,
                    transform:
                        "scale(1)"
                },

                {
                    opacity: .30,
                    transform:
                        "scale(1.08)"
                },

                {
                    opacity: .14,
                    transform:
                        "scale(1)"
                }
            ],

            {
                duration:
                    2600,

                iterations:
                    Infinity,

                easing:
                    "ease-in-out"
            }
        );


        animateElement(
            glow2,

            [
                {
                    opacity: .12,
                    transform:
                        "scale(1)"
                },

                {
                    opacity: .27,
                    transform:
                        "scale(1.08)"
                },

                {
                    opacity: .12,
                    transform:
                        "scale(1)"
                }
            ],

            {
                duration:
                    3200,

                iterations:
                    Infinity,

                easing:
                    "ease-in-out"
            }
        );

        return;
    }


    if (
        animation === "tilt"
    ) {

        animateElement(
            profileCard,

            [
                {
                    transform:
                        "rotate(-0.45deg)"
                },

                {
                    transform:
                        "rotate(0.45deg)"
                },

                {
                    transform:
                        "rotate(-0.45deg)"
                }
            ],

            {
                duration:
                    3800,

                iterations:
                    Infinity,

                easing:
                    "ease-in-out"
            }
        );

        return;
    }


    if (
        animation === "bounce"
    ) {

        animateElement(
            avatarElement,

            [
                {
                    transform:
                        "translateY(0) scale(1)"
                },

                {
                    transform:
                        "translateY(-4px) scale(1.015)"
                },

                {
                    transform:
                        "translateY(0) scale(1)"
                }
            ],

            {
                duration:
                    1700,

                iterations:
                    Infinity,

                easing:
                    "ease-in-out"
            }
        );
    }
}


async function registerView() {

    if (
        Number(
            profile.views_enabled ??
            1
        ) !== 1
    ) {
        return;
    }


    const key =
        `mullar_view_${profile.username}`;


    if (
        localStorage.getItem(
            key
        ) === "1"
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

            profile.views_count =
                data.views_count;

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

        console.error(
            "View error:",
            error
        );
    }
}


async function likeProfile() {

    if (!profile) {
        return;
    }


    const plan =
        String(
            profile.plan ||
            "free"
        ).toLowerCase();


    if (
        plan !== "pro" &&
        plan !== "premium"
    ) {
        return;
    }


    if (
        Number(
            profile.likes_enabled ||
            0
        ) !== 1
    ) {
        return;
    }


    const key =
        `mullar_like_${profile.username}`;


    if (
        localStorage.getItem(
            key
        ) === "1"
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

        console.error(
            "Like error:",
            error
        );

        likeButton.disabled =
            false;
    }
}


function renderProfile() {

    usernameElement.textContent =
        profile.username ||
        "Mullar";


    handleElement.textContent =
        `@${profile.username ||
            "mullar"}`;


    bioElement.textContent =
        profile.bio ||
        "No Bio Yet";


    if (
        profile.created_at
    ) {

        const date =
            new Date(
                profile.created_at
            );


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            memberSince.textContent =
                date.toLocaleDateString(
                    "pl-PL",
                    {
                        day:
                            "2-digit",

                        month:
                            "2-digit",

                        year:
                            "numeric"
                    }
                );
        }
    }


    renderPlan();

    renderAvatar();

    renderLinks();

    renderColors();

    renderOG();

    renderStats();

    renderMusic();

    renderBanner();

    renderAnimation();


    document.title =
        `${profile.username} — Mullar.Online`;
}


function showError() {

    loading.style.display =
        "none";

    profileCard.style.display =
        "none";

    errorScreen.style.display =
        "flex";
}


async function loadProfile() {

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


        loading.style.display =
            "none";

        profileCard.style.display =
            "block";


        await registerView();

    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        showError();
    }
}


if (likeButton) {

    likeButton.addEventListener(
        "click",
        likeProfile
    );
}


profileCard.style.display =
    "none";

errorScreen.style.display =
    "none";


loadProfile();