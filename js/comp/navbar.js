const NAVBAR_API_BASE = "https://api.noturnos.xyz";

function avatarPadraoDiscord(id) {
  try {
    const index = Number(
        BigInt(id) >> 22n
      ) % 6;

    return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
  } catch {
    return "https://cdn.discordapp.com/embed/avatars/0.png";
  }
}

function avatarDiscord(user) {
  if (
    user.avatar &&
    String(user.avatar).startsWith("http")
  ) {
    return user.avatar;
  }

  if (
    user.avatar &&
    user.id
  ) {
    const extensao = String(user.avatar).startsWith("a_")
        ? "gif"
        : "png";

    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${extensao}?size=128`;
  }

  return avatarPadraoDiscord(user.id);
}

function nomeDiscord(user) {
  return (
    user.global_name ||
    user.globalName ||
    user.displayName ||
    user.username ||
    "Usuário"
  );
}

function primeiroNome(user) {
  const nome = nomeDiscord(user).trim();

  return (
    nome.split(/\s+/)[0] ||
    "Usuário"
  );
}

function preencherPerfilNavbar(user) {
  const avatar = avatarDiscord(user);

  const nome = nomeDiscord(user);

  const username = user.username ||
    "usuario";

  const headerAvatar = document.querySelector(
      "#header-user-avatar"
    );

  const headerName = document.querySelector(
      "#header-user-name"
    );

  const mobileAvatar = document.querySelector(
      "#mobile-profile-avatar"
    );

  const mobileName = document.querySelector(
      "#mobile-profile-name"
    );

  const mobileUsername = document.querySelector(
      "#mobile-profile-username"
    );

  if (headerAvatar) {
    headerAvatar.src =
      avatar;

    headerAvatar.alt =
      `Avatar de ${nome}`;
  }

  if (headerName) {
    headerName.textContent =
      primeiroNome(user);
  }

  if (mobileAvatar) {
    mobileAvatar.src =
      avatar;

    mobileAvatar.alt =
      `Avatar de ${nome}`;
  }

  if (mobileName) {
    mobileName.textContent =
      nome;
  }

  if (mobileUsername) {
    mobileUsername.textContent =
      `@${username}`;
  }
}

function mostrarUsuarioNavbar() {
  const login = document.querySelector(
      "#header-discord-login"
    );

  const user = document.querySelector(
      "#header-user"
    );

  const mobileLogin = document.querySelector(
      "#mobile-discord-login"
    );

  const mobileProfile = document.querySelector(
      "#mobile-profile"
    );

  const mobileLogout = document.querySelector(
      "#mobile-profile-logout"
    );

  if (login) {
    login.hidden =
      true;
  }

  if (user) {
    user.hidden =
      false;
  }

  if (mobileLogin) {
    mobileLogin.hidden =
      true;
  }

  if (mobileProfile) {
    mobileProfile.hidden =
      false;
  }

  if (mobileLogout) {
    mobileLogout.hidden =
      false;
  }
}

function mostrarLoginNavbar() {
  const login = document.querySelector(
      "#header-discord-login"
    );

  const user = document.querySelector(
      "#header-user"
    );

  const menu = document.querySelector(
      "#header-user-menu"
    );

  const button = document.querySelector(
      "#header-user-button"
    );

  const mobileLogin = document.querySelector(
      "#mobile-discord-login"
    );

  const mobileProfile = document.querySelector(
      "#mobile-profile"
    );

  const mobileLogout = document.querySelector(
      "#mobile-profile-logout"
    );

  if (login) {
    login.hidden =
      false;
  }

  if (user) {
    user.hidden =
      true;
  }

  if (menu) {
    menu.hidden =
      true;
  }

  if (button) {
    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  if (mobileLogin) {
    mobileLogin.hidden =
      false;
  }

  if (mobileProfile) {
    mobileProfile.hidden =
      true;
  }

  if (mobileLogout) {
    mobileLogout.hidden =
      true;
  }
}

function fecharDropdownNavbar() {
  const button = document.querySelector(
      "#header-user-button"
    );

  const menu = document.querySelector(
      "#header-user-menu"
    );

  if (menu) {
    menu.hidden =
      true;
  }

  if (button) {
    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }
}

function configurarDropdownNavbar() {
  const button = document.querySelector(
      "#header-user-button"
    );

  const menu = document.querySelector(
      "#header-user-menu"
    );

  if (
    !button ||
    !menu
  ) {
    return;
  }

  button.addEventListener(
    "click",
    event => {
      event.preventDefault();
      event.stopPropagation();

      const aberto = !menu.hidden;

      menu.hidden =
        aberto;

      button.setAttribute(
        "aria-expanded",
        String(!aberto)
      );
    }
  );

  menu.addEventListener(
    "click",
    event => {
      event.stopPropagation();
    }
  );

  document.addEventListener(
    "click",
    event => {
      if (
        !button.contains(event.target) &&
        !menu.contains(event.target)
      ) {
        fecharDropdownNavbar();
      }
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key ===
        "Escape"
      ) {
        fecharDropdownNavbar();
      }
    }
  );
}

function configurarPerfilMobile() {
  const mobileProfile = document.querySelector(
      "#mobile-profile"
    );

  if (!mobileProfile) {
    return;
  }

  mobileProfile.setAttribute(
    "role",
    "link"
  );

  mobileProfile.setAttribute(
    "tabindex",
    "0"
  );

  const abrirPerfil = () => {
    window.location.href =
      "./stats.html";
  };

  mobileProfile.addEventListener(
    "click",
    abrirPerfil
  );

  mobileProfile.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter" ||
        event.key === " "
      ) {
        event.preventDefault();

        abrirPerfil();
      }
    }
  );
}

async function logoutNavbar() {
  try {
    await fetch(
      `${NAVBAR_API_BASE}/auth/logout`,
      {
        method:
          "POST",

        credentials:
          "include",

        headers: {
          Accept:
            "application/json"
        }
      }
    );
  } catch {}

  mostrarLoginNavbar();

  window.location.href =
    "./index.html";
}

function configurarLogoutNavbar() {
  const desktopLogout = document.querySelector(
      "#header-user-logout"
    );

  const mobileLogout = document.querySelector(
      "#mobile-profile-logout"
    );

  if (desktopLogout) {
    desktopLogout.addEventListener(
      "click",
      event => {
        event.preventDefault();

        logoutNavbar();
      }
    );
  }

  if (mobileLogout) {
    mobileLogout.addEventListener(
      "click",
      event => {
        event.preventDefault();
        event.stopPropagation();

        logoutNavbar();
      }
    );
  }
}

async function carregarUsuarioNavbar() {
  try {
    const response = await fetch(
        `${NAVBAR_API_BASE}/api/me`,
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
      mostrarLoginNavbar();

      return;
    }

    const data = await response.json();

    const user = data.user ||
      data.discord ||
      data;

    if (
      !user ||
      !user.id
    ) {
      mostrarLoginNavbar();

      return;
    }

    preencherPerfilNavbar(user);

    mostrarUsuarioNavbar();
  } catch {
    mostrarLoginNavbar();
  }
}

function iniciarPerfilNavbar() {
  configurarDropdownNavbar();
  configurarPerfilMobile();
  configurarLogoutNavbar();
  carregarUsuarioNavbar();
}

window.iniciarPerfilNavbar =
  iniciarPerfilNavbar;
