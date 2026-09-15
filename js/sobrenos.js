document.addEventListener("DOMContentLoaded", () => {
  const elementos = [
    ...document.querySelectorAll(
      ".about-intro__label, " +
      ".about-intro__content, " +
      ".about-section-heading, " +
      ".about-value, " +
      ".about-system__heading, " +
      ".about-step, " +
      ".about-final__content"
    )
  ];

  if (!elementos.length) return;

  const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  elementos.forEach((elemento, index) => {
    elemento.classList.add("about-reveal");

    if (!reduzirMovimento) {
      const atraso = Math.min(index * 55, 380);
      elemento.style.setProperty("--about-delay", `${atraso}ms`);
    }
  });

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elementos.forEach(elemento => elemento.classList.add("is-visible"));
    });
  });
});
