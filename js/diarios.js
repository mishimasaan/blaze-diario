const API_BASE = "https://api.noturnos.xyz";

const DIARIOS_API = `${API_BASE}/api/diarios`;

const MODOS_VALIDOS = [
  "solo",
  "duo"
];

const diariosList = document.querySelector(
    "#diarios-list"
  );

const diariosStatus = document.querySelector(
    "#diarios-status"
  );

const diarioName = document.querySelector(
    "#diario-name"
  );

const diarioPrice = document.querySelector(
    "#diario-price"
  );

const diarioTabsContainer = document.querySelector(
    ".diarios-tabs"
  );

const diarioTabs = Array.from(
    document.querySelectorAll(
      ".diarios-tab"
    )
  );

let diarios = [];

let diarioAtual = obterModoPeloHash();

function obterModoPeloHash() {
  const hash = window.location.hash
      .replace("#", "")
      .trim()
      .toLowerCase();

  if (
    MODOS_VALIDOS.includes(
      hash
    )
  ) {
    return hash;
  }

  return "solo";
}

function formatarDinheiro(valor) {
  return Number(
    valor || 0
  ).toLocaleString(
    "pt-BR",
    {
      style:
        "currency",

      currency:
        "BRL"
    }
  );
}

function escaparHTML(valor) {
  return String(
    valor ?? ""
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

function encontrarDiario(id) {
  return diarios.find(
    diario =>
      String(
        diario.id
      ).toLowerCase() === id
  );
}

function normalizarHorario(horario) {
  if (
    typeof horario === "string"
  ) {
    return horario.trim();
  }

  if (
    horario &&
    typeof horario === "object"
  ) {
    return String(
      horario.horario ??
      horario.hora ??
      ""
    ).trim();
  }

  return "";
}

function obterStatus(horario) {
  const lotado = Boolean(
      horario?.lotado
    ) ||

    horario?.status ===
      "lotado" ||

    (
      Number(
        horario?.limite
      ) > 0 &&

      Number(
        horario?.ocupados
      ) >=
        Number(
          horario?.limite
        )
    );

  if (
    lotado
  ) {
    return {
      classe:
        "lotado",

      texto:
        "Lotado"
    };
  }

  return {
    classe:
      "aberto",

    texto:
      "Aberto"
  };
}

function criarCard(
  diario,
  horario
) {
  const status = obterStatus(
      horario
    );

  const lotado = status.classe ===
      "lotado";

  const horarioValor = normalizarHorario(
      horario
    );

  const horarioSeguro = escaparHTML(
      horarioValor
    );

  const modoSeguro = escaparHTML(
      diario.nome ||
      diario.id
    );

  const statusClasse = escaparHTML(
      status.classe
    );

  const statusTexto = escaparHTML(
      status.texto
    );

  const ocupados = Number(
      horario?.ocupados
    ) || 0;

  const limite = Number(
      horario?.limite
    ) || 0;

  const vagas = Math.max(
      Number(
        horario?.vagas
      ) || 0,
      0
    );

  const porcentagem = Math.min(
      Math.max(
        Number(
          horario?.porcentagem
        ) || 0,
        0
      ),
      100
    );

  return `
    <article
      class="diario-card"
      data-horario="${horarioSeguro}"
    >

      <div class="diario-card__main">

        <strong class="diario-card__time">
          ${horarioSeguro}
        </strong>

        <span class="diario-card__mode">
          ${modoSeguro}
        </span>

      </div>

      <div class="diario-stat">

        <span class="diario-stat__label">
          Jogadores
        </span>

        <strong class="diario-stat__value">
          ${ocupados} / ${limite}
        </strong>

      </div>

      <div
        class="
          diario-stat
          diario-card__vacancies
        "
      >

        <span class="diario-stat__label">
          Vagas
        </span>

        <strong class="diario-stat__value">
          ${vagas}
        </strong>

      </div>

      <div
        class="
          diario-stat
          diario-card__status-wrapper
        "
      >

        <span class="diario-stat__label">
          Status
        </span>

        <span
          class="
            diario-card__status
            diario-card__status--${statusClasse}
          "
        >
          ${statusTexto}
        </span>

      </div>

      <div class="diario-card__action">

        ${
          lotado
            ? `
              <span
                class="
                  diario-card__button
                  is-disabled
                "
                aria-disabled="true"
              >
                <span>
                  Lotado
                </span>
              </span>
            `
            : `
              <button
                class="diario-card__button js-participar"
                type="button"
                data-diario="${escaparHTML(diario.id)}"
                data-horario="${horarioSeguro}"
              >
                <span>Participar</span>
                <span aria-hidden="true">→</span>
              </button>
            `
        }

      </div>

      <div class="diario-card__progress">

        <div
          class="diario-card__progress-bar"
          style="--progress: ${porcentagem}%"
        ></div>

      </div>

    </article>
  `;
}

function atualizarIndicador(id) {
  if (
    !diarioTabsContainer
  ) {
    return;
  }

  const index = diarioTabs.findIndex(
      tab =>
        tab.dataset.diario === id
    );

  if (
    index === -1
  ) {
    return;
  }

  diarioTabsContainer
    .style
    .setProperty(
      "--active-index",
      index
    );
}

function atualizarTabs(id) {
  diarioTabs.forEach(
    tab => {
      const ativo = tab.dataset.diario === id;

      tab.classList.toggle(
        "is-active",
        ativo
      );

      tab.setAttribute(
        "aria-selected",
        String(
          ativo
        )
      );

      if (
        ativo
      ) {
        tab.setAttribute(
          "tabindex",
          "0"
        );
      } else {
        tab.setAttribute(
          "tabindex",
          "-1"
        );
      }
    }
  );

  atualizarIndicador(
    id
  );
}

function mostrarIndisponivel(id) {
  if (
    diarioName
  ) {
    diarioName.textContent =
      id === "duo"
        ? "Diário Duo"
        : "Diário Solo";
  }

  if (
    diarioPrice
  ) {
    diarioPrice.textContent =
      "—";
  }

  if (
    diariosList
  ) {
    diariosList.innerHTML =
      "";
  }

  if (
    diariosStatus
  ) {
    diariosStatus.hidden =
      false;

    diariosStatus.textContent =
      "Nenhum diário disponível no momento.";
  }
}

function renderizarDiario(id) {
  const diario = encontrarDiario(
      id
    );

  if (
    !diario
  ) {
    mostrarIndisponivel(
      id
    );

    return;
  }

  if (
    diarioName
  ) {
    diarioName.textContent =
      diario.nome ||
      diario.id;
  }

  if (
    diarioPrice
  ) {
    diarioPrice.textContent =
      formatarDinheiro(
        diario.preco
      );
  }

  if (
    !Array.isArray(
      diario.horarios
    ) ||

    diario.horarios.length ===
      0
  ) {
    if (
      diariosList
    ) {
      diariosList.innerHTML =
        "";
    }

    if (
      diariosStatus
    ) {
      diariosStatus.hidden =
        false;

      diariosStatus.textContent =
        "Nenhum diário disponível no momento.";
    }

    return;
  }

  if (
    diariosStatus
  ) {
    diariosStatus.hidden =
      true;
  }

  if (
    diariosList
  ) {
    diariosList.innerHTML =
      diario.horarios
        .map(
          horario =>
            criarCard(
              diario,
              horario
            )
        )
        .join("");
  }
}

function atualizarHash(id) {
  const novoHash = `#${id}`;

  if (
    window.location.hash ===
      novoHash
  ) {
    return;
  }

  history.pushState(
    {
      diario:
        id
    },
    "",
    novoHash
  );
}

function selecionarDiario(
  id,
  alterarURL = true
) {
  const modo = MODOS_VALIDOS.includes(
      id
    )
      ? id
      : "solo";

  diarioAtual =
    modo;

  atualizarTabs(
    modo
  );

  if (
    alterarURL
  ) {
    atualizarHash(
      modo
    );
  }

  renderizarDiario(
    modo
  );
}

async function carregarDiarios() {
  try {
    if (
      diariosStatus
    ) {
      diariosStatus.hidden =
        false;

      diariosStatus.textContent =
        "Carregando horários...";
    }

    const response = await fetch(
        DIARIOS_API,
        {
          method:
            "GET",

          headers: {
            Accept:
              "application/json"
          },

          cache:
            "no-store"
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `API retornou ${response.status}`
      );
    }

    const dados = await response.json();

    const listaDiarios = Array.isArray(dados)
      ? dados
      : Object.entries(dados || {}).map(([id, diario]) => ({ id, ...diario }));

    if (!listaDiarios.length) {
      throw new Error("Resposta inválida da API.");
    }

    diarios = listaDiarios;

    selecionarDiario(
      diarioAtual,
      false
    );

  } catch (
    error
  ) {
    console.error(
      "Erro ao carregar diários:",
      error
    );

    if (
      diariosList
    ) {
      diariosList.innerHTML =
        "";
    }

    if (
      diarioPrice
    ) {
      diarioPrice.textContent =
        "—";
    }

    if (
      diariosStatus
    ) {
      diariosStatus.hidden =
        false;

      diariosStatus.textContent =
        "Não foi possível carregar os diários.";
    }
  }
}

diarioTabs.forEach(
  tab => {
    tab.addEventListener(
      "click",
      () => {
        selecionarDiario(
          tab.dataset.diario
        );
      }
    );
  }
);

window.addEventListener(
  "hashchange",
  () => {
    const modo = obterModoPeloHash();

    if (
      modo !== diarioAtual
    ) {
      selecionarDiario(
        modo,
        false
      );
    }
  }
);

window.addEventListener(
  "popstate",
  () => {
    const modo = obterModoPeloHash();

    selecionarDiario(
      modo,
      false
    );
  }
);

atualizarTabs(
  diarioAtual
);

carregarDiarios();

const CHECKOUT_API = `${API_BASE}/api`;
const DISCORD_URL = "https://discord.gg/m8KpCNTN5m";
const checkoutModal = document.querySelector("#checkout-modal");
const checkoutContent = document.querySelector("#checkout-content");

let checkoutTimer = null;
let discordUser = null;

function fecharCheckout() {
  if (checkoutTimer) {
    clearInterval(checkoutTimer);
  }

  checkoutTimer = null;
  checkoutModal.hidden = true;
  document.body.classList.remove("checkout-open");
}

async function obterDiscordConectado() {
  try {
    const response = await fetch(
      `${CHECKOUT_API}/me`,
      {
        method: "GET",
        headers: {
          Accept: "application/json"
        },
        credentials: "include",
        cache: "no-store"
      }
    );

    if (!response.ok) {
      discordUser = null;
      return null;
    }

    const data = await response.json();

    discordUser =
      data.user ||
      data.discord ||
      data;

    if (
      !discordUser ||
      !discordUser.id
    ) {
      discordUser = null;
    }

    return discordUser;
  } catch (error) {
    discordUser = null;
    return null;
  }
}

function avatarDiscord(user) {
  if (
    !user ||
    !user.id ||
    !user.avatar
  ) {
    return "";
  }

  const extensao = String(user.avatar).startsWith("a_")
      ? "gif"
      : "png";

  return `https://cdn.discordapp.com/avatars/${encodeURIComponent(user.id)}/${encodeURIComponent(user.avatar)}.${extensao}?size=128`;
}

function nomeDiscord(user) {
  return (
    user?.global_name ||
    user?.globalName ||
    user?.displayName ||
    user?.username ||
    "Discord"
  );
}

function usuarioDiscord(user) {
  return (
    user?.username ||
    nomeDiscord(user)
  );
}

function salvarCheckoutPendente(
  diario,
  horario
) {
  try {
    sessionStorage.setItem(
      "blazeCheckoutPendente",
      JSON.stringify({
        diarioId:
          diario.id,

        horario:
          normalizarHorario(
            horario
          )
      })
    );
  } catch (error) {}
}

function conectarDiscord(
  diario,
  horario
) {
  salvarCheckoutPendente(
    diario,
    horario
  );

  window.location.href =
    `${API_BASE}/auth/discord`;
}

function resumoCheckout(
  diario,
  horario
) {
  const horarioValor = normalizarHorario(
      horario
    );

  return `
    <div class="checkout__summary">
      <div>
        <span>Modo</span>
        <strong>
          ${escaparHTML(
            diario.nome ||
            diario.id
          )}
        </strong>
      </div>

      <div>
        <span>Horário</span>
        <strong>
          ${escaparHTML(
            horarioValor
          )}
        </strong>
      </div>

      <div>
        <span>Valor</span>
        <strong>
          ${formatarDinheiro(
            diario.preco
          )}
        </strong>
      </div>
    </div>
  `;
}

function blocoDiscordConectado(user) {
  const avatar = avatarDiscord(
      user
    );

  return `
    <div class="checkout-discord checkout-discord--connected">
      ${
        avatar
          ? `
            <img
              class="checkout-discord__avatar"
              src="${escaparHTML(avatar)}"
              alt=""
            >
          `
          : `
            <div class="checkout-discord__avatar checkout-discord__avatar--fallback">
              D
            </div>
          `
      }

      <div class="checkout-discord__info">
        <span class="checkout-discord__label">
          Discord conectado
        </span>

        <strong class="checkout-discord__name">
          ${escaparHTML(
            nomeDiscord(user)
          )}
        </strong>

        <span class="checkout-discord__username">
          @${escaparHTML(
            usuarioDiscord(user)
          )}
        </span>
      </div>

      <span class="checkout-discord__status">
        ✓
      </span>
    </div>
  `;
}

function mostrarConectarDiscord(
  diario,
  horario
) {
  checkoutContent.innerHTML = `
    <span class="checkout__eyebrow">
      Checkout
    </span>

    <h2
      class="checkout__title"
      id="checkout-title"
    >
      Conecte seu Discord
    </h2>

    <p class="checkout__text">
      Sua conta do Discord será vinculada à inscrição para identificar você no suporte e nos pagamentos.
    </p>

    ${resumoCheckout(
      diario,
      horario
    )}

    <div class="checkout-discord">
      <div class="checkout-discord__icon">
        <img
          src="./assets/icons/discord.svg"
          alt=""
        >
      </div>

      <div class="checkout-discord__info">
        <strong class="checkout-discord__name">
          Entrar com Discord
        </strong>

        <span class="checkout-discord__username">
          Você será redirecionado para autorizar sua conta.
        </span>
      </div>
    </div>

    <button
      class="checkout__button checkout__button--primary"
      type="button"
      id="checkout-connect-discord"
    >
      Conectar Discord
    </button>

    <button
      class="checkout__button checkout__button--secondary checkout__button--spaced"
      type="button"
      data-checkout-back
    >
      Voltar
    </button>
  `;

  document
    .querySelector(
      "#checkout-connect-discord"
    )
    .addEventListener(
      "click",
      () => {
        conectarDiscord(
          diario,
          horario
        );
      }
    );

  document
    .querySelector(
      "[data-checkout-back]"
    )
    .addEventListener(
      "click",
      () => {
        abrirCheckout(
          diario.id,
          horario
        );
      }
    );
}

async function iniciarCheckoutSite(
  diario,
  horario
) {
  checkoutContent.innerHTML = `
    <span class="checkout__eyebrow">
      Checkout
    </span>

    <h2
      class="checkout__title"
      id="checkout-title"
    >
      Verificando Discord...
    </h2>

    <p class="checkout__text">
      Aguarde um instante.
    </p>

    ${resumoCheckout(
      diario,
      horario
    )}
  `;

  const user = await obterDiscordConectado();

  if (!user) {
    mostrarConectarDiscord(
      diario,
      horario
    );

    return;
  }

  formularioCheckout(
    diario,
    horario,
    user
  );
}

function abrirCheckout(
  diarioId,
  horario
) {
  const diario = encontrarDiario(
      diarioId
    );

  const horarioValor = normalizarHorario(
      horario
    );

  if (
    !diario ||
    !horarioValor
  ) {
    return;
  }

  checkoutModal.hidden =
    false;

  document.body.classList.add(
    "checkout-open"
  );

  checkoutContent.innerHTML = `
    <span class="checkout__eyebrow">
      Participar
    </span>

    <h2
      class="checkout__title"
      id="checkout-title"
    >
      Como deseja comprar?
    </h2>

    <p class="checkout__text">
      Escolha se prefere finalizar diretamente pelo site ou continuar pelo Discord.
    </p>

    ${resumoCheckout(
      diario,
      horarioValor
    )}

    <div class="checkout__choices">
      <button
        class="checkout__button checkout__button--primary"
        type="button"
        id="checkout-site"
      >
        Comprar pelo site
      </button>

      <a
        class="checkout__button checkout__button--secondary"
        href="${DISCORD_URL}"
        target="_blank"
        rel="noopener noreferrer"
      >
        Comprar pelo Discord
      </a>
    </div>
  `;

  document
    .querySelector(
      "#checkout-site"
    )
    .addEventListener(
      "click",
      () => {
        iniciarCheckoutSite(
          diario,
          horarioValor
        );
      }
    );
}

function formularioCheckout(
  diario,
  horario,
  user = discordUser
) {
  const qtd = Math.max(
      1,
      Number(
        diario.quantidadeNicks
      ) ||
      (
        diario.id === "duo"
          ? 2
          : 1
      )
    );

  checkoutContent.innerHTML = `
    <span class="checkout__eyebrow">
      Checkout
    </span>

    <h2
      class="checkout__title"
      id="checkout-title"
    >
      Informe ${
        qtd > 1
          ? "os nicks"
          : "seu nick"
      }
    </h2>

    ${resumoCheckout(
      diario,
      horario
    )}

    ${
      user
        ? blocoDiscordConectado(
            user
          )
        : ""
    }

    <form id="checkout-form">
      ${Array.from(
        {
          length:
            qtd
        },
        (
          _,
          i
        ) => `
          <div class="checkout__field">
            <label for="nick-${i}">
              Nick ${
                qtd > 1
                  ? i + 1
                  : ""
              }
            </label>

            <input
              id="nick-${i}"
              name="nick"
              maxlength="32"
              autocomplete="off"
              required
              placeholder="Seu nick no jogo"
            >
          </div>
        `
      ).join("")}

      <div
        class="checkout__error"
        id="checkout-error"
        hidden
      ></div>

      <button
        class="checkout__button checkout__button--primary"
        id="checkout-submit"
        type="submit"
      >
        Gerar PIX
      </button>
    </form>
  `;

  document
    .querySelector(
      "#checkout-form"
    )
    .addEventListener(
      "submit",
      event => {
        criarPagamento(
          event,
          diario,
          horario
        );
      }
    );
}

async function criarPagamento(
  event,
  diario,
  horario
) {
  event.preventDefault();

  const btn = document.querySelector(
      "#checkout-submit"
    );

  const erro = document.querySelector(
      "#checkout-error"
    );

  const nicks = [
      ...event.currentTarget.querySelectorAll(
        'input[name="nick"]'
      )
    ]
      .map(
        input =>
          input.value.trim()
      )
      .filter(
        Boolean
      );

  btn.disabled =
    true;

  btn.textContent =
    "Gerando PIX...";

  erro.hidden =
    true;

  try {
    const response = await fetch(
        `${CHECKOUT_API}/payment/create`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json"
          },

          credentials:
            "include",

          body:
            JSON.stringify({
              diarioId:
                diario.id,

              horario:
                normalizarHorario(
                  horario
                ),

              nicks
            })
        }
      );

    const data = await response
        .json()
        .catch(
          () => ({})
        );

    if (
      response.status === 401 &&
      data.precisaDiscord
    ) {
      discordUser =
        null;

      mostrarConectarDiscord(
        diario,
        horario
      );

      return;
    }

    if (!response.ok) {
      throw new Error(
        data.erro ||
        "Não foi possível gerar o PIX."
      );
    }

    mostrarPix(
      diario,
      horario,
      data
    );

    carregarDiarios();
  } catch (error) {
    erro.textContent =
      error.message;

    erro.hidden =
      false;

    btn.disabled =
      false;

    btn.textContent =
      "Gerar PIX";
  }
}

function mostrarPix(
  diario,
  horario,
  data
) {
  const qr = data.qrCodeBase64
      ? (
          data.qrCodeBase64.startsWith(
            "data:"
          )
            ? data.qrCodeBase64
            : `data:image/png;base64,${data.qrCodeBase64}`
        )
      : "";

  checkoutContent.innerHTML = `
    <div class="checkout__pix">
      <span class="checkout__eyebrow">
        Pagamento PIX
      </span>

      <h2
        class="checkout__title"
        id="checkout-title"
      >
        Aguardando pagamento
      </h2>

      ${resumoCheckout(
        diario,
        horario
      )}

      ${
        discordUser
          ? blocoDiscordConectado(
              discordUser
            )
          : ""
      }

      ${
        qr
          ? `
            <img
              class="checkout__qr"
              src="${qr}"
              alt="QR Code PIX"
            >
          `
          : ""
      }

      <textarea
        class="checkout__pix-code"
        id="pix-code"
        readonly
      >${escaparHTML(
        data.codigoPix ||
        ""
      )}</textarea>

      <button
        class="checkout__button checkout__button--primary"
        id="copy-pix"
        type="button"
      >
        Copiar PIX
      </button>

      <p
        class="checkout__waiting"
        id="checkout-waiting"
      >
        Aguardando confirmação do Mercado Pago. Sua vaga será adicionada após o pagamento ser aprovado.
      </p>
    </div>
  `;

  document
    .querySelector(
      "#copy-pix"
    )
    .addEventListener(
      "click",
      async event => {
        await navigator.clipboard.writeText(
          data.codigoPix ||
          ""
        );

        event.currentTarget.textContent =
          "PIX copiado!";
      }
    );

  consultarPagamento(
    data.paymentId,
    diario,
    horario
  );

  checkoutTimer =
    setInterval(
      () => {
        consultarPagamento(
          data.paymentId,
          diario,
          horario
        );
      },
      3000
    );
}

async function consultarPagamento(
  paymentId,
  diario,
  horario
) {
  try {
    const response = await fetch(
        `${CHECKOUT_API}/payment/${encodeURIComponent(paymentId)}`,
        {
          credentials:
            "include",

          cache:
            "no-store"
        }
      );

    const data = await response.json();

    if (
      data.excedente ||
      data.necessitaEstorno
    ) {
      if (checkoutTimer) {
        clearInterval(
          checkoutTimer
        );
      }

      checkoutTimer =
        null;

      checkoutContent.innerHTML = `
        <div class="checkout__success">
          <span class="checkout__eyebrow">
            Pagamento recebido
          </span>

          <h2 class="checkout__title">
            Horário lotado
          </h2>

          <p class="checkout__text">
            O pagamento foi aprovado, mas o horário ficou sem vagas antes da confirmação. Entre em contato com o suporte para o estorno.
          </p>

          <a
            class="checkout__button checkout__button--primary"
            href="${DISCORD_URL}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir Discord
          </a>
        </div>
      `;

      carregarDiarios();

      return;
    }

    if (data.liberado) {
      if (checkoutTimer) {
        clearInterval(
          checkoutTimer
        );
      }

      checkoutTimer =
        null;

      const nicksConfirmados = data.slot?.nicks ||
        data.nicks ||
        [];

      checkoutContent.innerHTML = `
        <div class="checkout__success">
          <div class="checkout__success-mark">
            ✓
          </div>

          <span class="checkout__eyebrow">
            Pagamento aprovado
          </span>

          <h2
            class="checkout__title"
            id="checkout-title"
          >
            Inscrição confirmada
          </h2>

          <p class="checkout__text">
            ${escaparHTML(
              nicksConfirmados.join(
                ", "
              )
            )}

            <br>

            ${escaparHTML(
              diario.nome ||
              diario.id
            )}
            •
            ${escaparHTML(
              normalizarHorario(
                horario
              )
            )}
          </p>

          <button
            class="checkout__button checkout__button--primary"
            type="button"
            data-checkout-close
          >
            Concluir
          </button>
        </div>
      `;

      carregarDiarios();
    }
  } catch (error) {}
}

async function reabrirCheckoutPendente() {
  let pendente = null;

  try {
    pendente =
      JSON.parse(
        sessionStorage.getItem(
          "blazeCheckoutPendente"
        ) ||
        "null"
      );
  } catch (error) {}

  if (
    !pendente?.diarioId ||
    !pendente?.horario
  ) {
    return;
  }

  sessionStorage.removeItem(
    "blazeCheckoutPendente"
  );

  const tentarAbrir = () => {
      const diario = encontrarDiario(
          pendente.diarioId
        );

      if (!diario) {
        return false;
      }

      abrirCheckout(
        pendente.diarioId,
        pendente.horario
      );

      iniciarCheckoutSite(
        diario,
        pendente.horario
      );

      return true;
    };

  if (tentarAbrir()) {
    return;
  }

  let tentativas = 0;

  const timer = setInterval(
      () => {
        tentativas +=
          1;

        if (
          tentarAbrir() ||
          tentativas >= 20
        ) {
          clearInterval(
            timer
          );
        }
      },
      250
    );
}

document.addEventListener(
  "click",
  event => {
    const participar = event.target.closest(
        ".js-participar"
      );

    if (participar) {
      const card = participar.closest(
          ".diario-card"
        );

      const diarioId = participar.dataset.diario ||
        diarioAtual;

      const horario = normalizarHorario(
          participar.dataset.horario ||
          card?.dataset.horario ||
          card
            ?.querySelector(
              ".diario-card__time"
            )
            ?.textContent ||
          ""
        );

      abrirCheckout(
        diarioId,
        horario
      );
    }

    if (
      event.target.closest(
        "[data-checkout-close]"
      )
    ) {
      fecharCheckout();
    }
  }
);

document.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape" &&
      checkoutModal &&
      !checkoutModal.hidden
    ) {
      fecharCheckout();
    }
  }
);

setInterval(
  () => {
    if (
      checkoutModal?.hidden
    ) {
      carregarDiarios();
    }
  },
  15000
);

reabrirCheckoutPendente();
