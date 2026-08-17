import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Hero } from "@/components/site/Hero";
import { Footer } from "@/components/site/Footer";
import { WhatIsSlang, ProductTour, ConnectSection } from "@/components/site/Sections";

const title = "Slang: Every customer conversation, in one place";
const description =
  "Slang is a customer communication platform bringing website chat, customer context and team workflows into one workspace.";
const url = "https://slang-intro.vercel.app/";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [{ rel: "canonical", href: url }],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <WhatIsSlang />
        <ProductTour />
        <ConnectSection />
      </main>
      <Footer />
    </>
  );
}
