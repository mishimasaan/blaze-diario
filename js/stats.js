const API_BASE = "https://api.noturnos.xyz";

const STATS_API = `${API_BASE}/api/me/stats`;

const RANK_API = `${API_BASE}/api/rank`;

const loading = document.querySelector(
    "#stats-loading"
  );

const errorBox = document.querySelector(
    "#stats-error"
  );

const errorText = document.querySelector(
    "#stats-error-text"
  );

const content = document.querySelector(
    "#stats-content"
  );

function formatarDinheiro(valor) {
  return new Intl.NumberFormat(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  ).format(
    Number(valor) || 0
  );
}

function avatarPadrao(id) {
  try {
    return `https://cdn.discordapp.com/embed/avatars/${
      Number(
        BigInt(id) >> 22n
      ) % 6
    }.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

function atualizarTexto(
  seletor,
  valor
) {
  const elemento = document.querySelector(
      seletor
    );

  if (!elemento) {
    return;
  }

  elemento.textContent =
    valor;
}

function mostrarErro(mensagem) {
  if (loading) {
    loading.hidden =
      true;
  }

  if (content) {
    content.hidden =
      true;
  }

  if (errorText) {
    errorText.textContent =
      mensagem;
  }

  if (errorBox) {
    errorBox.hidden =
      false;
  }
}

function normalizarRank(dados) {
  if (
    Array.isArray(
      dados
    )
  ) {
    return dados;
  }

  if (
    dados &&
    Array.isArray(
      dados.rank
    )
  ) {
    return dados.rank;
  }

  if (
    dados &&
    Array.isArray(
      dados.ranking
    )
  ) {
    return dados.ranking;
  }

  return [];
}

function calcularPosicao(
  ranking,
  userId,
  campo
) {
  const usuario = ranking.find(
      player =>
        String(
          player.id
        ) ===
        String(
          userId
        )
    );

  if (!usuario) {
    return null;
  }

  const valorUsuario = Number(
      usuario[campo]
    ) || 0;

  if (
    valorUsuario <= 0
  ) {
    return null;
  }

  const ordenado = [...ranking]
      .sort(
        (a, b) =>
          (
            Number(
              b[campo]
            ) || 0
          ) -
          (
            Number(
              a[campo]
            ) || 0
          )
      );

  const index = ordenado.findIndex(
      player =>
        String(
          player.id
        ) ===
        String(
          userId
        )
    );

  if (
    index === -1
  ) {
    return null;
  }

  return index + 1;
}

async function carregarRankings(userId) {
  try {
    const response = await fetch(
        RANK_API,
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
      return {
        wins: null,
        kills: null,
        lucro: null
      };
    }

    const data = await response.json();

    const ranking = normalizarRank(
        data
      );

    return {
      wins:
        calcularPosicao(
          ranking,
          userId,
          "wins"
        ),

      kills:
        calcularPosicao(
          ranking,
          userId,
          "kills"
        ),

      lucro:
        calcularPosicao(
          ranking,
          userId,
          "lucro"
        )
    };
  } catch {
    return {
      wins: null,
      kills: null,
      lucro: null
    };
  }
}

async function renderizarStats(data) {
  const perfil = data.perfil ||
    data.user ||
    data.discord ||
    {};

  const stats = data.stats ||
    {};

  const id = String(
      perfil.id ||
      ""
    );

  const avatar = perfil.avatar ||
    avatarPadrao(
      id
    );

  const displayName = perfil.displayName ||
    perfil.global_name ||
    perfil.globalName ||
    perfil.username ||
    "Jogador";

  const username = perfil.username ||
    "usuario";

  const avatarElement = document.querySelector(
      "#stats-avatar"
    );

  if (avatarElement) {
    avatarElement.src =
      avatar;

    avatarElement.alt =
      `Avatar de ${displayName}`;
  }

  atualizarTexto(
    "#stats-display-name",
    displayName
  );

  atualizarTexto(
    "#stats-username",
    `@${username}`
  );

  atualizarTexto(
    "#stats-booyahs",
    Number(
      stats.booyahs
    ) || 0
  );

  atualizarTexto(
    "#stats-kills",
    Number(
      stats.kills
    ) || 0
  );

  atualizarTexto(
    "#stats-lucro",
    formatarDinheiro(
      stats.lucro
    )
  );

  const rankings = await carregarRankings(
      id
    );

  atualizarTexto(
    "#stats-rank-wins",
    rankings.wins
      ? `#${rankings.wins}`
      : "—"
  );

  atualizarTexto(
    "#stats-rank-kills",
    rankings.kills
      ? `#${rankings.kills}`
      : "—"
  );

  atualizarTexto(
    "#stats-rank-lucro",
    rankings.lucro
      ? `#${rankings.lucro}`
      : "—"
  );

  if (loading) {
    loading.hidden =
      true;
  }

  if (errorBox) {
    errorBox.hidden =
      true;
  }

  if (content) {
    content.hidden =
      false;
  }
}

async function carregarStats() {
  try {
    const response = await fetch(
        STATS_API,
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

    const data = await response
        .json()
        .catch(
          () => ({})
        );

    if (
      response.status === 401
    ) {
      mostrarErro(
        "Conecte seu Discord para visualizar suas estatísticas."
      );

      return;
    }

    if (!response.ok) {
      throw new Error(
        data.erro ||
        "Não foi possível carregar seu perfil."
      );
    }

    await renderizarStats(
      data
    );
  } catch (error) {
    mostrarErro(
      error.message
    );
  }
}

carregarStats();
