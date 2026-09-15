const DIARIOS_API = "https://api.blazediarios.com/api/diarios";
const STAFFS_API = "https://api.blazediarios.com/api/staffs";
const STAFF_REFRESH_MS = 4 * 60 * 1000;

const MODOS = ["solo", "duo"];

function formatarDinheiro(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "—";
  }

  const numero = Number(valor);

  if (!Number.isFinite(numero)) {
    return "—";
  }

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function encontrarDiario(diarios, id) {
  return diarios.find(diario => {
    return String(diario?.id || "").trim().toLowerCase() === id;
  });
}

function diarioDisponivel(diario) {
  return Boolean(diario && Array.isArray(diario.horarios) && diario.horarios.length);
}

function obterElementosDoDiario(id) {
  return {
    card: document.querySelector(`#home-diario-${id}`),
    nome: document.querySelector(`#home-${id}-name`),
    preco: document.querySelector(`#home-${id}-price`),
    kill: document.querySelector(`#home-${id}-kill`),
    booyah: document.querySelector(`#home-${id}-booyah`),
    botao: document.querySelector(`#home-${id}-button`)
  };
}

function definirTextoBotao(botao, texto, mostrarSeta = false) {
  if (!botao) return;

  botao.innerHTML = `
    <span>${texto}</span>
    ${mostrarSeta ? '<span class="icon icon--arrow-right" aria-hidden="true"></span>' : ""}
  `;
}

function nomeDoModo(id, diario) {
  const fallback = id === "duo" ? "Duo" : "Solo";

  return String(diario?.nome || fallback)
    .replace(/^di[aá]rio\s+/i, "")
    .trim();
}

function mostrarEmBreve(id, diario = null) {
  const elementos = obterElementosDoDiario(id);

  if (elementos.nome) elementos.nome.textContent = nomeDoModo(id, diario);
  if (elementos.preco) elementos.preco.textContent = "—";
  if (elementos.kill) elementos.kill.textContent = "—";
  if (elementos.booyah) elementos.booyah.textContent = "—";

  elementos.card?.classList.add("is-coming-soon");

  if (elementos.botao) {
    elementos.botao.removeAttribute("href");
    elementos.botao.setAttribute("aria-disabled", "true");
    elementos.botao.setAttribute("tabindex", "-1");
    definirTextoBotao(elementos.botao, "Em breve");
  }
}

function mostrarDiario(id, diario) {
  const elementos = obterElementosDoDiario(id);

  if (elementos.nome) elementos.nome.textContent = nomeDoModo(id, diario);
  if (elementos.preco) elementos.preco.textContent = formatarDinheiro(diario.preco);
  if (elementos.kill) elementos.kill.textContent = formatarDinheiro(diario.valorKill);
  if (elementos.booyah) elementos.booyah.textContent = formatarDinheiro(diario.valorBooyah);

  elementos.card?.classList.remove("is-coming-soon");

  if (elementos.botao) {
    elementos.botao.href = `/diarios/#${id}`;
    elementos.botao.removeAttribute("aria-disabled");
    elementos.botao.removeAttribute("tabindex");
    definirTextoBotao(elementos.botao, "Ver detalhes", true);
  }
}

function renderizarDiarios(diarios) {
  MODOS.forEach(id => {
    const diario = encontrarDiario(diarios, id);

    if (!diarioDisponivel(diario)) {
      mostrarEmBreve(id, diario);
      return;
    }

    mostrarDiario(id, diario);
  });
}

function mostrarErroNosDiarios() {
  MODOS.forEach(id => {
    const elementos = obterElementosDoDiario(id);

    if (elementos.preco) elementos.preco.textContent = "—";
    if (elementos.kill) elementos.kill.textContent = "—";
    if (elementos.booyah) elementos.booyah.textContent = "—";
  });
}

async function carregarDiariosHome() {
  try {
    const response = await fetch(DIARIOS_API, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API retornou ${response.status}`);
    }

    const dados = await response.json();

    if (!Array.isArray(dados)) {
      throw new Error("Resposta inválida da API de diários.");
    }

    renderizarDiarios(dados);
  } catch (error) {
    console.error("Erro ao carregar os diários da home:", error);
    mostrarErroNosDiarios();
  }
}

function normalizarCargo(cargo) {
  const nomes = {
    owner: "Owner",
    admin: "Admin",
    ajudante: "Ajudante",
    suporte: "Suporte"
  };

  const chave = String(cargo || "").trim().toLowerCase();

  if (nomes[chave]) return nomes[chave];
  if (!chave) return "Staff";

  return chave.charAt(0).toUpperCase() + chave.slice(1);
}

function possuiCampoOnline(staff) {
  return Boolean(staff && Object.prototype.hasOwnProperty.call(staff, "online"));
}

function staffEstaOnline(staff) {
  if (!possuiCampoOnline(staff)) return false;

  const valor = String(staff.online).trim().toLowerCase();
  return valor === "yes" || valor === "true" || valor === "1";
}

function ehStaffVisivel(staff) {
  if (!staff) return false;

  const cargo = String(staff.cargo || "").trim().toLowerCase();

  if (cargo === "designer") return false;

  return Boolean(staff.avatar || staff.nome || staff.username);
}

function criarAvatarStaff(staff, mostrarOnline, index) {
  const nome = staff.nome || staff.username || "Staff";
  const cargo = normalizarCargo(staff.cargo);

  const wrapper = document.createElement("span");
  wrapper.className = "staff-preview__avatar-wrap";
  wrapper.title = `${nome} — ${cargo}`;

  const imagem = document.createElement("img");
  imagem.className = "staff-preview__avatar";
  imagem.src = staff.avatar || "/assets/images/logo.png";
  imagem.alt = `${nome} — ${cargo}`;
  imagem.loading = index > 2 ? "lazy" : "eager";
  imagem.referrerPolicy = "no-referrer";
  imagem.onerror = () => {
    imagem.onerror = null;
    imagem.src = "/assets/images/logo.png";
  };

  wrapper.appendChild(imagem);

  if (mostrarOnline) {
    const indicador = document.createElement("i");
    indicador.className = "staff-preview__online";
    indicador.setAttribute("aria-hidden", "true");
    wrapper.appendChild(indicador);
  }

  return wrapper;
}

function renderizarStaffs(staffs) {
  const avatars = document.querySelector("#home-staff-avatars");
  const count = document.querySelector("#home-staff-count");
  const status = document.querySelector("#home-staff-status");

  if (!avatars || !count || !status) return;

  const validos = staffs.filter(ehStaffVisivel);
  const apiTemOnline = validos.some(possuiCampoOnline);
  const exibidos = apiTemOnline ? validos.filter(staffEstaOnline) : validos;

  avatars.innerHTML = "";

  exibidos.slice(0, 5).forEach((staff, index) => {
    avatars.appendChild(criarAvatarStaff(staff, apiTemOnline, index));
  });

  if (exibidos.length > 5) {
    const extra = document.createElement("span");
    extra.className = "staff-preview__more";
    extra.textContent = `+${exibidos.length - 5}`;
    extra.setAttribute("aria-label", `Mais ${exibidos.length - 5} staffs online`);
    avatars.appendChild(extra);
  }

  if (!exibidos.length) {
    avatars.innerHTML = `
      <span class="staff-preview__empty" aria-hidden="true">
        <span class="staff-preview__empty-icon"></span>
        <i class="staff-preview__online"></i>
      </span>
    `;

    count.textContent = "Nenhum staff online agora";
    status.textContent = "Chame a Blaze pelo Discord";
    return;
  }

  const quantidade = exibidos.length;

  if (apiTemOnline) {
    count.textContent = quantidade === 1 ? "1 staff online" : `${quantidade} staffs online`;
    status.textContent = "Equipe online para te atender";
    return;
  }

  count.textContent = quantidade === 1 ? "1 staff na equipe" : `${quantidade} staffs na equipe`;
  status.textContent = "Equipe disponível para te atender";
}

function renderizarStaffsFallback() {
  const avatars = document.querySelector("#home-staff-avatars");
  const count = document.querySelector("#home-staff-count");
  const status = document.querySelector("#home-staff-status");

  if (!avatars || !count || !status) return;

  avatars.innerHTML = `
    <span class="staff-preview__empty" aria-hidden="true">
      <span class="staff-preview__empty-icon"></span>
    </span>
  `;

  count.textContent = "Equipe Blaze";
  status.textContent = "Suporte disponível pelo Discord";
}

async function carregarStaffsHome() {
  try {
    const response = await fetch(STAFFS_API, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`API de staffs retornou ${response.status}`);
    }

    const dados = await response.json();

    if (!Array.isArray(dados)) {
      throw new Error("Resposta inválida da API de staffs.");
    }

    renderizarStaffs(dados);
  } catch (error) {
    console.error("Erro ao carregar staffs da home:", error);
    renderizarStaffsFallback();
  }
}

function criarMensagemChat(tipo, texto) {
  const mensagem = document.createElement("div");
  mensagem.className = `support-chat__message support-chat__message--${tipo}`;
  mensagem.textContent = texto;
  return mensagem;
}

function criarDigitandoChat(tipo) {
  const digitando = document.createElement("div");
  digitando.className = `support-chat__typing support-chat__typing--${tipo}`;
  digitando.setAttribute("aria-label", "Digitando");
  digitando.innerHTML = "<span></span><span></span><span></span>";
  return digitando;
}

function iniciarChatDemo() {
  const corpo = document.querySelector("#home-support-chat-body");

  if (!corpo) {
    return;
  }

  const reduzirMovimento = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const esperar = tempo => new Promise(resolve => {
    window.setTimeout(resolve, tempo);
  });

  async function adicionarComAnimacao(elemento) {
    corpo.appendChild(elemento);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        elemento.classList.add("is-visible");
      });
    });

    await esperar(260);
  }

  async function mostrarDigitacao(tipo, tempo = 700) {
    const digitando = criarDigitandoChat(tipo);

    await adicionarComAnimacao(digitando);
    await esperar(tempo);

    digitando.remove();
  }

  async function mostrarMensagem(tipo, texto) {
    const mensagem = criarMensagemChat(tipo, texto);
    await adicionarComAnimacao(mensagem);
  }

  async function iniciarConversa() {
    corpo.innerHTML = "";

    if (reduzirMovimento) {
      const mensagem = criarMensagemChat(
        "staff",
        "Olá! Precisa de ajuda com seu diário? 👋"
      );

      mensagem.classList.add("is-visible");
      corpo.appendChild(mensagem);
      return;
    }

    // A primeira mensagem também começa com o indicador de digitação.
    await mostrarDigitacao("staff", 850);
    await mostrarMensagem(
      "staff",
      "Olá! Precisa de ajuda com seu diário? 👋"
    );

    await esperar(850);

    await mostrarDigitacao("user", 650);
    await mostrarMensagem(
      "user",
      "Queria confirmar o horário e a premiação."
    );

    await esperar(650);

    await mostrarDigitacao("staff", 850);
    await mostrarMensagem(
      "staff",
      "Claro! Vou te ajudar a conferir o horário, a vaga e a premiação do diário. 🔥"
    );

    await esperar(3600);
    iniciarConversa();
  }

  iniciarConversa();
}

function iniciarRevelacoesHome() {
  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduzirMovimento) return;

  const elementos = [
    [document.querySelector(".trust-orbit"), "left", 120],
    [document.querySelector(".trust-section__content"), "right", 190],
    [document.querySelector(".support-section__content"), "left", 260],
    [document.querySelector(".support-chat"), "right", 330],
    ...Array.from(document.querySelectorAll(".benefit-card")).map((elemento, index) => [
      elemento,
      "up",
      80 + index * 55
    ])
  ].filter(([elemento]) => elemento);

  elementos.forEach(([elemento, direcao, atraso]) => {
    elemento.dataset.homeReveal = direcao;
    elemento.style.setProperty("--reveal-delay", `${atraso}ms`);
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elementos.forEach(([elemento]) => elemento.classList.add("is-visible"));
    });
  });
}

carregarDiariosHome();
carregarStaffsHome();
window.setInterval(carregarStaffsHome, STAFF_REFRESH_MS);
iniciarChatDemo();
iniciarRevelacoesHome();
