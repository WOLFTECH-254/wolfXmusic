import { useEffect } from "react";

interface PageMeta {
  title: string;
  description?: string;
  image?: string;
}

const BASE_TITLE = "wolfXmusic";
const BASE_DESC = "wolfXmusic — stream anything. Discover, search, and listen to full songs from any artist.";

function setMeta(selector: string, attr: string, value: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute(attr, value);
}

export function usePageMeta({ title, description, image }: PageMeta) {
  useEffect(() => {
    const fullTitle = title === BASE_TITLE ? BASE_TITLE : `${title} — ${BASE_TITLE}`;
    const desc = description || BASE_DESC;
    const ogImage = image || `${window.location.origin}/og-image.svg`;

    document.title = fullTitle;

    setMeta('meta[name="description"]', "content", desc);

    setMeta('meta[property="og:title"]', "content", fullTitle);
    setMeta('meta[property="og:description"]', "content", desc);
    setMeta('meta[property="og:image"]', "content", ogImage);

    setMeta('meta[name="twitter:title"]', "content", fullTitle);
    setMeta('meta[name="twitter:description"]', "content", desc);
    setMeta('meta[name="twitter:image"]', "content", ogImage);

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title, description, image]);
}
