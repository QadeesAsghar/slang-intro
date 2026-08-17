import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import { WaitlistSection } from "@/components/site/WaitlistSection";

const title = "Join the Slang waitlist";
const description =
  "Slang is a customer communication platform. Leave your email and we'll notify you the moment your workspace is ready.";
const url = "https://slang-intro.vercel.app/waitlist";

export const Route = createFileRoute("/waitlist")({
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
  component: WaitlistPage,
});

function WaitlistPage() {
  return (
    <>
      <Nav />
      <main>
        <WaitlistSection />
      </main>
      <Footer />
    </>
  );
}
