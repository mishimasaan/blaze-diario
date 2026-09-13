const API_BASE = "https://api.blazediarios.com";
const API_URL = `${API_BASE}/api/rank`;
const ME_URL = `${API_BASE}/api/me`;

const rankingList = document.querySelector("#ranking-list");
const rankingStatus = document.querySelector("#ranking-status");
const rankingHeaderValue = document.querySelector("#ranking-column-label");
const rankingSearch = document.querySelector("#ranking-search");
const rankingSearchClear = document.querySelector("#ranking-search-clear");
const rankingFindMe = document.querySelector("#ranking-find-me");
const rankingPrev = document.querySelector("#ranking-prev");
const rankingNext = document.querySelector("#ranking-next");
const rankingPage = document.querySelector("#ranking-page");
const rankingPages = document.querySelector("#ranking-pages");
const rankingEmpty = document.querySelector("#ranking-empty");
const rankingMe = document.querySelector("#ranking-me");
const rankingMeAvatar = document.querySelector("#ranking-me-avatar");
const rankingMeName = document.querySelector("#ranking-me-name");
const rankingMeUsername = document.querySelector("#ranking-me-username");
const rankingMeLabel = document.querySelector("#ranking-me-label");
const rankingMePosition = document.querySelector("#ranking-me-position");
const rankingPodium = document.querySelector("#ranking-podium");
const rankingPodiumList = document.querySelector("#ranking-podium-list");
const tabs = document.querySelectorAll(".ranking-tab");

const PER_PAGE = 10;
const rankingConfig = {
  win: { field: "wins", label: "Vitórias", title: "Ranking de Vitórias" },
  kill: { field: "kills", label: "Kills", title: "Ranking de Kills" },
  lucro: { field: "lucro", label: "Lucro", title: "Ranking de Lucro" }
};

let players = [];
let currentRanking = getRankingFromURL();
let currentPage = 1;
let searchTerm = "";
let loggedUser = null;
let highlightedUserId = null;

function getRankingFromURL() {
  const query = new URLSearchParams(window.location.search).get("tipo")?.toLowerCase();
  if (query && rankingConfig[query]) return query;

  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const rankingIndex = pathParts.indexOf("ranking");
  const pathType = rankingIndex >= 0 ? pathParts[rankingIndex + 1]?.toLowerCase() : null;

  return pathType && rankingConfig[pathType] ? pathType : "win";
}

function getRankingURL(type) {
  return `/ranking/${type}/`;
}

function syncRankingUI() {
  tabs.forEach((tab, index) => {
    const active = tab.dataset.ranking === currentRanking;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    if (active) {
      tab.closest(".ranking-tabs")?.style.setProperty("--active-index", index);
    }
  });

  rankingHeaderValue.textContent = rankingConfig[currentRanking].label;
  document.title = `${rankingConfig[currentRanking].title} — Blaze Diários`;
}

async function loadRanking() {
  try {
    syncRankingUI();
    setStatus("Carregando ranking...");

    const response = await fetch(API_URL, {
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data)) throw new Error("Formato inválido retornado pela API.");

    players = data;
    hideStatus();
    await loadLoggedUser();
    renderRanking();
  } catch (error) {
    console.error("Erro ao carregar ranking:", error);
    rankingList.innerHTML = "";
    rankingPodiumList.innerHTML = "";
    rankingPodium.hidden = true;
    setStatus("Não foi possível carregar o ranking no momento.");
  }
}

async function loadLoggedUser() {
  try {
    const response = await fetch(ME_URL, {
      credentials: "include",
      cache: "no-store",
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      loggedUser = null;
      return;
    }

    const data = await response.json();
    loggedUser = data.user || data.discord || data;
    if (!loggedUser?.id) loggedUser = null;
  } catch {
    loggedUser = null;
  }
}

function metricField() {
  return rankingConfig[currentRanking].field;
}

function getSortedPlayers() {
  const field = metricField();

  return [...players].sort((a, b) => {
    const valueA = Number(a[field]) || 0;
    const valueB = Number(b[field]) || 0;

    if (valueB !== valueA) return valueB - valueA;

    return String(a.displayName || a.username || "").localeCompare(
      String(b.displayName || b.username || ""),
      "pt-BR"
    );
  });
}

function getFilteredPlayers(source = getSortedPlayers()) {
  if (!searchTerm) return source;

  const search = normalizarTexto(searchTerm);
  return source.filter((player) => {
    const displayName = normalizarTexto(player.displayName || "");
    const username = normalizarTexto(player.username || "");
    return displayName.includes(search) || username.includes(search);
  });
}

function renderPodium(sortedPlayers) {
  if (searchTerm || sortedPlayers.length === 0) {
    rankingPodium.hidden = true;
    rankingPodiumList.innerHTML = "";
    return;
  }

  const topThree = sortedPlayers.slice(0, 3);
  const displayOrder = topThree.length >= 3 ? [topThree[1], topThree[0], topThree[2]] : topThree;

  rankingPodium.hidden = false;
  rankingPodiumList.innerHTML = displayOrder.map((player) => {
    const position = sortedPlayers.findIndex((item) => String(item.id) === String(player.id)) + 1;
    const isMe = highlightedUserId && String(player.id) === String(highlightedUserId);

    return `
      <article class="ranking-podium-card ranking-podium-card--${position}${isMe ? " ranking-podium-card--me" : ""}" data-podium-user-id="${escapeHTML(player.id)}">
        <div class="ranking-podium-card__position">${position}</div>
        <div class="ranking-podium-card__avatar-wrap">
          <img class="ranking-podium-card__avatar" src="${escapeHTML(player.avatar || "")}" alt="" loading="lazy">
          <span class="ranking-podium-card__badge">#${position}</span>
        </div>
        <div class="ranking-podium-card__identity">
          <strong>${escapeHTML(player.displayName || player.username || "Jogador")}</strong>
          <span>@${escapeHTML(player.username || "desconhecido")}</span>
        </div>
        <div class="ranking-podium-card__metric">
          <span>${rankingConfig[currentRanking].label}</span>
          <strong class="${getValueClass(player[metricField()]).trim()}">${formatValue(player[metricField()])}</strong>
        </div>
      </article>`;
  }).join("");
}

function renderRanking() {
  const sortedAll = getSortedPlayers();
  renderPodium(sortedAll);

  const basePlayers = searchTerm ? sortedAll : sortedAll.slice(3);
  const filteredPlayers = getFilteredPlayers(basePlayers);
  const totalPages = Math.max(1, Math.ceil(filteredPlayers.length / PER_PAGE));

  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const start = (currentPage - 1) * PER_PAGE;
  const pagePlayers = filteredPlayers.slice(start, start + PER_PAGE);

  rankingHeaderValue.textContent = rankingConfig[currentRanking].label;
  rankingPage.textContent = currentPage;
  rankingPages.textContent = totalPages;
  rankingPrev.disabled = currentPage <= 1;
  rankingNext.disabled = currentPage >= totalPages;
  rankingEmpty.hidden = filteredPlayers.length > 0 || (!searchTerm && sortedAll.length > 0);

  if (filteredPlayers.length === 0) {
    rankingList.innerHTML = "";
    return;
  }

  rankingList.innerHTML = pagePlayers.map((player) => {
    const position = sortedAll.findIndex((item) => String(item.id) === String(player.id)) + 1;
    const isMe = highlightedUserId && String(player.id) === String(highlightedUserId);
    const field = metricField();

    return `
      <article class="ranking-player${isMe ? " ranking-player--me" : ""}" data-user-id="${escapeHTML(player.id)}">
        <div class="ranking-player__position ranking-player__position--${position <= 3 ? position : "default"}">${position}</div>
        <div class="ranking-player__profile">
          <img class="ranking-player__avatar" src="${escapeHTML(player.avatar || "")}" alt="" loading="lazy">
          <div class="ranking-player__identity">
            <strong class="ranking-player__name">${escapeHTML(player.displayName || player.username || "Jogador")}</strong>
            <span class="ranking-player__username">@${escapeHTML(player.username || "desconhecido")}</span>
          </div>
        </div>
        <strong class="ranking-player__value${getValueClass(player[field])}">${formatValue(player[field])}</strong>
      </article>`;
  }).join("");
}

async function findMe() {
  if (!loggedUser) await loadLoggedUser();

  if (!loggedUser?.id) {
    window.location.href = `${API_BASE}/auth/discord`;
    return;
  }

  const sortedPlayers = getSortedPlayers();
  const index = sortedPlayers.findIndex((player) => String(player.id) === String(loggedUser.id));

  if (index === -1) {
    setStatus("Seu perfil ainda não está no ranking.");
    setTimeout(hideStatus, 2500);
    return;
  }

  const player = sortedPlayers[index];
  const position = index + 1;

  searchTerm = "";
  rankingSearch.value = "";
  rankingSearchClear.hidden = true;
  currentPage = position <= 3 ? 1 : Math.floor((index - 3) / PER_PAGE) + 1;
  highlightedUserId = String(loggedUser.id);

  renderMeCard(player, position);
  renderRanking();

  requestAnimationFrame(() => {
    const selector = position <= 3
      ? `[data-podium-user-id="${CSS.escape(String(loggedUser.id))}"]`
      : `[data-user-id="${CSS.escape(String(loggedUser.id))}"]`;
    document.querySelector(selector)?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function renderMeCard(player, position) {
  rankingMeAvatar.src = player.avatar || "";
  rankingMeAvatar.alt = "";
  rankingMeName.textContent = player.displayName || player.username || "Jogador";
  rankingMeUsername.textContent = `@${player.username || "usuario"}`;
  rankingMeLabel.textContent = rankingConfig[currentRanking].label;
  rankingMePosition.textContent = `#${position}`;
  rankingMe.hidden = false;
}

function updateMeCard() {
  if (!highlightedUserId) return;

  const sortedPlayers = getSortedPlayers();
  const index = sortedPlayers.findIndex((player) => String(player.id) === String(highlightedUserId));

  if (index === -1) {
    rankingMe.hidden = true;
    return;
  }

  renderMeCard(sortedPlayers[index], index + 1);
}

function getValueClass(value) {
  if (currentRanking !== "lucro") return "";
  const number = Number(value || 0);
  if (number > 0) return " is-positive";
  if (number < 0) return " is-negative";
  return "";
}

function formatValue(value) {
  const number = Number(value || 0);
  if (currentRanking === "lucro") {
    return number.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  return number.toLocaleString("pt-BR");
}

function normalizarTexto(value) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function setStatus(message) {
  rankingStatus.hidden = false;
  rankingStatus.textContent = message;
}

function hideStatus() {
  rankingStatus.hidden = true;
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectRanking(type, updateURL = true) {
  if (!rankingConfig[type] || type === currentRanking) return;

  currentRanking = type;
  currentPage = 1;
  syncRankingUI();
  updateMeCard();
  renderRanking();

  if (updateURL) {
    history.pushState({ ranking: type }, "", getRankingURL(type));
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => selectRanking(tab.dataset.ranking));
});

rankingSearch.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  currentPage = 1;
  rankingSearchClear.hidden = !searchTerm;
  renderRanking();
});

rankingSearchClear.addEventListener("click", () => {
  rankingSearch.value = "";
  searchTerm = "";
  currentPage = 1;
  rankingSearchClear.hidden = true;
  rankingSearch.focus();
  renderRanking();
});

rankingFindMe.addEventListener("click", findMe);

rankingPrev.addEventListener("click", () => {
  if (currentPage <= 1) return;
  currentPage -= 1;
  renderRanking();
  rankingList.scrollIntoView({ behavior: "smooth", block: "start" });
});

rankingNext.addEventListener("click", () => {
  const sorted = getSortedPlayers();
  const base = searchTerm ? sorted : sorted.slice(3);
  const totalPages = Math.max(1, Math.ceil(getFilteredPlayers(base).length / PER_PAGE));
  if (currentPage >= totalPages) return;
  currentPage += 1;
  renderRanking();
  rankingList.scrollIntoView({ behavior: "smooth", block: "start" });
});

window.addEventListener("popstate", () => {
  currentRanking = getRankingFromURL();
  currentPage = 1;
  syncRankingUI();
  updateMeCard();
  renderRanking();
});

loadRanking();
