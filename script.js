console.log("Mullar.Online loaded!");

const links = document.querySelectorAll(".link");

links.forEach((link) => {
    link.addEventListener("click", () => {
        console.log("Kliknięto link:", link.innerText);
    });
});