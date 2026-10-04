import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowRight, MessageCircle, Users, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./Reveal";
import { useMagnetic } from "@/hooks/use-magnetic";

export function Hero() {
  const ctaRef = useMagnetic<HTMLAnchorElement>();
  return (
    <section id="top" className="intro-hero">
      <div className="intro-hero__layout mx-auto max-w-7xl px-5 lg:px-8">
        <div className="intro-hero__copy">
          <p className="intro-eyebrow">
            <span aria-hidden="true" /> Customer communication, connected
          </p>
          <h1 className="intro-hero__title">
            Every conversation.<span>A closer connection.</span>
          </h1>
          <p className="intro-hero__description">
            Meet Slang. Bring website chat, customer context and your team together — so every
            conversation can move forward.
          </p>
          <div className="intro-hero__actions">
            <Button size="lg" asChild>
              <Link ref={ctaRef} to="/waitlist" className="group">
                Join the waitlist
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <a href="#product-tour" className="intro-text-link">
              Explore Slang <ArrowDown className="size-4" aria-hidden="true" />
            </a>
          </div>
          <p className="intro-hero__note">In development. Get an invitation when we’re ready.</p>
        </div>
        <Reveal direction="scale" className="intro-hero__visual">
          <figure
            className="conversation-scene"
            aria-label="Illustration of a customer conversation connecting with a team through Slang"
          >
            <div className="conversation-scene__art" aria-hidden="true">
              <div className="conversation-orbit conversation-orbit--outer" />
              <div className="conversation-orbit conversation-orbit--inner" />
              <span className="conversation-node conversation-node--web">
                <Globe />
              </span>
              <span className="conversation-node conversation-node--team">
                <Users />
              </span>
              <span className="conversation-node conversation-node--chat">
                <MessageCircle />
              </span>
              <div className="conversation-bubble conversation-bubble--customer">
                <span className="conversation-avatar">J</span>
                <div>
                  <span className="conversation-speaker">A customer</span>
                  <p>Hi! Could you help me with my order?</p>
                </div>
              </div>
              <div className="conversation-center">
                <img src="/favicon.png" alt="" />
                <span>slang</span>
              </div>
              <div className="conversation-bubble conversation-bubble--team">
                <span className="conversation-avatar conversation-avatar--team">S</span>
                <div>
                  <span className="conversation-speaker">Your team</span>
                  <p>Of course. Let’s take a look together.</p>
                </div>
              </div>
              <div className="conversation-outcome">
                <span aria-hidden="true" /> One conversation. Everyone connected.
              </div>
            </div>
            <figcaption>Illustrative conversation · Website chat → Your team</figcaption>
          </figure>
        </Reveal>
      </div>
      <div className="intro-hero__index mx-auto max-w-7xl px-5 lg:px-8">
        <span>Built around the conversation</span>
        <a href="#product">
          Discover the platform <ArrowDown className="size-4" aria-hidden="true" />
        </a>
      </div>
    </section>
  );
}
