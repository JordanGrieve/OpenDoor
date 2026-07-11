// Structured-data (JSON-LD) builders for local SEO + generative engines.
import type { Product } from "@/lib/types";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://opendoorbakery.com";

export const BUSINESS = {
  name: "Open Door Bakery",
  url: SITE,
  email: "hello@opendoorbakery.com",
  street: "18 Avonbank",
  locality: "Hamilton",
  region: "South Lanarkshire",
  postcode: "ML3 7PD",
  country: "GB",
  lat: 55.76005,
  lon: -4.038857,
  areaServed: [
    "Hamilton", "Motherwell", "Wishaw", "Bellshill", "Bothwell", "Blantyre",
    "Larkhall", "Coatbridge", "Airdrie", "East Kilbride", "Rutherglen", "Uddingston",
  ],
};

/** LocalBusiness (Bakery) schema — sitewide. */
export function bakeryJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Bakery",
    "@id": `${SITE}/#bakery`,
    name: BUSINESS.name,
    url: SITE,
    email: BUSINESS.email,
    priceRange: "££",
    servesCuisine: ["Bakery", "Patisserie", "Cakes"],
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.street,
      addressLocality: BUSINESS.locality,
      addressRegion: BUSINESS.region,
      postalCode: BUSINESS.postcode,
      addressCountry: BUSINESS.country,
    },
    geo: { "@type": "GeoCoordinates", latitude: BUSINESS.lat, longitude: BUSINESS.lon },
    areaServed: BUSINESS.areaServed.map((name) => ({ "@type": "City", name })),
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"], opens: "08:00", closes: "14:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday", "Sunday"], opens: "08:00", closes: "13:00" },
    ],
  };
}

/** Product schema for a product detail page. */
export function productJsonLd(product: Product) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.metaDescription || product.description,
    ...(product.images[0]?.url ? { image: product.images[0].url } : {}),
    category: product.category,
    brand: { "@type": "Brand", name: BUSINESS.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "GBP",
      price: product.price.toFixed(2),
      availability: "https://schema.org/InStock",
      url: `${SITE}/products/${product.slug}`,
      seller: { "@type": "Organization", name: BUSINESS.name },
    },
  };
}
