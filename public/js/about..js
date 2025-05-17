// Scroll animations
document.addEventListener("DOMContentLoaded", () => {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.3,
  };

  const animateOnScroll = (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = "translateY(0) scale(1)";
        observer.unobserve(entry.target);
      }
    });
  };

  const elements = document.querySelectorAll(".fade-in, .slide-in, .zoom-in");
  const observer = new IntersectionObserver(animateOnScroll, observerOptions);

  elements.forEach((el) => observer.observe(el));
});

// Counter animation

document.addEventListener("DOMContentLoaded", () => {
    const counters = document.querySelectorAll(".counter");

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = +counter.getAttribute("data-target");
                let count = 0;

                const updateCounter = () => {
                    const increment = target / 100; // Adjust speed here
                    if (count < target) {
                        count += increment;
                        counter.innerText = Math.floor(count);
                        setTimeout(updateCounter, 20);
                    } else {
                        counter.innerText = target + "+"; // Append "+" sign after counting
                    }
                };

                updateCounter();
                observer.unobserve(counter); // Stop observing once animation runs
            }
        });
    }, { threshold: 0.5 }); // Triggers when 50% of the element is visible

    counters.forEach(counter => observer.observe(counter));
});



const observerStats = new IntersectionObserver(
  (entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        startCount(entry.target);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.5 }
);

counters.forEach((counter) => observerStats.observe(counter));
