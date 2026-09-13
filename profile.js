const usernameElement =
    document.getElementById("username");

const handleElement =
    document.getElementById("handle");

const planElement =
    document.getElementById("plan");

const avatarElement =
    document.getElementById("avatar");

const memberSinceElement =
    document.getElementById("memberSince");

const bioElement =
    document.getElementById("bio");

const profileLinks =
    document.querySelectorAll(".profile-link");

const bannerElement =
    document.getElementById("profileBanner");


const API_URL =
    "https://mullar-api.sameksamuel17.workers.dev";


const params =
    new URLSearchParams(
        window.location.search
    );


const username =
    params.get("user");


async function loadProfile() {

    if (!username) {

        usernameElement.textContent =
            "Brak profilu";

        handleElement.textContent =
            "";

        planElement.textContent =
            "ERROR";

        bioElement.textContent =
            "Nie podano użytkownika.";

        return;
    }


    try {

        const response =
            await fetch(
                `${API_URL}/api/profile/${encodeURIComponent(
                    username
                )}`
            );


        const data =
            await response.json();


        if (
            !response.ok ||
            !data.success
        ) {

            usernameElement.textContent =
                "Profile not found";

            handleElement.textContent =
                "";

            planElement.textContent =
                "404";

            avatarElement.textContent =
                "?";

            bioElement.textContent =
                "Nie znaleziono tego profilu.";

            memberSinceElement.textContent =
                "—";

            return;
        }


        const profile =
            data.profile;


        usernameElement.textContent =
            profile.username;

        handleElement.textContent =
            `@${profile.username}`;


        const plan =
            (
                profile.plan ||
                "free"
            ).toLowerCase();


        planElement.classList.remove(
            "premium-badge",
            "pro-badge",
            "free-badge"
        );


        if (plan === "premium") {

            planElement.textContent =
                "PREMIUM";

            planElement.classList.add(
                "premium-badge"
            );

        } else if (plan === "pro") {

            planElement.textContent =
                "PRO";

            planElement.classList.add(
                "pro-badge"
            );

        } else {

            planElement.textContent =
                "FREE";

            planElement.classList.add(
                "free-badge"
            );
        }


        avatarElement.innerHTML =
            "";


        if (profile.avatar) {

            const image =
                document.createElement("img");

            image.src =
                profile.avatar;

            image.alt =
                `${profile.username} avatar`;

            image.loading =
                "lazy";


            image.onerror = () => {

                avatarElement.innerHTML =
                    "";

                avatarElement.textContent =
                    profile.username
                        .charAt(0)
                        .toUpperCase();
            };


            avatarElement.appendChild(
                image
            );

        } else {

            avatarElement.textContent =
                profile.username
                    .charAt(0)
                    .toUpperCase();
        }


        bioElement.textContent =
            profile.bio ||
            "Welcome to my Mullar.Online profile.";


        if (profile.created_at) {

            const date =
                new Date(
                    profile.created_at
                );


            if (
                !Number.isNaN(
                    date.getTime()
                )
            ) {

                memberSinceElement.textContent =
                    date.toLocaleDateString(
                        "pl-PL",
                        {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        }
                    );
            }

        } else {

            memberSinceElement.textContent =
                "—";
        }


        if (profile.discord) {

            profileLinks[0].href =
                `https://discord.com/users/${encodeURIComponent(
                    profile.discord
                )}`;

            profileLinks[0].style.display =
                "inline-flex";

        } else {

            profileLinks[0].style.display =
                "none";
        }


        if (profile.github) {

            profileLinks[1].href =
                profile.github;

            profileLinks[1].style.display =
                "inline-flex";

        } else {

            profileLinks[1].style.display =
                "none";
        }


        if (profile.instagram) {

            profileLinks[2].href =
                profile.instagram;

            profileLinks[2].style.display =
                "inline-flex";

        } else {

            profileLinks[2].style.display =
                "none";
        }


        if (profile.banner) {

            bannerElement.style.backgroundImage =
                `url("${profile.banner}")`;

        } else {

            bannerElement.style.backgroundImage =
                "linear-gradient(135deg, #181818, #080808)";
        }


        document.title =
            `${profile.username} — Mullar.Online`;


    } catch (error) {

        console.error(
            "Profile error:",
            error
        );

        usernameElement.textContent =
            "Something went wrong";

        bioElement.textContent =
            "Nie udało się załadować profilu.";
    }
}


loadProfile();