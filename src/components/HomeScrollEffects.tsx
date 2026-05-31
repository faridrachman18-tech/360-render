"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const REVEAL_START = "top 84%";
const GROUP_START = "top 82%";

export function HomeScrollEffects() {
  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: no-preference)");

    if (!motionQuery.matches) {
      return;
    }

    const root = document.querySelector<HTMLElement>(".render-home-shell");

    if (!root) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    root.dataset.gsapScroll = "true";
    root.getBoundingClientRect();

    const ctx = gsap.context(() => {
      const revealTargets = gsap.utils.toArray<HTMLElement>("[data-scroll-reveal]");

      revealTargets.forEach((target) => {
        gsap.fromTo(
          target,
          {
            autoAlpha: 0,
            scale: 0.985,
            y: 34
          },
          {
            autoAlpha: 1,
            clearProps: "opacity,transform,visibility",
            duration: 0.86,
            ease: "power3.out",
            scale: 1,
            scrollTrigger: {
              once: true,
              start: REVEAL_START,
              trigger: target
            },
            y: 0
          }
        );
      });

      const groupedTargets = gsap.utils.toArray<HTMLElement>("[data-scroll-group]");

      groupedTargets.forEach((group) => {
        const items = gsap.utils.toArray<HTMLElement>("[data-scroll-item]", group);

        if (!items.length) {
          return;
        }

        gsap.fromTo(
          items,
          {
            autoAlpha: 0,
            scale: 0.985,
            y: 26
          },
          {
            autoAlpha: 1,
            clearProps: "opacity,transform,visibility",
            duration: 0.72,
            ease: "power3.out",
            scale: 1,
            scrollTrigger: {
              once: true,
              start: GROUP_START,
              trigger: group
            },
            stagger: 0.07,
            y: 0
          }
        );
      });

      const hero = root.querySelector<HTMLElement>(".render-hero");
      const preview = root.querySelector<HTMLElement>(".render-preview");
      const heroCopy = root.querySelector<HTMLElement>(".render-hero-copy");

      if (hero && preview) {
        gsap.set(preview, { clearProps: "opacity,transform,visibility" });
        gsap.to(preview, {
          ease: "none",
          scrollTrigger: {
            end: "bottom top",
            scrub: true,
            start: "top top",
            trigger: hero
          },
          yPercent: 8
        });
      }

      if (hero && heroCopy) {
        gsap.set(heroCopy, { clearProps: "opacity,transform,visibility" });
        gsap.to(heroCopy, {
          autoAlpha: 0.78,
          ease: "none",
          scrollTrigger: {
            end: "bottom top",
            scrub: true,
            start: "top top",
            trigger: hero
          },
          yPercent: -5
        });
      }

      ScrollTrigger.refresh();
    }, root);

    const refreshScrollTrigger = () => ScrollTrigger.refresh();
    const refreshTimeout = window.setTimeout(refreshScrollTrigger, 250);

    window.addEventListener("load", refreshScrollTrigger, { once: true });

    return () => {
      window.clearTimeout(refreshTimeout);
      window.removeEventListener("load", refreshScrollTrigger);
      delete root.dataset.gsapScroll;
      ctx.revert();
    };
  }, []);

  return null;
}
