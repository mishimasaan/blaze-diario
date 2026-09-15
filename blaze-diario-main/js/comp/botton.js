function iniciarMenu() {
  const button = document.querySelector(".header__menu-button");
  const menu = document.querySelector("#mobile-menu");

  if (!button || !menu) return;

  button.addEventListener("click", () => {
    const aberto = menu.classList.toggle("is-open");

    button.setAttribute("aria-expanded", aberto);
    button.setAttribute(
      "aria-label",
      aberto ? "Fechar menu" : "Abrir menu"
    );
  });
}
