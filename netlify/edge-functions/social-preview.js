// Social crawlers read response HTML and do not execute the language switcher.
// Change only social metadata; the page body and existing language script stay intact.
const pages = {
  ru: {
    title: "QUICKSITE EST — сайты с человеческим смыслом",
    description: "QUICKSITE EST — сайты, созданные живыми людьми с усилением искусственного интеллекта.",
    locale: "ru_RU"
  },
  et: {
    title: "QUICKSITE EST — inimliku tähendusega veebilehed",
    description: "QUICKSITE EST — veebilehed, mille loovad päris inimesed ja mida täiustab tehisintellekt.",
    locale: "et_EE"
  },
  en: {
    title: "QUICKSITE EST — websites with a human touch",
    description: "QUICKSITE EST — websites created by real people and enhanced by artificial intelligence.",
    locale: "en_US"
  }
};

const escapeAttribute = value => value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export default async (request, context) => {
  if (request.method !== "GET") return;
  const language = new URL(request.url).searchParams.get("lang");
  if (!pages[language] || language === "ru") return;
  const response = await context.next();
  if (response.status !== 200 || !response.headers.get("content-type")?.includes("text/html")) return response;
  const page = pages[language];
  const values = {
    "og:title": page.title,
    "twitter:title": page.title,
    "og:description": page.description,
    "twitter:description": page.description,
    "og:locale": page.locale,
    "og:url": `https://qse-lab.com/?lang=${language}`
  };
  const html = await response.text();
  const result = html.replace(/<head>[\s\S]*?<\/head>/i, head => head.replace(/<meta\b[^>]*>/gi, tag => {
    const key = tag.match(/(?:property|name)="([^"]+)"/i)?.[1];
    if (!Object.hasOwn(values, key)) return tag;
    return tag.replace(/content="[^"]*"/i, `content="${escapeAttribute(values[key])}"`);
  }));
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  // Do not allow a translated response to be reused for another language.
  headers.set("cache-control", "private, no-store");
  return new Response(result, { status: response.status, headers });
};

export const config = { path: "/" };

