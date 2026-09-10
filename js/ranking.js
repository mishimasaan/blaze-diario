const API_BASE = "https://api.noturnos.xyz";

const API_URL = `${API_BASE}/api/rank`;

const ME_URL = `${API_BASE}/api/me`;

const rankingList = document.querySelector(
    "#ranking-list"
  );

const rankingStatus = document.querySelector(
    "#ranking-status"
  );

const rankingHeaderValue = document.querySelector(
    "#ranking-column-label"
  );

const rankingSearch = document.querySelector(
    "#ranking-search"
  );

const rankingSearchClear = document.querySelector(
    "#ranking-search-clear"
  );

const rankingFindMe = document.querySelector(
    "#ranking-find-me"
  );

const rankingPrev = document.querySelector(
    "#ranking-prev"
  );

const rankingNext = document.querySelector(
    "#ranking-next"
  );

const rankingPage = document.querySelector(
    "#ranking-page"
  );

const rankingPages = document.querySelector(
    "#ranking-pages"
  );

const rankingEmpty = document.querySelector(
    "#ranking-empty"
  );

const rankingMe = document.querySelector(
    "#ranking-me"
  );

const rankingMeAvatar = document.querySelector(
    "#ranking-me-avatar"
  );

const rankingMeName = document.querySelector(
    "#ranking-me-name"
  );

const rankingMeUsername = document.querySelector(
    "#ranking-me-username"
  );

const rankingMeLabel = document.querySelector(
    "#ranking-me-label"
  );

const rankingMePosition = document.querySelector(
    "#ranking-me-position"
  );

const tabs = document.querySelectorAll(
    ".ranking-tab"
  );

const PER_PAGE = 10;

let players = [];
let currentRanking = "wins";
let currentPage = 1;
let searchTerm = "";
let loggedUser = null;
let highlightedUserId = null;

const rankingLabels = {
  wins: "Vitórias",
  kills: "Kills",
  lucro: "Lucro"
};

async function loadRanking() {
  try {
    setStatus(
      "Carregando ranking..."
    );

    const response = await fetch(
        API_URL,
        {
          cache:
            "no-store",

          headers: {
            Accept:
              "application/json"
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        `Erro HTTP: ${response.status}`
      );
    }

    const data = await response.json();

    if (
      !Array.isArray(
        data
      )
    ) {
      throw new Error(
        "Formato inválido retornado pela API."
      );
    }

    players =
      data;

    hideStatus();

    await loadLoggedUser();

    renderRanking();

  } catch (error) {
    console.error(
      "Erro ao carregar ranking:",
      error
    );

    rankingList.innerHTML =
      "";

    setStatus(
      "Não foi possível carregar o ranking no momento."
    );
  }
}

async function loadLoggedUser() {
  try {
    const response = await fetch(
        ME_URL,
        {
          credentials:
            "include",

          cache:
            "no-store",

          headers: {
            Accept:
              "application/json"
          }
        }
      );

    if (!response.ok) {
      loggedUser =
        null;

      return;
    }

    const data = await response.json();

    loggedUser =
      data.user ||
      data.discord ||
      data;

    if (
      !loggedUser ||
      !loggedUser.id
    ) {
      loggedUser =
        null;
    }

  } catch {
    loggedUser =
      null;
  }
}

function getSortedPlayers() {
  return [...players]
    .sort(
      (a, b) => {
        const valueA = Number(
            a[currentRanking]
          ) || 0;

        const valueB = Number(
            b[currentRanking]
          ) || 0;

        if (
          valueB !==
          valueA
        ) {
          return (
            valueB -
            valueA
          );
        }

        return String(
          a.displayName ||
          a.username ||
          ""
        ).localeCompare(
          String(
            b.displayName ||
            b.username ||
            ""
          ),
          "pt-BR"
        );
      }
    );
}

function getFilteredPlayers() {
  const sorted = getSortedPlayers();

  if (!searchTerm) {
    return sorted;
  }

  const search = normalizarTexto(
      searchTerm
    );

  return sorted.filter(
    player => {
      const displayName = normalizarTexto(
          player.displayName ||
          ""
        );

      const username = normalizarTexto(
          player.username ||
          ""
        );

      return (
        displayName.includes(
          search
        ) ||
        username.includes(
          search
        )
      );
    }
  );
}

function renderRanking() {
  const filteredPlayers = getFilteredPlayers();

  const totalPages = Math.max(
      1,
      Math.ceil(
        filteredPlayers.length /
        PER_PAGE
      )
    );

  if (
    currentPage >
    totalPages
  ) {
    currentPage =
      totalPages;
  }

  if (
    currentPage <
    1
  ) {
    currentPage =
      1;
  }

  const start = (
      currentPage -
      1
    ) *
    PER_PAGE;

  const end = start +
    PER_PAGE;

  const pagePlayers = filteredPlayers.slice(
      start,
      end
    );

  rankingHeaderValue.textContent =
    rankingLabels[
      currentRanking
    ];

  rankingPage.textContent =
    currentPage;

  rankingPages.textContent =
    totalPages;

  rankingPrev.disabled =
    currentPage <= 1;

  rankingNext.disabled =
    currentPage >=
    totalPages;

  rankingEmpty.hidden =
    filteredPlayers.length >
    0;

  if (
    filteredPlayers.length ===
    0
  ) {
    rankingList.innerHTML =
      "";

    return;
  }

  const sortedAll = getSortedPlayers();

  rankingList.innerHTML =
    pagePlayers
      .map(
        player => {
          const position = sortedAll.findIndex(
              item =>
                String(
                  item.id
                ) ===
                String(
                  player.id
                )
            ) + 1;

          const isMe = highlightedUserId &&
            String(
              player.id
            ) ===
            String(
              highlightedUserId
            );

          return `
            <article
              class="ranking-player${isMe ? " ranking-player--me" : ""}"
              data-user-id="${escapeHTML(player.id)}"
            >

              <div
                class="
                  ranking-player__position
                  ranking-player__position--${
                    position <= 3
                      ? position
                      : "default"
                  }
                "
              >
                ${position}
              </div>

              <div class="ranking-player__profile">

                <img
                  class="ranking-player__avatar"
                  src="${escapeHTML(player.avatar)}"
                  alt=""
                  loading="lazy"
                >

                <div class="ranking-player__identity">

                  <strong class="ranking-player__name">
                    ${escapeHTML(
                      player.displayName ||
                      player.username ||
                      "Jogador"
                    )}
                  </strong>

                  <span class="ranking-player__username">
                    @${escapeHTML(
                      player.username ||
                      "desconhecido"
                    )}
                  </span>

                </div>

              </div>

              <strong class="ranking-player__value">
                ${formatValue(
                  player[
                    currentRanking
                  ]
                )}
              </strong>

            </article>
          `;
        }
      )
      .join("");
}

async function findMe() {
  if (!loggedUser) {
    await loadLoggedUser();
  }

  if (
    !loggedUser ||
    !loggedUser.id
  ) {
    window.location.href =
      `${API_BASE}/auth/discord`;

    return;
  }

  const sortedPlayers = getSortedPlayers();

  const index = sortedPlayers.findIndex(
      player =>
        String(
          player.id
        ) ===
        String(
          loggedUser.id
        )
    );

  if (
    index === -1
  ) {
    setStatus(
      "Seu perfil ainda não está no ranking."
    );

    setTimeout(
      hideStatus,
      2500
    );

    return;
  }

  const player = sortedPlayers[
      index
    ];

  const position = index + 1;

  searchTerm =
    "";

  rankingSearch.value =
    "";

  rankingSearchClear.hidden =
    true;

  currentPage =
    Math.floor(
      index /
      PER_PAGE
    ) + 1;

  highlightedUserId =
    String(
      loggedUser.id
    );

  renderMeCard(
    player,
    position
  );

  renderRanking();

  requestAnimationFrame(
    () => {
      const playerElement = document.querySelector(
          `[data-user-id="${CSS.escape(String(loggedUser.id))}"]`
        );

      if (
        playerElement
      ) {
        playerElement.scrollIntoView({
          behavior:
            "smooth",

          block:
            "center"
        });
      }
    }
  );
}

function renderMeCard(
  player,
  position
) {
  rankingMeAvatar.src =
    player.avatar ||
    "";

  rankingMeAvatar.alt =
    "";

  rankingMeName.textContent =
    player.displayName ||
    player.username ||
    "Jogador";

  rankingMeUsername.textContent =
    `@${player.username || "usuario"}`;

  rankingMeLabel.textContent =
    rankingLabels[
      currentRanking
    ];

  rankingMePosition.textContent =
    `#${position}`;

  rankingMe.hidden =
    false;
}

function updateMeCard() {
  if (
    !highlightedUserId
  ) {
    return;
  }

  const sortedPlayers = getSortedPlayers();

  const index = sortedPlayers.findIndex(
      player =>
        String(
          player.id
        ) ===
        String(
          highlightedUserId
        )
    );

  if (
    index === -1
  ) {
    rankingMe.hidden =
      true;

    return;
  }

  renderMeCard(
    sortedPlayers[index],
    index + 1
  );
}

function formatValue(value) {
  const number = Number(
      value ||
      0
    );

  if (
    currentRanking ===
    "lucro"
  ) {
    return number.toLocaleString(
      "pt-BR",
      {
        style:
          "currency",

        currency:
          "BRL"
      }
    );
  }

  return number.toLocaleString(
    "pt-BR"
  );
}

function normalizarTexto(value) {
  return String(
    value ??
    ""
  )
    .normalize(
      "NFD"
    )
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function setStatus(message) {
  rankingStatus.hidden =
    false;

  rankingStatus.textContent =
    message;
}

function hideStatus() {
  rankingStatus.hidden =
    true;
}

function escapeHTML(value) {
  return String(
    value ??
    ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}

tabs.forEach(
  tab => {
    tab.addEventListener(
      "click",
      () => {
        currentRanking =
          tab.dataset.ranking;

        currentPage =
          1;

        tabs.forEach(
          item => {
            item.classList.toggle(
              "is-active",
              item === tab
            );
          }
        );

        updateMeCard();

        renderRanking();
      }
    );
  }
);

rankingSearch.addEventListener(
  "input",
  event => {
    searchTerm =
      event.target.value;

    currentPage =
      1;

    rankingSearchClear.hidden =
      !searchTerm;

    renderRanking();
  }
);

rankingSearchClear.addEventListener(
  "click",
  () => {
    rankingSearch.value =
      "";

    searchTerm =
      "";

    currentPage =
      1;

    rankingSearchClear.hidden =
      true;

    rankingSearch.focus();

    renderRanking();
  }
);

rankingFindMe.addEventListener(
  "click",
  findMe
);

rankingPrev.addEventListener(
  "click",
  () => {
    if (
      currentPage <= 1
    ) {
      return;
    }

    currentPage -=
      1;

    renderRanking();

    rankingList.scrollIntoView({
      behavior:
        "smooth",

      block:
        "start"
    });
  }
);

rankingNext.addEventListener(
  "click",
  () => {
    const totalPages = Math.max(
        1,
        Math.ceil(
          getFilteredPlayers()
            .length /
          PER_PAGE
        )
      );

    if (
      currentPage >=
      totalPages
    ) {
      return;
    }

    currentPage +=
      1;

    renderRanking();

    rankingList.scrollIntoView({
      behavior:
        "smooth",

      block:
        "start"
    });
  }
);

loadRanking();
