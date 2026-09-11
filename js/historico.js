const HISTORICO_API_BASE = "https://api.blazediarios.com";
const HISTORICO_API = `${HISTORICO_API_BASE}/api/historico`;

const historicoState = {
  partidas: [],
  filtradas: [],
  pagina: 1,
  limite: 10,
  total: 0,
  totalPaginas: 1,
  serverMode: false,
  carregando: false,
  resumo: null
};

const historicoEls = {
  totalPartidas: document.querySelector("#historico-total-partidas"),
  totalParticipacoes: document.querySelector("#historico-total-participacoes"),
  totalVitorias: document.querySelector("#historico-total-vitorias"),
  filtroModo: document.querySelector("#historico-filtro-modo"),
  busca: document.querySelector("#historico-busca"),
  limpar: document.querySelector("#historico-limpar"),
  contagem: document.querySelector("#historico-contagem"),
  loading: document.querySelector("#historico-loading"),
  empty: document.querySelector("#historico-empty"),
  tableWrap: document.querySelector("#historico-table-wrap"),
  tbody: document.querySelector("#historico-tbody"),
  cards: document.querySelector("#historico-cards"),
  modal: document.querySelector("#historico-modal"),
  detalhes: document.querySelector("#historico-detalhes"),
  pagination: document.querySelector("#historico-pagination"),
  prev: document.querySelector("#historico-prev"),
  next: document.querySelector("#historico-next"),
  pageInfo: document.querySelector("#historico-page-info")
};

function historicoEscaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function historicoFormatarData(data) {
  if (!data) {
    return "—";
  }

  const partes = String(data).split("-");

  if (partes.length !== 3) {
    return data;
  }

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function historicoNomeModo(partida) {
  const id = String(partida?.diarioId || "").toLowerCase();

  if (id === "solo") {
    return "Solo";
  }

  if (id === "duo") {
    return "Duo";
  }

  return partida?.diarioNome || partida?.diarioId || "—";
}

function historicoAvatar(jogador) {
  return jogador?.avatar || "";
}

function historicoNomeJogador(jogador) {
  return (
    jogador?.displayName ||
    jogador?.username ||
    jogador?.nicks?.[0] ||
    "Jogador"
  );
}

function historicoSubtituloJogador(jogador) {
  if (jogador?.nicks?.length) {
    return jogador.nicks.join(", ");
  }

  if (jogador?.username) {
    return `@${jogador.username}`;
  }

  return "";
}

function historicoImagemMapa(partida) {
  if (!partida?.imagemMapa) {
    return "";
  }

  if (/^https?:\/\//i.test(partida.imagemMapa)) {
    return partida.imagemMapa;
  }

  return `${HISTORICO_API_BASE}${partida.imagemMapa}`;
}

function historicoVencedorPrincipal(partida) {
  if (Array.isArray(partida?.vencedores) && partida.vencedores.length) {
    return partida.vencedores[0];
  }

  return null;
}

function historicoMaiorKill(partida) {
  if (Array.isArray(partida?.maisKills) && partida.maisKills.length) {
    return partida.maisKills[0];
  }

  const destaques = Array.isArray(partida?.destaques)
    ? partida.destaques
    : [];

  if (!destaques.length) {
    return null;
  }

  return [...destaques].sort(
    (a, b) => Number(b?.kills || 0) - Number(a?.kills || 0)
  )[0];
}

function historicoJogadoresDaPartida(partida) {
  const jogadores = [];
  const ids = new Set();

  const adicionar = jogador => {
    if (!jogador) {
      return;
    }

    const chave = String(
      jogador.userId ||
      jogador.username ||
      jogador.displayName ||
      jogador.nicks?.join("|") ||
      ""
    );

    if (!chave || ids.has(chave)) {
      return;
    }

    ids.add(chave);
    jogadores.push(jogador);
  };

  adicionar(partida?.foco);

  (partida?.vencedores || []).forEach(adicionar);
  (partida?.maisKills || []).forEach(adicionar);
  (partida?.destaques || []).forEach(adicionar);

  return jogadores;
}

function historicoPartidaCombinaBusca(partida, termo) {
  if (!termo) {
    return true;
  }

  const texto = historicoJogadoresDaPartida(partida)
    .flatMap(jogador => [
      jogador?.displayName,
      jogador?.username,
      ...(jogador?.nicks || [])
    ])
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return texto.includes(termo);
}

function historicoExtrairLista(dados) {
  if (Array.isArray(dados)) return dados;
  if (Array.isArray(dados?.partidas)) return dados.partidas;
  if (Array.isArray(dados?.items)) return dados.items;
  if (Array.isArray(dados?.data)) return dados.data;
  return [];
}

function historicoExtrairResumo(dados) {
  if (!dados || Array.isArray(dados)) return null;
  return dados.resumo || dados.summary || dados.estatisticas || null;
}

function historicoNumeroResumo(resumo, nomes) {
  if (!resumo) return null;

  for (const nome of nomes) {
    if (resumo[nome] !== undefined && resumo[nome] !== null) {
      const numero = Number(resumo[nome]);
      if (Number.isFinite(numero)) return numero;
    }
  }

  return null;
}

function historicoOrdenar(partidas) {
  return [...partidas].sort((a, b) => {
    const aData = `${a?.data || a?.date || ""}T${a?.horario || "00:00"}`;
    const bData = `${b?.data || b?.date || ""}T${b?.horario || "00:00"}`;
    return bData.localeCompare(aData);
  });
}

function historicoQueryURL() {
  const params = new URLSearchParams();
  params.set("page", String(historicoState.pagina));
  params.set("limit", String(historicoState.limite));

  const modo = historicoEls.filtroModo?.value || "todos";
  const busca = historicoEls.busca?.value.trim() || "";

  if (modo !== "todos") params.set("modo", modo);
  if (busca) params.set("q", busca);

  return `${HISTORICO_API}?${params.toString()}`;
}

function historicoAtualizarPaginacao() {
  if (!historicoEls.pagination) return;

  const totalPaginas = Math.max(1, Number(historicoState.totalPaginas) || 1);
  const pagina = Math.min(Math.max(1, historicoState.pagina), totalPaginas);

  historicoEls.pagination.hidden = historicoState.total <= historicoState.limite;
  historicoEls.pageInfo.textContent = `Página ${pagina} de ${totalPaginas}`;
  historicoEls.prev.disabled = pagina <= 1 || historicoState.carregando;
  historicoEls.next.disabled = pagina >= totalPaginas || historicoState.carregando;
}

function historicoAtualizarStats() {
  const partidas = historicoState.partidas;
  const resumo = historicoState.resumo;

  const totalPartidasResumo = historicoNumeroResumo(
    resumo,
    ["totalPartidas", "partidas", "total", "games"]
  );

  const participacoesResumo = historicoNumeroResumo(
    resumo,
    ["totalParticipacoes", "participacoes", "jogadores", "players"]
  );

  const vitoriasResumo = historicoNumeroResumo(
    resumo,
    ["totalVitorias", "vitorias", "wins"]
  );

  const totalParticipacoesLocal = partidas.reduce(
    (total, partida) => total + Number(partida?.totalParticipantes || 0),
    0
  );

  const totalVitoriasLocal = partidas.reduce(
    (total, partida) =>
      total + (Array.isArray(partida?.vencedores) ? partida.vencedores.length : 0),
    0
  );

  const totalPartidas = totalPartidasResumo ?? historicoState.total ?? partidas.length;

  historicoEls.totalPartidas.textContent = Number(totalPartidas || 0).toLocaleString("pt-BR");

  
  historicoEls.totalParticipacoes.textContent =
    participacoesResumo !== null
      ? Number(participacoesResumo).toLocaleString("pt-BR")
      : (historicoState.serverMode ? "—" : totalParticipacoesLocal.toLocaleString("pt-BR"));

  historicoEls.totalVitorias.textContent =
    vitoriasResumo !== null
      ? Number(vitoriasResumo).toLocaleString("pt-BR")
      : (historicoState.serverMode ? "—" : totalVitoriasLocal.toLocaleString("pt-BR"));
}

function historicoRenderVencedor(partida) {
  const vencedor = historicoVencedorPrincipal(partida);

  if (!vencedor) {
    return '<span class="historico-muted">Sem vencedor</span>';
  }

  const avatar = historicoAvatar(vencedor);

  return `
    <span class="historico-winner">
      ${
        avatar
          ? `<img src="${historicoEscaparHTML(avatar)}" alt="">`
          : ""
      }
      <span>${historicoEscaparHTML(historicoNomeJogador(vencedor))}</span>
    </span>
  `;
}

function historicoRenderTabela(partidas) {
  const offset = (historicoState.pagina - 1) * historicoState.limite;

  historicoEls.tbody.innerHTML = partidas
    .map((partida, index) => `
      <tr>
        <td>${offset + index + 1}</td>
        <td>${historicoEscaparHTML(historicoFormatarData(partida.data))}</td>
        <td>${historicoEscaparHTML(partida.horario || "—")}</td>
        <td>
          <span class="historico-mode">
            ${historicoEscaparHTML(historicoNomeModo(partida))}
          </span>
        </td>
        <td>
          ${
            partida.mapaNome
              ? `<span class="historico-map">${historicoEscaparHTML(partida.mapaNome)}</span>`
              : '<span class="historico-muted">Não informado</span>'
          }
        </td>
        <td>${Number(partida.totalParticipantes || 0)}</td>
        <td>${historicoRenderVencedor(partida)}</td>
        <td>
          <button
            class="historico-details-button"
            type="button"
            data-historico-id="${historicoEscaparHTML(partida.id)}"
          >
            Ver detalhes <span class="icon icon--arrow-right" aria-hidden="true"></span>
          </button>
        </td>
      </tr>
    `)
    .join("");
}

function historicoRenderCards(partidas) {
  historicoEls.cards.innerHTML = partidas
    .map(partida => `
      <article class="historico-mobile-card">
        <div class="historico-mobile-card__top">
          <span class="historico-mobile-card__date">
            ${historicoEscaparHTML(historicoFormatarData(partida.data))}
          </span>
          <span class="historico-mode">
            ${historicoEscaparHTML(historicoNomeModo(partida))}
          </span>
        </div>

        <div class="historico-mobile-card__meta">
          <span>${historicoEscaparHTML(partida.horario || "—")}</span>
          <span>${historicoEscaparHTML(partida.mapaNome || "Mapa não informado")}</span>
          <span>${Number(partida.totalParticipantes || 0)} jogadores</span>
        </div>

        <div class="historico-mobile-card__bottom">
          <div>${historicoRenderVencedor(partida)}</div>

          <button
            class="historico-details-button"
            type="button"
            data-historico-id="${historicoEscaparHTML(partida.id)}"
          >
            Detalhes <span class="icon icon--arrow-right" aria-hidden="true"></span>
          </button>
        </div>
      </article>
    `)
    .join("");
}

function historicoRenderLista() {
  const partidas = historicoState.filtradas;

  historicoEls.loading.hidden = true;
  historicoEls.contagem.textContent = `${Number(historicoState.total || partidas.length).toLocaleString("pt-BR")} ${
    Number(historicoState.total || partidas.length) === 1 ? "partida" : "partidas"
  }`;

  if (!partidas.length) {
    historicoEls.empty.hidden = false;
    historicoEls.tableWrap.hidden = true;
    historicoEls.cards.hidden = true;
    historicoEls.tbody.innerHTML = "";
    historicoEls.cards.innerHTML = "";
    historicoAtualizarPaginacao();
    return;
  }

  historicoEls.empty.hidden = true;
  historicoEls.tableWrap.hidden = false;
  historicoEls.cards.hidden = false;

  historicoRenderTabela(partidas);
  historicoRenderCards(partidas);
  historicoAtualizarPaginacao();
}

function historicoAplicarFiltrosLocais() {
  const modo = historicoEls.filtroModo.value;
  const termo = historicoEls.busca.value.trim().toLowerCase();

  const todasFiltradas = historicoState.partidas.filter(partida => {
    const modoPartida = String(partida?.diarioId || "").toLowerCase();
    const passaModo = modo === "todos" || modoPartida === modo;
    const passaBusca = historicoPartidaCombinaBusca(partida, termo);
    return passaModo && passaBusca;
  });

  historicoState.total = todasFiltradas.length;
  historicoState.totalPaginas = Math.max(
    1,
    Math.ceil(todasFiltradas.length / historicoState.limite)
  );

  if (historicoState.pagina > historicoState.totalPaginas) {
    historicoState.pagina = historicoState.totalPaginas;
  }

  const inicio = (historicoState.pagina - 1) * historicoState.limite;
  historicoState.filtradas = todasFiltradas.slice(inicio, inicio + historicoState.limite);
  historicoRenderLista();
}

async function historicoAplicarFiltros() {
  if (historicoState.serverMode) {
    await historicoCarregarPagina();
    return;
  }

  historicoAplicarFiltrosLocais();
}

function historicoRenderPlayer(jogador) {
  if (!jogador) {
    return '<span class="historico-muted">Não informado</span>';
  }

  const avatar = historicoAvatar(jogador);

  return `
    <div class="historico-player">
      ${
        avatar
          ? `<img src="${historicoEscaparHTML(avatar)}" alt="">`
          : ""
      }

      <div class="historico-player__info">
        <strong>${historicoEscaparHTML(historicoNomeJogador(jogador))}</strong>
        <span>${historicoEscaparHTML(historicoSubtituloJogador(jogador))}</span>
      </div>
    </div>
  `;
}

function historicoRenderDetalhes(partida) {
  const imagemMapa = historicoImagemMapa(partida);
  const vencedor = historicoVencedorPrincipal(partida);
  const maiorKill = historicoMaiorKill(partida);
  const destaques = Array.isArray(partida?.destaques)
    ? partida.destaques
    : [];

  historicoEls.detalhes.innerHTML = `
    <header class="historico-detail">
      <span class="historico-detail__eyebrow">Detalhes da partida</span>

      <h2 class="historico-detail__title" id="historico-detalhes-titulo">
        ${historicoEscaparHTML(partida.diarioNome || historicoNomeModo(partida))}
        <span class="historico-detail__id">#${historicoEscaparHTML(partida.id)}</span>
      </h2>

      <span class="historico-detail__status">Finalizada</span>
    </header>

    <article class="historico-map-card">
      ${
        imagemMapa
          ? `<img src="${historicoEscaparHTML(imagemMapa)}" alt="${historicoEscaparHTML(partida.mapaNome || "Mapa")}">`
          : '<div class="historico-map-card__fallback">Mapa não informado</div>'
      }

      <div class="historico-map-card__label">
        <strong>${historicoEscaparHTML(partida.mapaNome || "Mapa não informado")}</strong>
        <span>${historicoEscaparHTML(partida.diarioNome || historicoNomeModo(partida))}</span>
      </div>
    </article>

    <div class="historico-detail__grid">
      <article class="historico-detail-card">
        <span>Data</span>
        <strong>${historicoEscaparHTML(historicoFormatarData(partida.data))}</strong>
      </article>

      <article class="historico-detail-card">
        <span>Horário</span>
        <strong>${historicoEscaparHTML(partida.horario || "—")}</strong>
      </article>

      <article class="historico-detail-card">
        <span>Jogadores</span>
        <strong>${Number(partida.totalParticipantes || 0)}</strong>
      </article>

      <article class="historico-detail-card">
        <span>Modo</span>
        <strong>${historicoEscaparHTML(historicoNomeModo(partida))}</strong>
      </article>
    </div>

    <section class="historico-detail-section">
      <h3>Destaques</h3>

      <div class="historico-detail-highlight">
        <article class="historico-featured">
          <span class="historico-featured__label">Vencedor</span>
          ${historicoRenderPlayer(vencedor)}
        </article>

        <article class="historico-featured">
          <span class="historico-featured__label">Mais kills</span>
          ${historicoRenderPlayer(maiorKill)}
          ${
            maiorKill
              ? `<span class="historico-featured__label" style="margin:10px 0 0">${Number(maiorKill.kills || 0)} kills</span>`
              : ""
          }
        </article>
      </div>
    </section>

    <section class="historico-detail-section">
      <h3>Classificação registrada</h3>

      ${
        destaques.length
          ? `
            <table class="historico-ranking">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Jogador</th>
                  <th>Kills</th>
                </tr>
              </thead>
              <tbody>
                ${destaques
                  .map((jogador, index) => `
                    <tr>
                      <td class="historico-ranking__position">
                        #${historicoEscaparHTML(jogador.posicao ?? index + 1)}
                      </td>
                      <td>${historicoRenderPlayer(jogador)}</td>
                      <td class="historico-ranking__kills">
                        ${Number(jogador.kills || 0)}
                      </td>
                    </tr>
                  `)
                  .join("")}
              </tbody>
            </table>
          `
          : '<div class="historico-empty">Nenhum destaque registrado para esta partida.</div>'
      }
    </section>
  `;
}

async function historicoAbrirDetalhes(id) {
  const partidaLocal = historicoState.partidas.find(
    partida => String(partida.id) === String(id)
  );

  historicoEls.modal.hidden = false;
  document.body.classList.add("historico-modal-open");

  historicoEls.detalhes.innerHTML = `
    <div class="historico-loading">Carregando detalhes...</div>
  `;

  try {
    const response = await fetch(
      `${HISTORICO_API}/${encodeURIComponent(id)}`,
      {
        headers: {
          Accept: "application/json"
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      throw new Error(`API retornou ${response.status}`);
    }

    const partida = await response.json();
    historicoRenderDetalhes(partida || partidaLocal);
  } catch (error) {
    if (partidaLocal) {
      historicoRenderDetalhes(partidaLocal);
      return;
    }

    historicoEls.detalhes.innerHTML = `
      <div class="historico-empty">
        Não foi possível carregar os detalhes da partida.
      </div>
    `;
  }
}

function historicoFecharDetalhes() {
  historicoEls.modal.hidden = true;
  document.body.classList.remove("historico-modal-open");
}

async function historicoCarregarPagina() {
  if (historicoState.carregando) return;

  historicoState.carregando = true;
  historicoAtualizarPaginacao();
  historicoEls.loading.hidden = false;
  historicoEls.empty.hidden = true;

  try {
    const response = await fetch(historicoQueryURL(), {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API retornou ${response.status}`);
    }

    const dados = await response.json();
    const lista = historicoOrdenar(historicoExtrairLista(dados));

    
    if (Array.isArray(dados)) {
      historicoState.serverMode = false;
      historicoState.partidas = lista;
      historicoState.resumo = null;
      historicoState.total = lista.length;
      historicoState.totalPaginas = Math.max(1, Math.ceil(lista.length / historicoState.limite));
      historicoAtualizarStats();
      historicoAplicarFiltrosLocais();
      return;
    }

    historicoState.serverMode = true;
    historicoState.partidas = lista;
    historicoState.filtradas = lista;
    historicoState.resumo = historicoExtrairResumo(dados);
    historicoState.total = Number(
      dados?.total ??
      dados?.pagination?.total ??
      dados?.paginacao?.total ??
      lista.length
    ) || 0;

    historicoState.pagina = Number(
      dados?.page ??
      dados?.pagina ??
      dados?.pagination?.page ??
      historicoState.pagina
    ) || historicoState.pagina;

    historicoState.totalPaginas = Number(
      dados?.totalPages ??
      dados?.totalPaginas ??
      dados?.pagination?.totalPages ??
      Math.ceil(historicoState.total / historicoState.limite)
    ) || 1;

    historicoAtualizarStats();
    historicoRenderLista();
  } catch (error) {
    console.error("Erro ao carregar histórico:", error);
    historicoEls.loading.hidden = true;
    historicoEls.empty.hidden = false;
    historicoEls.empty.textContent = "Não foi possível carregar o histórico.";
    historicoEls.contagem.textContent = "Erro ao carregar";
  } finally {
    historicoState.carregando = false;
    historicoAtualizarPaginacao();
  }
}

async function historicoCarregar() {
  await historicoCarregarPagina();

  const hash = window.location.hash || "";
  const match = hash.match(/^#partida-(.+)$/i);

  if (match?.[1]) {
    historicoAbrirDetalhes(decodeURIComponent(match[1]));
  }
}

let historicoBuscaTimer = null;

historicoEls.filtroModo.addEventListener("change", () => {
  historicoState.pagina = 1;
  historicoAplicarFiltros();
});

historicoEls.busca.addEventListener("input", () => {
  clearTimeout(historicoBuscaTimer);
  historicoBuscaTimer = setTimeout(() => {
    historicoState.pagina = 1;
    historicoAplicarFiltros();
  }, 350);
});

historicoEls.limpar.addEventListener("click", () => {
  historicoEls.filtroModo.value = "todos";
  historicoEls.busca.value = "";
  historicoState.pagina = 1;
  historicoAplicarFiltros();
});

historicoEls.prev?.addEventListener("click", () => {
  if (historicoState.pagina <= 1) return;
  historicoState.pagina -= 1;
  historicoAplicarFiltros();
});

historicoEls.next?.addEventListener("click", () => {
  if (historicoState.pagina >= historicoState.totalPaginas) return;
  historicoState.pagina += 1;
  historicoAplicarFiltros();
});

document.addEventListener("click", event => {
  const detalhes = event.target.closest("[data-historico-id]");

  if (detalhes) {
    historicoAbrirDetalhes(detalhes.dataset.historicoId);
    return;
  }

  if (event.target.closest("[data-historico-close]")) {
    historicoFecharDetalhes();
  }
});

document.addEventListener("keydown", event => {
  if (
    event.key === "Escape" &&
    historicoEls.modal &&
    !historicoEls.modal.hidden
  ) {
    historicoFecharDetalhes();
  }
});

window.addEventListener("hashchange", () => {
  const match = (window.location.hash || "").match(/^#partida-(.+)$/i);
  if (match?.[1]) {
    historicoAbrirDetalhes(decodeURIComponent(match[1]));
  }
});

historicoCarregar();
