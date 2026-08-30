function carregarScript(src) {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector(
        `script[src="${src}"]`
      );

    if (existente) {
      resolve();
      return;
    }

    const script = document.createElement("script");

    script.src = src;
    script.onload = resolve;
    script.onerror = reject;

    document.head.appendChild(script);
  });
}

Promise.all([
  fetch("./comp/navbar.html")
    .then(response => {
      if (!response.ok) {
        throw new Error(
          `Erro navbar.html: ${response.status}`
        );
      }

      return response.text();
    }),

  carregarScript(
    "./js/comp/navbar.js"
  )
])
  .then(([html]) => {
    const component = document.querySelector(
        "#navbar-component"
      );

    if (!component) {
      return;
    }

    component.innerHTML = html;

    updateActiveNav();

    if (
      typeof iniciarMenu ===
      "function"
    ) {
      iniciarMenu();
    }

    if (
      typeof window.iniciarPerfilNavbar ===
      "function"
    ) {
      window.iniciarPerfilNavbar();
    }
  })
  .catch(error => {
    console.error(
      "Erro ao carregar navbar:",
      error
    );
  });

fetch("./comp/discord.html")
  .then(response => {
    if (!response.ok) {
      throw new Error(
        `Erro discord.html: ${response.status}`
      );
    }

    return response.text();
  })
  .then(html => {
    const component = document.querySelector(
        "#discord-component"
      );

    if (component) {
      component.innerHTML = html;
    }
  })
  .catch(error => {
    console.error(
      "Erro ao carregar discord:",
      error
    );
  });

Promise.all([
  fetch("./comp/booster.html")
    .then(response => {
      if (!response.ok) {
        throw new Error(
          `Erro booster.html: ${response.status}`
        );
      }

      return response.text();
    }),

  carregarScript(
    "./js/comp/booster.js"
  )
])
  .then(([html]) => {
    const component = document.querySelector(
        "#booster-component"
      );

    if (!component) {
      console.error(
        "#booster-component não encontrado"
      );
      return;
    }

    component.innerHTML = html;

    if (
      typeof window.iniciarBooster ===
      "function"
    ) {
      window.iniciarBooster();
    } else {
      console.error(
        "window.iniciarBooster não existe"
      );
    }
  })
  .catch(error => {
    console.error(
      "Erro ao carregar booster:",
      error
    );
  });

fetch("./comp/footer.html")
  .then(response => {
    if (!response.ok) {
      throw new Error(
        `Erro footer.html: ${response.status}`
      );
    }

    return response.text();
  })
  .then(html => {
    const component = document.querySelector(
        "#footer-component"
      );

    if (component) {
      component.innerHTML = html;
    }
  })
  .catch(error => {
    console.error(
      "Erro ao carregar footer:",
      error
    );
  });

fetch("./comp/duvida.html")
  .then(response => {
    if (!response.ok) {
      throw new Error(
        `Erro duvida.html: ${response.status}`
      );
    }

    return response.text();
  })
  .then(html => {
    const component = document.querySelector(
        "#contact-discord-component"
      );

    if (component) {
      component.innerHTML = html;
    }
  })
  .catch(error => {
    console.error(
      "Erro ao carregar dúvida:",
      error
    );
  });

fetch("./comp/discord-float.html")
  .then(response => {
    if (!response.ok) {
      throw new Error(
        `Erro discord-float.html: ${response.status}`
      );
    }

    return response.text();
  })
  .then(html => {
    const component = document.querySelector(
        "#discord-float-component"
      );

    if (component) {
      component.innerHTML = html;
    }
  })
  .catch(error => {
    console.error(
      "Erro ao carregar discord float:",
      error
    );
  });

function updateActiveNav() {
  const currentPage = window.location.pathname
      .split("/")
      .pop() ||
    "index.html";

  const desktopLinks = document.querySelectorAll(
      ".header__link"
    );

  const mobileLinks = document.querySelectorAll(
      ".mobile-menu a"
    );

  function setActive(link) {
    const linkPage = new URL(
        link.href,
        window.location.href
      )
        .pathname
        .split("/")
        .pop();

    const isActive = linkPage ===
      currentPage;

    link.classList.toggle(
      "header__link--active",
      isActive
    );

    if (isActive) {
      link.setAttribute(
        "aria-current",
        "page"
      );
    } else {
      link.removeAttribute(
        "aria-current"
      );
    }
  }

  desktopLinks.forEach(setActive);
  mobileLinks.forEach(setActive);
}
