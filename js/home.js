const DIARIOS_API = "https://api.noturnos.xyz/api/diarios";

const MODOS = [
  "solo",
  "duo"
];

function formatarDinheiro(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "—";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );
}

function encontrarDiario(
  diarios,
  id
) {
  return diarios.find(
    diario =>
      String(
        diario?.id || ""
      )
        .trim()
        .toLowerCase() === id
  );
}

function diarioDisponivel(diario) {
  if (!diario) {
    return false;
  }

  return (
    Array.isArray(diario.horarios) &&
    diario.horarios.length > 0
  );
}

function obterElementos(id) {
  return {
    card:
      document.querySelector(
        `#home-diario-${id}`
      ),

    nome:
      document.querySelector(
        `#home-${id}-name`
      ),

    preco:
      document.querySelector(
        `#home-${id}-price`
      ),

    kill:
      document.querySelector(
        `#home-${id}-kill`
      ),

    booyah:
      document.querySelector(
        `#home-${id}-booyah`
      ),

    botao:
      document.querySelector(
        `#home-${id}-button`
      )
  };
}

function definirTextoBotao(
  botao,
  texto,
  mostrarSeta = false
) {
  if (!botao) {
    return;
  }

  botao.innerHTML = `
    <span>
      ${texto}
    </span>

    ${
      mostrarSeta
        ? `
          <span aria-hidden="true">
            →
          </span>
        `
        : ""
    }
  `;
}

function mostrarEmBreve(
  id,
  diario = null
) {
  const elementos = obterElementos(id);

  if (elementos.nome) {
    const nome = diario?.nome ||
      (
        id === "duo"
          ? "Duo"
          : "Solo"
      );

    elementos.nome.textContent =
      String(nome)
        .replace(
          /^di[aá]rio\s+/i,
          ""
        )
        .trim();
  }

  if (elementos.preco) {
    elementos.preco.textContent =
      "—";
  }

  if (elementos.kill) {
    elementos.kill.textContent =
      "—";
  }

  if (elementos.booyah) {
    elementos.booyah.textContent =
      "—";
  }

  if (elementos.card) {
    elementos.card.classList.add(
      "is-coming-soon"
    );
  }

  if (elementos.botao) {
    elementos.botao.removeAttribute(
      "href"
    );

    elementos.botao.setAttribute(
      "aria-disabled",
      "true"
    );

    elementos.botao.setAttribute(
      "tabindex",
      "-1"
    );

    definirTextoBotao(
      elementos.botao,
      "Em breve"
    );
  }
}

function mostrarDiario(
  id,
  diario
) {
  const elementos = obterElementos(id);

  const nome = diario.nome ||
    (
      id === "duo"
        ? "Duo"
        : "Solo"
    );

  if (elementos.nome) {
    elementos.nome.textContent =
      String(nome)
        .replace(
          /^di[aá]rio\s+/i,
          ""
        )
        .trim();
  }

  if (elementos.preco) {
    elementos.preco.textContent =
      formatarDinheiro(
        diario.preco
      );
  }

  if (elementos.kill) {
    elementos.kill.textContent =
      formatarDinheiro(
        diario.valorKill
      );
  }

  if (elementos.booyah) {
    elementos.booyah.textContent =
      formatarDinheiro(
        diario.valorBooyah
      );
  }

  if (elementos.card) {
    elementos.card.classList.remove(
      "is-coming-soon"
    );
  }

  if (elementos.botao) {
    elementos.botao.href =
      `./diarios.html#${id}`;

    elementos.botao.removeAttribute(
      "aria-disabled"
    );

    elementos.botao.removeAttribute(
      "tabindex"
    );

    definirTextoBotao(
      elementos.botao,
      "Ver detalhes",
      true
    );
  }
}

function renderizarDiarios(diarios) {
  MODOS.forEach(id => {
    const diario = encontrarDiario(
        diarios,
        id
      );

    if (
      !diarioDisponivel(
        diario
      )
    ) {
      mostrarEmBreve(
        id,
        diario
      );

      return;
    }

    mostrarDiario(
      id,
      diario
    );
  });
}

function mostrarErro() {
  MODOS.forEach(id => {
    const elementos = obterElementos(id);

    if (elementos.preco) {
      elementos.preco.textContent =
        "—";
    }

    if (elementos.kill) {
      elementos.kill.textContent =
        "—";
    }

    if (elementos.booyah) {
      elementos.booyah.textContent =
        "—";
    }
  });
}

async function carregarDiariosHome() {
  try {
    const response = await fetch(
        DIARIOS_API,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json"
          },

          cache:
            "no-store"
        }
      );

    if (!response.ok) {
      throw new Error(
        `API retornou ${response.status}`
      );
    }

    const dados = await response.json();

    if (!Array.isArray(dados)) {
      throw new Error(
        "Resposta inválida da API."
      );
    }

    renderizarDiarios(
      dados
    );

  } catch (error) {
    console.error(
      "Erro ao carregar os diários da home:",
      error
    );

    mostrarErro();
  }
}

carregarDiariosHome();
