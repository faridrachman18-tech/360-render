"use client";

import { type FormEvent, type MouseEvent, type ReactNode, useEffect, useState } from "react";

type HomeInteractionsProps = {
  children: ReactNode;
};

export function HomeInteractions({ children }: HomeInteractionsProps) {
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) {
      return;
    }

    const timeout = window.setTimeout(() => setNotice(""), 2200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  function showNotice(message: string) {
    setNotice("");
    window.setTimeout(() => setNotice(message), 0);
  }

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const action = (event.target as HTMLElement).closest<HTMLElement>("[data-home-action]");

    if (!action) {
      return;
    }

    const billingToggle = action.closest(".home-billing-toggle, .render-billing-toggle");

    if (billingToggle) {
      billingToggle.querySelectorAll("button").forEach((button) => button.classList.remove("active"));
      action.classList.add("active");
    }

    showNotice(action.dataset.homeAction || "This action is ready for the next app screen.");
  }

  function handleSubmit(event: FormEvent<HTMLDivElement>) {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>("[data-home-newsletter]");

    if (!form) {
      return;
    }

    event.preventDefault();
    form.reset();
    showNotice("Thanks. Newsletter signup is noted for the next integration.");
  }

  return (
    <div className="home-interactions" onClick={handleClick} onSubmit={handleSubmit}>
      {children}
      <p className="home-action-toast" data-visible={notice ? "true" : "false"} role="status" aria-live="polite">
        {notice}
      </p>
    </div>
  );
}
