import Link from "next/link";
import type { CSSProperties } from "react";
import {
  ArrowRight,
  Box,
  Check,
  CloudUpload,
  Eye,
  Instagram,
  Linkedin,
  Monitor,
  SlidersHorizontal,
  Sparkles,
  Twitter,
  Youtube
} from "lucide-react";
import { HeroPanoramaPreview } from "@/components/HeroPanoramaPreview";
import { HomeInteractions } from "@/components/HomeInteractions";

const featureCards = [
  {
    title: "Render",
    description: "Photorealistic 360-degree rooms with controlled material detail and believable light.",
    image: "/panoramas/generated-hero-panorama.png",
    icon: Box
  },
  {
    title: "Upscale",
    description: "AI-powered clarity for surfaces, lighting, and texture without overcooking the scene.",
    image: "/panoramas/urban-office.jpg",
    icon: Sparkles
  },
  {
    title: "Present",
    description: "Immersive viewers that help clients inspect the room instead of the interface.",
    image: "/panoramas/living-room.jpg",
    icon: Monitor
  }
];

const workflowSteps = [
  {
    title: "Export from SketchUp",
    description: "Get our SketchUp plugin to export panorama images from your projects.",
    icon: CloudUpload
  },
  {
    title: "Upload to 360 Render",
    description: "Bring your panorama into the web app and keep each project ready for rendering.",
    icon: SlidersHorizontal
  },
  {
    title: "Render and upscale",
    description: "Choose a preset, generate the final look, and upscale the panorama for sharper presentation quality.",
    icon: Sparkles
  },
  {
    title: "Share the presentation",
    description: "Send a private 360° viewer to your team or client so they can step inside the design.",
    icon: Monitor
  }
];

const showcaseProjects = [
  {
    title: "Oceanfront Villa",
    category: "Residential",
    image: "/panoramas/outdoor-terrace.jpg",
    views: "1.2k"
  },
  {
    title: "Luxury Hotel Lobby",
    category: "Hospitality",
    image: "/panoramas/living-room.jpg",
    views: "2.4k"
  },
  {
    title: "Modern Office HQ",
    category: "Commercial",
    image: "/panoramas/urban-office.jpg",
    views: "1.8k"
  },
  {
    title: "Penthouse Suite",
    category: "Residential",
    image: "/panoramas/generated-hero-panorama.png",
    views: "1.6k"
  }
];

const pricingPlans = [
  {
    name: "Free",
    description: "For individuals getting started.",
    price: "$0",
    features: ["Up to 2 renders / month", "Basic 360-degree viewer", "Standard quality", "Community support"]
  },
  {
    name: "Pro",
    description: "For pros and growing teams.",
    price: "$19.99",
    featured: true,
    features: ["Up to 50 renders / month", "AI upscaling (4K)", "Custom branding", "Priority email support"]
  },
  {
    name: "Studio",
    description: "For studios and high volume.",
    price: "$49.99",
    features: ["Unlimited renders", "AI upscaling (8K)", "Team collaboration", "Priority support + SLA"]
  }
];

type FooterLink = {
  label: string;
  href?: string;
};

const footerGroups: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Workflow", href: "#how-it-works" },
      { label: "Showcase", href: "#showcase" },
      { label: "Pricing", href: "#pricing" }
    ]
  },
  {
    title: "Company",
    links: [{ label: "About Us" }, { label: "Careers" }, { label: "Contact" }, { label: "Blog" }]
  },
  {
    title: "Resources",
    links: [{ label: "Help Center" }, { label: "Documentation" }, { label: "Guides" }, { label: "API" }]
  }
];

export default function Home() {
  return (
    <main className="render-home">
      <HomeInteractions>
        <div className="render-home-shell">
          <span className="render-light-beam beam-left" aria-hidden="true" />
          <span className="render-light-beam beam-right" aria-hidden="true" />

          <header className="render-nav" aria-label="Public navigation">
            <Link className="render-brand" href="/">
              <Box size={27} strokeWidth={1.7} />
              <span>360 Render</span>
            </Link>
            <nav className="render-nav-actions" aria-label="Account links">
              <Link href="#pricing">Pricing</Link>
              <Link href="#showcase">Showcase</Link>
              <Link className="render-nav-cta" href="/login">
                Log in
              </Link>
            </nav>
          </header>

          <section className="render-hero" aria-labelledby="home-title">
            <HeroPanoramaPreview />

            <div className="render-hero-copy">
              <h1 id="home-title" aria-label="Step into your design.">
                Step into your
                <em>design</em>
              </h1>
              <p className="render-hero-text">
                Render, upscale, and share immersive panoramas that make your design easier to understand.
              </p>
              <div className="render-hero-actions">
                <Link className="render-primary-cta" href="/login">
                  <span className="render-cta-label">Start Free</span>
                  <span className="render-cta-icon" aria-hidden="true">
                    <ArrowRight size={15} strokeWidth={2.2} />
                  </span>
                </Link>
              </div>
            </div>
          </section>

          <section className="render-workflow" id="how-it-works" aria-labelledby="workflow-title">
            <div className="render-section-heading">
              <span>How it works</span>
              <h2 id="workflow-title">From SketchUp to panorama presentation in 4 simple steps.</h2>
            </div>
            <div className="render-step-list">
              {workflowSteps.map(({ title, description, icon: Icon }, index) => (
                <article className="render-step-card" key={title} style={{ "--index": index } as CSSProperties}>
                  <span className="render-step-number">{index + 1}</span>
                  <Icon size={27} strokeWidth={1.6} />
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="render-feature-grid" id="features" aria-label="Render upscale present">
            {featureCards.map(({ title, description, image, icon: Icon }, index) => (
              <article className="render-feature-card" key={title} style={{ "--index": index } as CSSProperties}>
                <div className="render-icon-box">
                  <Icon size={24} strokeWidth={1.6} />
                </div>
                <div className="render-feature-copy">
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>
                <img src={image} alt="" />
              </article>
            ))}
          </section>

          <section className="render-showcase" id="showcase" aria-labelledby="showcase-title">
            <div className="render-showcase-heading">
              <div>
                <span>Showcase</span>
                <h2 id="showcase-title">Inspiring spaces. Stunning 360-degree experiences.</h2>
              </div>
              <Link href="/projects">
                View All Projects
                <ArrowRight size={17} />
              </Link>
            </div>
            <div className="render-showcase-grid">
              {showcaseProjects.map((project, index) => (
                <article className="render-showcase-card" key={project.title} style={{ "--index": index } as CSSProperties}>
                  <img src={project.image} alt="" />
                  <div className="render-showcase-meta">
                    <div>
                      <h3>{project.title}</h3>
                      <p>{project.category}</p>
                    </div>
                    <span>
                      <Eye size={14} />
                      {project.views}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="render-pricing" id="pricing" aria-labelledby="pricing-title">
            <div className="render-pricing-heading">
              <div>
                <span>Pricing</span>
                <h2 id="pricing-title">Simple pricing for every studio.</h2>
              </div>
              <div className="render-billing-toggle" aria-label="Billing period">
                <button data-home-action="Monthly billing preview selected." type="button">
                  Monthly
                </button>
                <button className="active" data-home-action="Yearly billing preview selected." type="button">
                  Yearly
                </button>
                <em>Save up to 30%</em>
              </div>
            </div>

            <div className="render-pricing-grid">
              {pricingPlans.map((plan) => (
                <article className={plan.featured ? "render-price-card featured" : "render-price-card"} key={plan.name}>
                  {plan.featured ? <span className="render-popular">Most Popular</span> : null}
                  <h3>{plan.name}</h3>
                  <p>{plan.description}</p>
                  <div className="render-price">
                    {plan.price}
                    <span>/ month</span>
                  </div>
                  <ul>
                    {plan.features.map((feature) => (
                      <li key={feature}>
                        <Check size={14} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link className="render-plan-cta" href="/login">
                    Get Started
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <footer className="render-footer">
            <div className="render-footer-brand">
              <Link className="render-brand" href="/">
                <Box size={27} strokeWidth={1.7} />
                <span>360 Render</span>
              </Link>
              <p>The all-in-one platform to render, upscale, and present 360-degree panoramas.</p>
            </div>
            {footerGroups.map((group) => (
              <div className="render-footer-links" key={group.title}>
                <h2>{group.title}</h2>
                {group.links.map((item) =>
                  item.href ? (
                    <Link href={item.href} key={item.label}>
                      {item.label}
                    </Link>
                  ) : (
                    <button data-home-action={`${item.label} is ready for the next content pass.`} key={item.label} type="button">
                      {item.label}
                    </button>
                  )
                )}
              </div>
            ))}
            <div className="render-newsletter">
              <h2>Stay in the loop</h2>
              <p>Get updates on new features and industry insights.</p>
              <form data-home-newsletter>
                <label>
                  <span>Email address</span>
                  <input placeholder="Enter your email" type="email" />
                </label>
                <button type="submit" aria-label="Subscribe">
                  <ArrowRight size={18} />
                </button>
              </form>
              <div className="render-socials" aria-label="Social links">
                <button data-home-action="LinkedIn profile link is ready for setup." type="button" aria-label="LinkedIn">
                  <Linkedin size={14} />
                </button>
                <button data-home-action="Instagram profile link is ready for setup." type="button" aria-label="Instagram">
                  <Instagram size={14} />
                </button>
                <button data-home-action="YouTube profile link is ready for setup." type="button" aria-label="YouTube">
                  <Youtube size={15} />
                </button>
                <button data-home-action="Twitter profile link is ready for setup." type="button" aria-label="Twitter">
                  <Twitter size={14} />
                </button>
              </div>
            </div>
            <div className="render-legal">
              <span>2026 360 Render. All rights reserved.</span>
              <nav aria-label="Legal links">
                <button data-home-action="Privacy Policy will open once the legal page is connected." type="button">
                  Privacy Policy
                </button>
                <button data-home-action="Terms of Service will open once the legal page is connected." type="button">
                  Terms of Service
                </button>
              </nav>
            </div>
          </footer>
        </div>
      </HomeInteractions>
    </main>
  );
}
