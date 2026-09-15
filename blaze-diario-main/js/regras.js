const categoryButtons = document.querySelectorAll(
    ".rules-nav__button"
  );

const categories = document.querySelectorAll(
    ".rules-category"
  );

const ruleItems = document.querySelectorAll(
    ".rule-item"
  );

function selecionarCategoria(categoryId) {
  categoryButtons.forEach(
    button => {
      const active = button.dataset.category ===
        categoryId;

      button.classList.toggle(
        "is-active",
        active
      );
    }
  );

  categories.forEach(
    category => {
      const active = category.dataset.rulesCategory ===
        categoryId;

      category.hidden =
        !active;

      category.classList.toggle(
        "is-active",
        active
      );
    }
  );
}

function fecharRegra(item) {
  item.classList.remove(
    "is-open"
  );

  const button = item.querySelector(
      ".rule-item__header"
    );

  if (button) {
    button.setAttribute(
      "aria-expanded",
      "false"
    );
  }
}

function abrirRegra(item) {
  item.classList.add(
    "is-open"
  );

  const button = item.querySelector(
      ".rule-item__header"
    );

  if (button) {
    button.setAttribute(
      "aria-expanded",
      "true"
    );
  }
}

categoryButtons.forEach(
  button => {
    button.addEventListener(
      "click",
      () => {
        const categoryId = button.dataset.category;

        if (!categoryId) {
          return;
        }

        selecionarCategoria(
          categoryId
        );
      }
    );
  }
);

ruleItems.forEach(
  item => {
    const button = item.querySelector(
        ".rule-item__header"
      );

    if (!button) {
      return;
    }

    button.addEventListener(
      "click",
      () => {
        const aberta = item.classList.contains(
            "is-open"
          );

        const category = item.closest(
            ".rules-category"
          );

        if (category) {
          category
            .querySelectorAll(
              ".rule-item.is-open"
            )
            .forEach(
              outroItem => {
                if (
                  outroItem !== item
                ) {
                  fecharRegra(
                    outroItem
                  );
                }
              }
            );
        }

        if (aberta) {
          fecharRegra(
            item
          );

          return;
        }

        abrirRegra(
          item
        );
      }
    );
  }
);
