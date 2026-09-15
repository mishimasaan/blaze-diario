const FAQ_ITEMS = document.querySelectorAll(".faq-item");
const STAFFS_API = "https://api.blazediarios.com/api/staffs";
const STAFF_REFRESH_MS = 4 * 60 * 1000;

const staffContainers = {
  owner: document.getElementById("contact-staff-owner"),
  admin: document.getElementById("contact-staff-admin"),
  ajudante: document.getElementById("contact-staff-ajudante"),
  designer: document.getElementById("contact-staff-designer")
};

const nomesCargos = {
  owner: "Owner",
  admin: "Admin",
  ajudante: "Ajudante",
  designer: "Designer"
};

function iniciarFaq() {
  FAQ_ITEMS.forEach(item => {
    const botao = item.querySelector(".faq-item__button");

    if (!botao) return;

    botao.addEventListener("click", () => {
      const estavaAberto = item.classList.contains("is-open");

      FAQ_ITEMS.forEach(outroItem => {
        outroItem.classList.remove("is-open");
        outroItem
          .querySelector(".faq-item__button")
          ?.setAttribute("aria-expanded", "false");
      });

      if (!estavaAberto) {
        item.classList.add("is-open");
        botao.setAttribute("aria-expanded", "true");
      }
    });
  });
}

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

function normalizarCargo(cargo) {
  return String(cargo || "").trim().toLowerCase();
}

function staffEhValido(staff) {
  if (!staff) return false;

  const cargo = normalizarCargo(staff.cargo);
  return Object.prototype.hasOwnProperty.call(staffContainers, cargo);
}

function criarCardStaff(staff) {
  const cargo = normalizarCargo(staff.cargo);
  const nome = staff.nome || staff.displayName || staff.username || "Usuário";
  const username = staff.username ? `@${staff.username}` : "";
  const avatar = staff.avatar || avatarPadrao(staff.id);
  const cargoNome = nomesCargos[cargo] || cargo;

  return `
    <article
      class="contact-staff__card"
      data-role="${escaparHTML(cargo)}"
      data-user-id="${escaparHTML(staff.id || "")}"
    >
      <div class="contact-staff__avatar-wrap">
        <img
          class="contact-staff__avatar"
          src="${escaparHTML(avatar)}"
          alt="Avatar de ${escaparHTML(nome)}"
          loading="lazy"
          referrerpolicy="no-referrer"
        >
      </div>

      <div class="contact-staff__content">
        <span class="contact-staff__role contact-staff__role--${escaparHTML(cargo)}">
          ${escaparHTML(cargoNome)}
        </span>

        <strong class="contact-staff__name">${escaparHTML(nome)}</strong>
        <span class="contact-staff__username">${escaparHTML(username)}</span>
      </div>
    </article>
  `;
}

function limparStaffs() {
  Object.values(staffContainers).forEach(container => {
    if (container) container.innerHTML = "";
  });
}

function atualizarVisibilidadeDosGrupos() {
  Object.values(staffContainers).forEach(container => {
    if (!container) return;

    const grupo = container.closest(".contact-staff__group");
    if (!grupo) return;

    grupo.style.display = container.children.length ? "" : "none";
  });
}

function ativarFallbackDeAvatar() {
  document.querySelectorAll(".contact-staff__avatar").forEach(imagem => {
    imagem.addEventListener(
      "error",
      () => {
        const card = imagem.closest(".contact-staff__card");
        imagem.src = avatarPadrao(card?.dataset.userId);
      },
      { once: true }
    );
  });
}

function renderizarStaffs(dados) {
  const staffs = dados.filter(staffEhValido);

  limparStaffs();

  staffs.forEach(staff => {
    const cargo = normalizarCargo(staff.cargo);
    const container = staffContainers[cargo];

    if (!container) return;

    container.insertAdjacentHTML("beforeend", criarCardStaff(staff));
  });

  atualizarVisibilidadeDosGrupos();
  ativarFallbackDeAvatar();
}

async function carregarStaffs() {
  try {
    const response = await fetch(STAFFS_API, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const dados = await response.json();
    const staffs = Array.isArray(dados)
      ? dados
      : Array.isArray(dados.staffs)
        ? dados.staffs
        : [];

    renderizarStaffs(staffs);
  } catch (error) {
    console.error("Erro ao carregar staffs:", error);
  }
}

iniciarFaq();
carregarStaffs();
window.setInterval(carregarStaffs, STAFF_REFRESH_MS);
