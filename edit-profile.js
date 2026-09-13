const form =
    document.getElementById("editProfileForm");

const message =
    document.getElementById("message");

const bioInput =
    document.getElementById("bio");

const discordInput =
    document.getElementById("discord");

const githubInput =
    document.getElementById("github");

const instagramInput =
    document.getElementById("instagram");

const avatarFile =
    document.getElementById("avatarFile");

const bannerFile =
    document.getElementById("bannerFile");

const uploadAvatarButton =
    document.getElementById(
        "uploadAvatarButton"
    );

const uploadBannerButton =
    document.getElementById(
        "uploadBannerButton"
    );

const avatarMessage =
    document.getElementById(
        "avatarMessage"
    );

const bannerMessage =
    document.getElementById(
        "bannerMessage"
    );


// ================================
// LOAD PROFILE
// ================================

async function loadProfileData() {

    try {

        const response =
            await fetch("/api/me");

        const data =
            await response.json();

        if (!data.loggedIn) {

            window.location.href =
                "/login.html";

            return;
        }

        const user =
            data.user;

        bioInput.value =
            user.bio || "";

        discordInput.value =
            user.discord || "";

        githubInput.value =
            user.github || "";

        instagramInput.value =
            user.instagram || "";

    } catch (error) {

        console.error(error);

        message.textContent =
            "Nie udało się pobrać danych profilu.";
    }
}


// ================================
// UPLOAD AVATAR
// ================================

uploadAvatarButton.addEventListener(
    "click",
    async () => {

        const file =
            avatarFile.files[0];

        if (!file) {

            avatarMessage.textContent =
                "Najpierw wybierz obrazek.";

            return;
        }

        avatarMessage.textContent =
            "Przesyłanie...";

        const formData =
            new FormData();

        formData.append(
            "avatar",
            file
        );

        try {

            const response =
                await fetch(
                    "/api/profile/avatar",
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await response.json();

            if (!data.success) {

                avatarMessage.textContent =
                    data.message;

                return;
            }

            avatarMessage.textContent =
                "✓ Avatar został przesłany!";

            avatarFile.value = "";

        } catch (error) {

            console.error(error);

            avatarMessage.textContent =
                "Wystąpił błąd podczas przesyłania.";
        }
    }
);


// ================================
// UPLOAD BANNER
// ================================

uploadBannerButton.addEventListener(
    "click",
    async () => {

        const file =
            bannerFile.files[0];

        if (!file) {

            bannerMessage.textContent =
                "Najpierw wybierz obrazek.";

            return;
        }

        bannerMessage.textContent =
            "Przesyłanie...";

        const formData =
            new FormData();

        formData.append(
            "banner",
            file
        );

        try {

            const response =
                await fetch(
                    "/api/profile/banner",
                    {
                        method: "POST",
                        body: formData
                    }
                );

            const data =
                await response.json();

            if (!data.success) {

                bannerMessage.textContent =
                    data.message;

                return;
            }

            bannerMessage.textContent =
                "✓ Banner został przesłany!";

            bannerFile.value = "";

        } catch (error) {

            console.error(error);

            bannerMessage.textContent =
                "Wystąpił błąd podczas przesyłania.";
        }
    }
);


// ================================
// SAVE PROFILE
// ================================

form.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        message.textContent =
            "Zapisywanie...";

        try {

            const response =
                await fetch(
                    "/api/profile/update",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            bio:
                                bioInput.value,

                            discord:
                                discordInput.value,

                            github:
                                githubInput.value,

                            instagram:
                                instagramInput.value
                        })
                    }
                );

            const data =
                await response.json();

            if (!data.success) {

                message.textContent =
                    data.message;

                return;
            }

            message.textContent =
                "✓ Profil został zapisany!";

        } catch (error) {

            console.error(error);

            message.textContent =
                "Wystąpił błąd podczas zapisywania.";
        }
    }
);


// ================================
// START
// ================================

loadProfileData();