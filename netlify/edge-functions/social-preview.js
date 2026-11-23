// Complete localized HTML is identical for visitors and crawlers.
import pages from './generated/pages.js';

export default async (request, context) => {
  if (!['GET', 'HEAD'].includes(request.method)) return context.next();
  const url = new URL(request.url);
  if (url.hostname === 'www.qse-lab.com') {
    url.hostname = 'qse-lab.com'; url.protocol = 'https:';
    return Response.redirect(url, 301);
  }
  const route = url.pathname === '/index.html' ? '/' : url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  if (!Object.hasOwn(pages, route)) return context.next();
  if (url.pathname !== route) { url.pathname = route; return Response.redirect(url, 301); }
  const requested = url.searchParams.get('lang');
  const language = ['ru', 'et', 'en'].includes(requested) ? requested : 'ru';
  if (requested === 'ru' || (requested !== null && !['et', 'en'].includes(requested))) {
    url.searchParams.delete('lang'); return Response.redirect(url, 301);
  }
  return new Response(request.method === 'HEAD' ? null : pages[route][language], {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Content-Language': language, 'Cache-Control': 'public, max-age=0, must-revalidate', 'X-Content-Type-Options': 'nosniff' }
  });
};

export const config = { path: ['/', '/index.html', '/beauty', '/beauty/', '/beauty.html', '/clinic-demo', '/clinic-demo/', '/clinic-demo.html', '/consultant-demo', '/consultant-demo/', '/consultant-demo.html', '/terms', '/terms/', '/terms.html', '/warranty', '/warranty/', '/warranty.html', '/services', '/services.html', '/services/*', '/portfolio', '/portfolio/', '/portfolio.html', '/contact', '/contact/', '/contact.html'] };
