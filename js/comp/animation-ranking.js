function iniciarAnimacaoRanking() {
  const rankingTabs = document.querySelector(".ranking-tabs");

  if (!rankingTabs) {
    return;
  }

  const tabs = rankingTabs.querySelectorAll(".ranking-tab");

  if (!tabs.length) {
    return;
  }

  function atualizarIndicador(tabAtiva) {
    const index = Array.from(tabs).indexOf(tabAtiva);

    if (index === -1) {
      return;
    }

    rankingTabs.style.setProperty(
      "--active-index",
      index
    );
  }

  const tabInicial = rankingTabs.querySelector(".ranking-tab.is-active") ||
    tabs[0];

  atualizarIndicador(tabInicial);

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      atualizarIndicador(tab);
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    iniciarAnimacaoRanking
  );
} else {
  iniciarAnimacaoRanking();
}
