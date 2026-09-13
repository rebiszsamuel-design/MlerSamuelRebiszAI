javascript
const API = "https://mullar-api.sameksamuel17.workers.dev";

const token = localStorage.getItem("mullar_token");

if (!token) {
  window.location.href = "/login.html";
}

const $ = (id) => document.getElementById(id);

let currentUser = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeColor(value, fallback) {
  if (!value) return fallback;

  const v = String(value).trim();

  if (/^#[0-9a-fA-F]{6}$/.test(v)) {
    return v;
  }

  return fallback;
}

function setStatus(text, type = "") {
  const el = $("saveStatus");

  if (!el) return;

  el.textContent = text;
  el.className = "save-status";

  if (type) {
    el.classList.add(type);
  }
}

function getPlan() {
  return String(currentUser?.plan || "free").toLowerCase();
}

function isPro() {
  const plan = getPlan();
  return plan === "pro" || plan === "premium";
}

function isPremium() {
  return getPlan() === "premium";
}

async function getMe() {
  const response = await fetch(`${API}/api/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    throw new Error("API zwróciło nieprawidłową odpowiedź.");
  }

  if (!response.ok) {
    throw new Error(data?.error || `Błąd API: ${response.status}`);
  }

  return data;
}

function parseExtraLinks(raw) {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw;
  }

  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function renderLinks() {
  const container = $("linksList");

  if (!container) return;

  const max = isPremium() ? 5 : isPro() ? 2 : 0;

  if (max === 0) {
    container.innerHTML = `
      <div class="link-item">
        <strong>Linki dodatkowe są dostępne od planu PRO.</strong>
        <div class="hint">Przejdź do zakładki PRO / Premium na koncie, aby aktywować plan.</div>
      </div>
    `;
    return;
  }

  let links = parseExtraLinks(currentUser?.extra_links);

  links = links.slice(0, max);

  while (links.length < max) {
    links.push({
      title: "",
      url: "",
      icon: ""
    });
  }

  container.innerHTML = links.map((link, index) => `
    <div class="link-item">
      <div class="link-head">
        <span class="link-number">LINK ${index + 1}</span>
        ${isPremium() ? '<span class="badge">PREMIUM</span>' : '<span class="badge">PRO</span>'}
      </div>

      <div class="fields two">

        <div class="field">
          <label for="link_title_${index}">NAZWA</label>
          <input
            id="link_title_${index}"
            type="text"
            value="${escapeHtml(link?.title || "")}"
            placeholder="Moja strona"
          >
        </div>

        <div class="field">
          <label for="link_url_${index}">URL</label>
          <input
            id="link_url_${index}"
            type="url"
            value="${escapeHtml(link?.url || "")}"
            placeholder="https://example.com"
          >
        </div>

        ${
          isPremium()
            ? `
              <div class="field">
                <label for="link_icon_${index}">IKONA URL</label>
                <input
                  id="link_icon_${index}"
                  type="url"
                  value="${escapeHtml(link?.icon || "")}"
                  placeholder="https://..."
                >
              </div>
            `
            : ""
        }

      </div>
    </div>
  `).join("");
}

function populate() {
  const u = currentUser;

  $("bio").value = u.bio || "";
  $("discord").value = u.discord || "";
  $("github").value = u.github || "";
  $("instagram").value = u.instagram || "";

  $("og_hidden").checked = Boolean(Number(u.og_hidden || 0));
  $("views_enabled").checked = Number(u.views_enabled ?? 1) === 1;
  $("likes_enabled").checked = Number(u.likes_enabled || 0) === 1;

  $("profile_color").value =
    normalizeColor(u.profile_color, "#0e0e0e");

  $("glow1_color").value =
    normalizeColor(u.glow1_color, "#6b4cff");

  $("glow2_color").value =
    normalizeColor(u.glow2_color, "#00aaff");

  $("name_color").value =
    normalizeColor(u.name_color, "#ffffff");

  $("neon_name").checked = Number(u.neon_name || 0) === 1;

  $("music_url").value = u.music_url || "";

  const profileUrl =
    `/profile.html?user=${encodeURIComponent(u.username)}`;

  $("profileLink").href = profileUrl;

  setupPlanRestrictions();

  renderLinks();
}

function setupPlanRestrictions() {
  const pro = isPro();
  const premium = isPremium();

  const likes = $("likes_enabled");
  const neon = $("neon_name");
  const music = $("music_url");

  likes.disabled = !pro;

  if (!pro) {
    likes.checked = false;
    $("likesHint").textContent = "Dostępne dla PRO i Premium.";
  } else {
    $("likesHint").textContent = "Odwiedzający mogą polubić Twój profil.";
  }

  neon.disabled = !premium;

  if (!premium) {
    neon.checked = false;
  }

  music.disabled = !premium;

  if (!premium) {
    music.value = "";
  }
}

function collectLinks() {
  const max = isPremium() ? 5 : isPro() ? 2 : 0;

  const result = [];

  for (let i = 0; i < max; i++) {
    const title = $(`link_title_${i}`)?.value.trim() || "";
    const url = $(`link_url_${i}`)?.value.trim() || "";
    const icon = $(`link_icon_${i}`)?.value.trim() || "";

    if (!title && !url && !icon) {
      continue;
    }

    if (!title || !url) {
      throw new Error(`Uzupełnij nazwę i URL linku ${i + 1}.`);
    }

    result.push({
      title,
      url,
      ...(isPremium() ? { icon } : {})
    });
  }

  return result;
}

async function saveProfile(event) {
  event.preventDefault();

  const saveButton = $("saveBtn");

  saveButton.disabled = true;
  saveButton.textContent = "Zapisywanie...";
  setStatus("Wysyłanie zmian...");

  try {
    const extraLinks = collectLinks();

    const payload = {
      bio: $("bio").value.trim(),
      discord: $("discord").value.trim(),
      github: $("github").value.trim(),
      instagram: $("instagram").value.trim(),

      og_hidden: $("og_hidden").checked ? 1 : 0,
      views_enabled: $("views_enabled").checked ? 1 : 0,
      likes_enabled:
        isPro() && $("likes_enabled").checked ? 1 : 0,

      profile_color: $("profile_color").value,
      glow1_color: $("glow1_color").value,
      glow2_color: $("glow2_color").value,
      name_color: $("name_color").value,

      neon_name:
        isPremium() && $("neon_name").checked ? 1 : 0,

      extra_links: extraLinks,

      music_url:
        isPremium()
          ? $("music_url").value.trim()
          : ""
    };

    console.log("Mullar profile payload:", payload);

    const response = await fetch(`${API}/api/profile/update`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        `Serwer zwrócił nieprawidłową odpowiedź HTTP ${response.status}.`
      );
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
        data?.message ||
        `Nie udało się zapisać zmian. HTTP ${response.status}.`
      );
    }

    setStatus("✓ Zapisano zmiany", "ok");

    /*
      Pobieramy dane ponownie, żeby edytor od razu
      pracował na tym, co faktycznie zapisał backend.
    */
    currentUser = await getMe();

    populate();

  } catch (error) {
    console.error("Mullar save error:", error);

    setStatus(
      `✕ ${error.message || "Nie udało się zapisać zmian."}`,
      "error"
    );
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Zapisz zmiany";
  }
}

function setupNavigation() {
  const buttons = document.querySelectorAll(".nav-btn");
  const sections = document.querySelectorAll(".section");

  buttons.forEach(button => {
    button.addEventListener("click", () => {

      const target = button.dataset.section;

      buttons.forEach(item => {
        item.classList.remove("active");
      });

      sections.forEach(section => {
        section.classList.remove("active");
      });

      button.classList.add("active");

      const section = document.getElementById(
        `section-${target}`
      );

      if (section) {
        section.classList.add("active");
      }

      history.replaceState(
        null,
        "",
        target === "appearance"
          ? "#appearance"
          : target === "links"
            ? "#links"
            : "#basic"
      );
    });
  });

  const hash = window.location.hash;

  if (hash === "#appearance") {
    document
      .querySelector('[data-section="appearance"]')
      ?.click();
  }

  if (hash === "#links") {
    document
      .querySelector('[data-section="links"]')
      ?.click();
  }
}

async function init() {
  setupNavigation();

  try {
    currentUser = await getMe();

    populate();

    $("profileForm").addEventListener(
      "submit",
      saveProfile
    );

    setStatus("Gotowe do edycji");

  } catch (error) {
    console.error("Mullar init error:", error);

    setStatus(
      `✕ ${error.message || "Nie udało się pobrać konta."}`,
      "error"
    );

    $("saveBtn").disabled = true;
  }
}

init();