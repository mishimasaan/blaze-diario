document.addEventListener(
  "DOMContentLoaded",
  () => {

    const elementos = [
      ...document.querySelectorAll(
        ".about-intro__label," +
        ".about-intro__content," +
        ".about-section-heading," +
        ".about-value," +
        ".about-system__heading," +
        ".about-step," +
        ".about-final__content"
      )
    ];

    if (
      !elementos.length
    ) {
      return;
    }

    const reduzirMovimento = window.matchMedia(
        "(prefers-reduced-motion: reduce)"
      ).matches;

    if (
      reduzirMovimento ||
      !("IntersectionObserver" in window)
    ) {
      elementos.forEach(
        elemento => {
          elemento.classList.add(
            "is-visible"
          );
        }
      );

      return;
    }

    elementos.forEach(
      elemento => {
        elemento.classList.add(
          "about-reveal"
        );
      }
    );

    const observer = new IntersectionObserver(
        entries => {

          entries.forEach(
            entry => {

              if (
                !entry.isIntersecting
              ) {
                return;
              }

              entry.target
                .classList
                .add(
                  "is-visible"
                );

              observer.unobserve(
                entry.target
              );

            }
          );

        },
        {
          threshold: 0.12,
          rootMargin:
            "0px 0px -45px 0px"
        }
      );

    elementos.forEach(
      elemento => {
        observer.observe(
          elemento
        );
      }
    );

  }
);
