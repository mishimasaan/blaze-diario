const API_BASE = "https://api.noturnos.xyz";

const STATS_API = `${API_BASE}/api/me/stats`;

const RANK_API = `${API_BASE}/api/rank`;

const PERSONAL_HISTORY_API = `${API_BASE}/api/me/historico`;

const HISTORY_FALLBACK_API = `${API_BASE}/api/historico`;

const DIARIOS_API = `${API_BASE}/api/diarios`;

let statsDiariosConfig = [];
let statsPartidasAtuais = [];
let statsPaginaAtual = 1;
const STATS_ITENS_POR_PAGINA = 3;

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
    "#stats-user-id",
    `ID: ${id || "—"}`
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
      stats.saldoLiquido ?? stats.lucroLiquido ?? stats.lucro
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

  await carregarHistoricoPessoal(id);

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

function statsEscaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statsFormatarData(data) {
  const partes = String(data || "").split("-");
  return partes.length === 3
    ? `${partes[2]}/${partes[1]}/${partes[0]}`
    : (data || "—");
}

function statsJogadorNaPartida(partida, userId) {
  const candidatos = [
    ...(Array.isArray(partida?.players) ? partida.players : []),
    partida?.foco,
    ...(Array.isArray(partida?.vencedores) ? partida.vencedores : []),
    ...(Array.isArray(partida?.maisKills) ? partida.maisKills : []),
    ...(Array.isArray(partida?.destaques) ? partida.destaques : [])
  ].filter(Boolean);

  return candidatos.find(
    jogador => String(jogador?.userId || jogador?.id || "") === String(userId)
  ) || null;
}

function statsNomeModo(partida) {
  const id = String(partida?.diarioId || partida?.modo || "").toLowerCase();
  if (id === "solo") return "Solo";
  if (id === "duo") return "Duo";
  return partida?.diarioNome || partida?.diarioId || partida?.modo || "Diário";
}

function statsExtrairListaHistorico(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.partidas)) return data.partidas;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.historico)) return data.historico;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function statsResumoHistorico(data) {
  if (!data || Array.isArray(data)) return null;
  return data.resumo || data.summary || data.estatisticas || data.stats || null;
}

function statsNumeroResumo(resumo, nomes) {
  if (!resumo) return null;
  for (const nome of nomes) {
    if (resumo[nome] !== undefined && resumo[nome] !== null) {
      const numero = Number(resumo[nome]);
      if (Number.isFinite(numero)) return numero;
    }
  }
  return null;
}

function statsNormalizarItemHistorico(item, userId) {
  const partida = item?.partida || item?.match || item;

  let jogador =
    item?.jogador ||
    item?.player ||
    item?.usuario ||
    statsJogadorNaPartida(partida, userId);

  if (!jogador && item && item !== partida && item.kills !== undefined) {
    jogador = item;
  }

  if (!jogador && partida?.userId && String(partida.userId) === String(userId)) {
    jogador = partida;
  }

  return { partida, jogador };
}

function statsFormatarPercentual(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return `${numero.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function statsFormatarMedia(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });
}

async function statsBuscarHistoricoPessoal(userId) {
  try {
    const response = await fetch(
      `${PERSONAL_HISTORY_API}?page=1&limit=5`,
      {
        credentials: "include",
        headers: { Accept: "application/json" },
        cache: "no-store"
      }
    );

    if (response.ok) {
      return {
        data: await response.json(),
        fallback: false
      };
    }

    if (![404, 405, 501].includes(response.status)) {
      throw new Error(`API pessoal retornou ${response.status}`);
    }
  } catch (error) {
    console.info("Histórico pessoal ainda não disponível; usando compatibilidade.", error);
  }

  const response = await fetch(HISTORY_FALLBACK_API, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API retornou ${response.status}`);
  }

  return {
    data: await response.json(),
    fallback: true
  };
}

async function statsCarregarConfigDiarios() {
  try {
    const response = await fetch(DIARIOS_API, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) return [];

    const data = await response.json();
    statsDiariosConfig = Array.isArray(data)
      ? data
      : Object.entries(data || {}).map(([id, diario]) => ({ id, ...diario }));

    return statsDiariosConfig;
  } catch {
    statsDiariosConfig = [];
    return [];
  }
}

function statsConfigDoDiario(partida) {
  const id = String(partida?.diarioId || partida?.modo || "").toLowerCase();
  return statsDiariosConfig.find(item => String(item?.id || "").toLowerCase() === id) || {};
}

function statsPrimeiroNumero(objetos, campos) {
  for (const objeto of objetos) {
    if (!objeto) continue;
    for (const campo of campos) {
      if (objeto[campo] === undefined || objeto[campo] === null || objeto[campo] === "") continue;
      const numero = Number(objeto[campo]);
      if (Number.isFinite(numero)) return numero;
    }
  }
  return null;
}

function statsEconomia(partida, jogador) {
  const config = statsConfigDoDiario(partida);

  const inscricao = statsPrimeiroNumero(
    [partida, jogador, config],
    ["precoInscricao", "valorInscricao", "entryFee", "preco"]
  );

  const valorKill = statsPrimeiroNumero(
    [partida, config],
    ["valorKill", "killValue", "premioKill"]
  );

  const valorBooyah = statsPrimeiroNumero(
    [partida, config],
    ["valorBooyah", "booyahValue", "premioBooyah"]
  );

  const kills = Number(jogador?.kills || 0);
  const venceu = Boolean(jogador?.venceu);

  const liquidoExplicito = statsPrimeiroNumero(
    [jogador, partida],
    ["saldoLiquido", "lucroLiquido", "profitNet", "netProfit", "resultadoLiquido"]
  );

  const brutoExplicito = statsPrimeiroNumero(
    [jogador, partida],
    ["premiacaoBruta", "premioBruto", "grossPrize", "recebido"]
  );

  const premioKills = valorKill === null ? null : kills * valorKill;
  const premioBooyah = valorBooyah === null ? null : (venceu ? valorBooyah : 0);

  let bruto = brutoExplicito;
  if (bruto === null && premioKills !== null && premioBooyah !== null) {
    bruto = premioKills + premioBooyah;
  }

  let liquido = liquidoExplicito;
  let estimado = false;

  if (liquido === null && bruto !== null && inscricao !== null) {
    liquido = bruto - inscricao;
    estimado = true;
  }

  if (liquido === null) {
    const legado = statsPrimeiroNumero([jogador], ["lucro"]);
    if (legado !== null) liquido = legado;
  }

  return {
    inscricao,
    valorKill,
    valorBooyah,
    premioKills,
    premioBooyah,
    bruto,
    liquido,
    estimado
  };
}

function statsClasseSaldo(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero === 0) return "";
  return numero > 0 ? "is-positive" : "is-negative";
}

function statsSaldoTexto(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return "—";
  if (numero > 0) return `+ ${formatarDinheiro(numero)}`;
  return formatarDinheiro(numero);
}

function statsAbrirDetalhe(index) {
  const item = statsPartidasAtuais[index];
  const drawer = document.querySelector("#stats-detail");
  const alvo = document.querySelector("#stats-detail-content");
  if (!item || !drawer || !alvo) return;

  const { partida, jogador } = item;
  const economia = statsEconomia(partida, jogador);
  const venceu = Boolean(jogador?.venceu);
  const mapa = partida?.mapaNome || "Mapa não informado";
  const imagem = partida?.imagemMapa ? `${API_BASE}${partida.imagemMapa}` : "";
  const nicks = Array.isArray(jogador?.nicks) ? jogador.nicks.join(", ") : (jogador?.nick || "—");

  const linhaEconomia = (label, valor, extra = "") => `
    <div class="stats-detail__economy-row">
      <span>${statsEscaparHTML(label)}</span>
      <strong>${statsEscaparHTML(valor)}${extra}</strong>
    </div>
  `;

  alvo.innerHTML = `
    <div class="stats-detail__content">
      <span class="stats-detail__eyebrow">Sua partida</span>
      <h2 class="stats-detail__title" id="stats-detail-title">${statsEscaparHTML(statsNomeModo(partida))}</h2>
      <div class="stats-detail__sub">#${statsEscaparHTML(partida?.id ?? "—")} • ${statsEscaparHTML(statsFormatarData(partida?.data || partida?.date))} • ${statsEscaparHTML(partida?.horario || "—")}</div>

      <div class="stats-detail__map">
        ${imagem ? `<img src="${statsEscaparHTML(imagem)}" alt="${statsEscaparHTML(mapa)}">` : ""}
        <span class="stats-detail__result ${venceu ? "stats-detail__result--win" : ""}">${venceu ? "Vitória" : "Derrota"}</span>
        <strong>${statsEscaparHTML(mapa)}</strong>
      </div>

      <div class="stats-detail__grid">
        <div class="stats-detail__metric"><span>Nick usado</span><strong>${statsEscaparHTML(nicks)}</strong></div>
        <div class="stats-detail__metric"><span>Kills</span><strong>${Number(jogador?.kills || 0)}</strong></div>
        <div class="stats-detail__metric"><span>Resultado</span><strong>${venceu ? "Vitória" : "Derrota"}</strong></div>
        <div class="stats-detail__metric ${economia.liquido < 0 ? "stats-detail__metric--negative" : economia.liquido > 0 ? "stats-detail__metric--positive" : ""}"><span>Saldo da partida</span><strong>${statsEscaparHTML(statsSaldoTexto(economia.liquido))}</strong></div>
      </div>

      <div class="stats-detail__economy">
        <h3>Conta da partida</h3>
        ${linhaEconomia("Inscrição", economia.inscricao === null ? "—" : `- ${formatarDinheiro(economia.inscricao)}`)}
        ${linhaEconomia("Kills", economia.premioKills === null ? "—" : `+ ${formatarDinheiro(economia.premioKills)}`)}
        ${linhaEconomia("Booyah", economia.premioBooyah === null ? "—" : `+ ${formatarDinheiro(economia.premioBooyah)}`)}
        ${linhaEconomia("Premiação bruta", economia.bruto === null ? "—" : formatarDinheiro(economia.bruto))}
        <div class="stats-detail__economy-row stats-detail__economy-row--total">
          <span>Saldo líquido</span>
          <strong class="${statsClasseSaldo(economia.liquido)}">${statsEscaparHTML(statsSaldoTexto(economia.liquido))}</strong>
        </div>
        <p class="stats-detail__note">Saldo líquido = premiação por kills + Booyah − inscrição. Se a API ainda não enviar os valores históricos da partida, o site usa os dados disponíveis como compatibilidade.</p>
      </div>
    </div>
  `;

  drawer.hidden = false;
  document.body.classList.add("stats-detail-open");
}

function statsFecharDetalhe() {
  const drawer = document.querySelector("#stats-detail");
  if (drawer) drawer.hidden = true;
  document.body.classList.remove("stats-detail-open");
}

document.addEventListener("click", event => {
  const abrir = event.target.closest("[data-stats-match-index]");
  if (abrir) {
    event.preventDefault();
    statsAbrirDetalhe(Number(abrir.dataset.statsMatchIndex));
    return;
  }

  const pagina = event.target.closest("[data-stats-history-page]");
  if (pagina) {
    statsPaginaAtual = Number(pagina.dataset.statsHistoryPage) || 1;
    statsRenderizarPaginaHistorico();
    return;
  }

  if (event.target.closest("#stats-history-prev")) {
    statsPaginaAtual -= 1;
    statsRenderizarPaginaHistorico();
    return;
  }

  if (event.target.closest("#stats-history-next")) {
    statsPaginaAtual += 1;
    statsRenderizarPaginaHistorico();
    return;
  }

  if (event.target.closest("[data-stats-detail-close]")) {
    statsFecharDetalhe();
  }
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") statsFecharDetalhe();
});

function statsRenderizarPaginaHistorico() {
  const listHistory = document.querySelector("#stats-history-list");
  const pager = document.querySelector("#stats-history-pager");
  const pages = document.querySelector("#stats-history-pages");
  const prev = document.querySelector("#stats-history-prev");
  const next = document.querySelector("#stats-history-next");

  if (!listHistory) return;

  const totalPaginas = Math.max(1, Math.ceil(statsPartidasAtuais.length / STATS_ITENS_POR_PAGINA));
  statsPaginaAtual = Math.min(Math.max(1, statsPaginaAtual), totalPaginas);

  const inicio = (statsPaginaAtual - 1) * STATS_ITENS_POR_PAGINA;
  const itens = statsPartidasAtuais.slice(inicio, inicio + STATS_ITENS_POR_PAGINA);

  listHistory.innerHTML = itens.map(({ partida, jogador }, localIndex) => {
    const index = inicio + localIndex;
    const venceu = Boolean(jogador?.venceu);
    const imagem = partida?.imagemMapa ? `${API_BASE}${partida.imagemMapa}` : "";
    const mapa = partida?.mapaNome || "Mapa não informado";
    const economia = statsEconomia(partida, jogador);

    return `
      <button class="stats-recent-row" type="button" data-stats-match-index="${index}">
        <div class="stats-recent-row__thumb">
          ${imagem ? `<img src="${statsEscaparHTML(imagem)}" alt="">` : ""}
        </div>

        <div class="stats-recent-row__main">
          <strong>${statsEscaparHTML(statsFormatarData(partida?.data || partida?.date))} • ${statsEscaparHTML(partida?.horario || "—")}</strong>
          <span>${statsEscaparHTML(mapa)} <i></i> ${statsEscaparHTML(statsNomeModo(partida))}</span>
        </div>

        <div class="stats-recent-row__stat stats-recent-row__kills">
          <img src="./assets/icons/skull.svg" alt="">
          <strong>${Number(jogador?.kills || 0)}</strong>
          <span>kills</span>
        </div>

        <div class="stats-recent-row__stat stats-recent-row__profit ${statsClasseSaldo(economia.liquido)}">
          <strong>${statsEscaparHTML(statsSaldoTexto(economia.liquido))}</strong>
          <span>saldo</span>
        </div>

        <div class="stats-recent-row__result ${venceu ? "stats-recent-row__result--win" : ""}">
          ${venceu ? "Vitória" : "Derrota"}
        </div>

        <span class="stats-recent-row__arrow" aria-hidden="true">
          <img src="./assets/icons/chevron-right.svg" alt="">
        </span>
      </button>
    `;
  }).join("");

  if (pager) {
    pager.hidden = totalPaginas <= 1;
  }

  if (pages) {
    pages.innerHTML = Array.from({ length: totalPaginas }, (_, i) => i + 1)
      .map(pagina => `<button type="button" class="${pagina === statsPaginaAtual ? "is-active" : ""}" data-stats-history-page="${pagina}">${pagina}</button>`)
      .join("");
  }

  if (prev) prev.disabled = statsPaginaAtual <= 1;
  if (next) next.disabled = statsPaginaAtual >= totalPaginas;
}

async function carregarHistoricoPessoal(userId) {
  const loadingHistory = document.querySelector("#stats-history-loading");
  const emptyHistory = document.querySelector("#stats-history-empty");
  const listHistory = document.querySelector("#stats-history-list");
  const bestMatch = document.querySelector("#stats-best-match");

  if (!userId || !listHistory) return;

  try {
    await statsCarregarConfigDiarios();

    const resultado = await statsBuscarHistoricoPessoal(userId);
    const listaOriginal = statsExtrairListaHistorico(resultado.data);

    const partidas = listaOriginal
      .map(item => statsNormalizarItemHistorico(item, userId))
      .filter(item => resultado.fallback ? Boolean(item.jogador) : Boolean(item.partida))
      .map(item => {
        if (!item.jogador && !resultado.fallback) {
          item.jogador = item.partida?.jogador || item.partida?.player || item.partida?.foco || item.partida;
        }
        return item;
      })
      .sort((a, b) => {
        const ad = `${a.partida?.data || a.partida?.date || ""}T${a.partida?.horario || "00:00"}`;
        const bd = `${b.partida?.data || b.partida?.date || ""}T${b.partida?.horario || "00:00"}`;
        return bd.localeCompare(ad);
      });

    statsPartidasAtuais = partidas.slice(0, 5);

    const resumo = statsResumoHistorico(resultado.data);

    const derivados = {
      total: partidas.length,
      vitorias: partidas.filter(item => Boolean(item.jogador?.venceu)).length,
      kills: partidas.reduce((total, item) => total + Number(item.jogador?.kills || 0), 0),
      lucro: partidas.reduce((total, item) => total + Number(statsEconomia(item.partida, item.jogador).liquido || 0), 0)
    };

    const totalAPI =
      statsNumeroResumo(resumo, ["totalPartidas", "partidas", "total", "games"]) ??
      (!resultado.fallback && Number.isFinite(Number(resultado.data?.total)) ? Number(resultado.data.total) : derivados.total);

    const paginaLimitada =
      !resultado.fallback && Number.isFinite(Number(resultado.data?.total)) && Number(resultado.data.total) > partidas.length;

    const vitorias = statsNumeroResumo(resumo, ["vitorias", "wins", "totalVitorias"]) ?? (paginaLimitada ? null : derivados.vitorias);
    const kills = statsNumeroResumo(resumo, ["kills", "totalKills", "abates"]) ?? (paginaLimitada ? null : derivados.kills);

    const lucro =
      statsNumeroResumo(resumo, ["saldoLiquido", "lucroLiquido", "profitNet", "netProfit", "resultadoLiquido"]) ??
      (paginaLimitada ? null : derivados.lucro);

    const winrate = statsNumeroResumo(resumo, ["winrate", "taxaVitoria", "winRate"]) ?? (vitorias !== null && totalAPI > 0 ? (vitorias / totalAPI) * 100 : null);
    const mediaKills = statsNumeroResumo(resumo, ["mediaKills", "killsMedia", "averageKills"]) ?? (kills !== null && totalAPI > 0 ? kills / totalAPI : null);

    atualizarTexto("#stats-history-games", Number(totalAPI || 0).toLocaleString("pt-BR"));
    atualizarTexto("#stats-partidas", Number(totalAPI || 0).toLocaleString("pt-BR"));
    atualizarTexto("#stats-history-wins", vitorias === null ? "—" : Number(vitorias).toLocaleString("pt-BR"));
    atualizarTexto("#stats-history-kills", kills === null ? "—" : Number(kills).toLocaleString("pt-BR"));
    atualizarTexto("#stats-history-profit", lucro === null ? "—" : statsSaldoTexto(lucro));
    atualizarTexto("#stats-history-winrate", statsFormatarPercentual(winrate));
    atualizarTexto("#stats-history-kdavg", statsFormatarMedia(mediaKills));

    if (loadingHistory) loadingHistory.hidden = true;

    if (!partidas.length) {
      if (emptyHistory) emptyHistory.hidden = false;
      listHistory.innerHTML = "";
      if (bestMatch) bestMatch.innerHTML = '<div class="stats-best__empty">Ainda não há partidas suficientes para destacar.</div>';
      return;
    }

    if (emptyHistory) emptyHistory.hidden = true;

    const melhor = [...statsPartidasAtuais].sort((a, b) => {
      const saldoA = Number(statsEconomia(a.partida, a.jogador).liquido || 0);
      const saldoB = Number(statsEconomia(b.partida, b.jogador).liquido || 0);
      if (saldoB !== saldoA) return saldoB - saldoA;
      const ak = Number(a.jogador?.kills || 0);
      const bk = Number(b.jogador?.kills || 0);
      return bk - ak;
    })[0];

    if (bestMatch && melhor) {
      const index = statsPartidasAtuais.indexOf(melhor);
      const { partida, jogador } = melhor;
      const venceu = Boolean(jogador?.venceu);
      const imagem = partida?.imagemMapa ? `${API_BASE}${partida.imagemMapa}` : "";
      const mapa = partida?.mapaNome || "Mapa não informado";
      const economia = statsEconomia(partida, jogador);

      bestMatch.innerHTML = `
        <div class="stats-best__inner">
          <div class="stats-best__media">
            ${imagem ? `<img src="${statsEscaparHTML(imagem)}" alt="${statsEscaparHTML(mapa)}">` : ""}
            <strong class="stats-best__map">${statsEscaparHTML(mapa)}</strong>
          </div>

          <div class="stats-best__body">
            <span class="stats-best__label">Melhor entre as recentes</span>
            <span class="stats-best__result ${venceu ? "" : "stats-best__result--loss"}">${venceu ? "✓ Vitória" : "Derrota"}</span>
            <h3 class="stats-best__title">${statsEscaparHTML(statsNomeModo(partida))}</h3>
            <div class="stats-best__meta">${statsEscaparHTML(statsFormatarData(partida?.data || partida?.date))} • ${statsEscaparHTML(partida?.horario || "—")}</div>

            <div class="stats-best__numbers">
              <span class="stats-best__kills"><img src="./assets/icons/skull.svg" alt=""><strong>${Number(jogador?.kills || 0)}</strong> kills</span>
              <span class="${statsClasseSaldo(economia.liquido)}"><strong>${statsEscaparHTML(statsSaldoTexto(economia.liquido))}</strong></span>
            </div>

            <button class="stats-best__link" type="button" data-stats-match-index="${index}">Ver partida <img src="./assets/icons/chevron-right.svg" alt=""></button>
          </div>
        </div>
      `;
    }

    statsPaginaAtual = 1;
    statsRenderizarPaginaHistorico();
  } catch (error) {
    if (loadingHistory) loadingHistory.hidden = true;
    if (emptyHistory) {
      emptyHistory.hidden = false;
      emptyHistory.textContent = "Não foi possível carregar seu histórico agora.";
    }
    if (bestMatch) bestMatch.innerHTML = '<div class="stats-best__empty">Não foi possível carregar o destaque agora.</div>';
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
