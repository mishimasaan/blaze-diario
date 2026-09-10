const faqItems = document.querySelectorAll(
    ".faq-item"
  );

faqItems.forEach(item => {
  const button = item.querySelector(
      ".faq-item__button"
    );

  if (!button) {
    return;
  }

  button.addEventListener(
    "click",
    () => {
      const aberto = item.classList.contains(
          "is-open"
        );

      faqItems.forEach(outroItem => {
        outroItem.classList.remove(
          "is-open"
        );

        const outroBotao = outroItem.querySelector(
            ".faq-item__button"
          );

        if (outroBotao) {
          outroBotao.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      });

      if (!aberto) {
        item.classList.add(
          "is-open"
        );

        button.setAttribute(
          "aria-expanded",
          "true"
        );
      }
    }
  );
});

const staffContainers = {
  owner:
    document.getElementById(
      "contact-staff-owner"
    ),

  admin:
    document.getElementById(
      "contact-staff-admin"
    ),

  ajudante:
    document.getElementById(
      "contact-staff-ajudante"
    ),

  designer:
    document.getElementById(
      "contact-staff-designer"
    )
};

const nomesCargos = {
  owner: "Owner",
  admin: "Admin",
  ajudante: "Ajudante",
  designer: "Designer"
};

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function avatarPadrao(id = "0") {
  const indice = Number(
      String(id).slice(-1)
    ) % 6;

  return `https://cdn.discordapp.com/embed/avatars/${indice}.png`;
}

function criarCardStaff(staff) {
  const cargo = String(
      staff.cargo || "staff"
    )
      .toLowerCase()
      .trim();

  const nome = staff.nome ||
    staff.displayName ||
    staff.username ||
    "Usuário";

  const username = staff.username
      ? `@${staff.username}`
      : "";

  const avatar = staff.avatar ||
    avatarPadrao(
      staff.id
    );

  const cargoNome = nomesCargos[cargo] ||
    cargo;

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
        >
      </div>

      <div class="contact-staff__content">
        <span
          class="contact-staff__role contact-staff__role--${escaparHTML(cargo)}"
        >
          ${escaparHTML(cargoNome)}
        </span>

        <strong class="contact-staff__name">
          ${escaparHTML(nome)}
        </strong>

        <span class="contact-staff__username">
          ${escaparHTML(username)}
        </span>
      </div>
    </article>
  `;
}

async function carregarStaffs() {
  try {
    const response = await fetch(
        "https://api.noturnos.xyz/api/staffs"
      );

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }

    const dados = await response.json();

    const staffs = Array.isArray(dados)
        ? dados
        : Array.isArray(dados.staffs)
          ? dados.staffs
          : [];

    Object.values(
      staffContainers
    ).forEach(container => {
      if (container) {
        container.innerHTML = "";
      }
    });

    staffs.forEach(staff => {
      const cargo = String(
          staff.cargo || ""
        )
          .toLowerCase()
          .trim();

      const container = staffContainers[cargo];

      if (!container) {
        return;
      }

      container.insertAdjacentHTML(
        "beforeend",
        criarCardStaff(staff)
      );
    });

    Object.entries(
      staffContainers
    ).forEach(
      ([cargo, container]) => {
        if (!container) {
          return;
        }

        const grupo = container.closest(
            ".contact-staff__group"
          );

        if (
          grupo &&
          container.children.length === 0
        ) {
          grupo.style.display =
            "none";
        } else if (grupo) {
          grupo.style.display =
            "";
        }
      }
    );

    document
      .querySelectorAll(
        ".contact-staff__avatar"
      )
      .forEach(img => {
        img.addEventListener(
          "error",
          () => {
            const card = img.closest(
                ".contact-staff__card"
              );

            img.src =
              avatarPadrao(
                card?.dataset.userId
              );
          },
          {
            once: true
          }
        );
      });

  } catch (error) {
    console.error(
      "Erro ao carregar staffs:",
      error
    );
  }
}

carregarStaffs();
