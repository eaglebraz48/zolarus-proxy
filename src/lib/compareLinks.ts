// Tiny builder for external comparison links (no scraping, no APIs)
export function buildCompareLinks(q: string) {
  const query = encodeURIComponent((q || '').trim());
  return {
    googleShopping: `https://www.google.com/search?tbm=shop&q=${query}`,
    bingShopping:   `https://www.bing.com/shop?q=${query}`,
    priceGrabber:   `https://www.pricegrabber.com/search.php?form_keyword=${query}`,
  };
}
