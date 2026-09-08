function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function avatarPadrao(id = "0") {
  const indice = Number(String(id).slice(-1)) % 6;

  return `https://cdn.discordapp.com/embed/avatars/${indice}.png`;
}

function criarBoosterItem(booster) {
  const nome = booster.username ||
    booster.nome ||
    booster.displayName ||
    "Booster";

  const avatar = booster.avatar ||
    booster.foto ||
    avatarPadrao(booster.id);

  return `
    <div
      class="boosters__item"
      data-user-id="${escaparHTML(booster.id || "")}"
    >
      <img
        class="boosters__avatar"
        src="${escaparHTML(avatar)}"
        alt="${escaparHTML(nome)}"
        loading="lazy"
      >

      <span class="boosters__username">
        @${escaparHTML(nome)}
      </span>
    </div>
  `;
}

function iniciarLoopBoosters(track) {
  if (!track) return;

  const itensOriginais = Array.from(
      track.querySelectorAll(".boosters__item")
    );

  if (!itensOriginais.length) return;

  

  itensOriginais.forEach(item => {
    const clone = item.cloneNode(true);

    clone.setAttribute(
      "aria-hidden",
      "true"
    );

    track.appendChild(clone);
  });

  let posicao = 0;

  

  const velocidade = 0.025;

  let larguraOriginal = 0;
  let ultimoTempo = performance.now();

  function calcularLargura() {
    larguraOriginal = 0;

    itensOriginais.forEach(item => {
      const estilo = getComputedStyle(track);

      const gap = parseFloat(estilo.gap) || 0;

      larguraOriginal +=
        item.getBoundingClientRect().width +
        gap;
    });
  }

  calcularLargura();

  window.addEventListener(
    "resize",
    calcularLargura
  );

  function animar(tempoAtual) {
    const delta = Math.min(
        tempoAtual - ultimoTempo,
        32
      );

    ultimoTempo =
      tempoAtual;

    

    posicao +=
      velocidade *
      delta;

    

    if (
      posicao >= larguraOriginal
    ) {
      posicao -=
        larguraOriginal;
    }

    track.style.transform =
      `translate3d(-${posicao}px, 0, 0)`;

    requestAnimationFrame(
      animar
    );
  }

  requestAnimationFrame(
    animar
  );
}

async function carregarBoosters() {
  const boostersTrack = document.getElementById(
      "boosters-track"
    );

  if (!boostersTrack) {
    console.error(
      "#boosters-track não encontrado"
    );

    return;
  }

  try {
    const response = await fetch(
        "https://api.noturnos.xyz/api/booster"
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const dados = await response.json();

    const boosters = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.boosters)
          ? dados.boosters
          : Array.isArray(dados.booster)
            ? dados.booster
            : [];

    if (!boosters.length) {
      boostersTrack.innerHTML =
        "";

      return;
    }

    boostersTrack.innerHTML =
      boosters
        .map(criarBoosterItem)
        .join("");

    boostersTrack
      .querySelectorAll(
        ".boosters__avatar"
      )
      .forEach(img => {
        img.addEventListener(
          "error",
          () => {
            const item = img.closest(
                ".boosters__item"
              );

            const id = item?.dataset?.userId ||
              "0";

            img.src =
              avatarPadrao(id);
          },
          {
            once: true
          }
        );
      });

    iniciarLoopBoosters(
      boostersTrack
    );

  } catch (error) {
    console.error(
      "Erro ao carregar boosters:",
      error
    );

    boostersTrack.innerHTML =
      "";
  }
}

window.iniciarBooster =
  carregarBoosters;
