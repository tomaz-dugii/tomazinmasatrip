import taxonomy from "../../taxonomy.json";

const FALLBACK_IMAGE = "/images/blog/blob1.svg";

/** Hero/card image per destination name (aligned with taxonomy order). */
const DESTINATION_IMAGES: Record<string, string> = {
  Japonska: "/images/blog/tokio_ali_seoul/japonska_header.webp",
  "Južna Koreja": "/images/blog/ogled_taipeia/taipei_11.webp",
  Taiwan: "/images/blog/ogled_taipeia/taipei_11.webp",
  Avstralija: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Italija: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Hrvaška: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Nemčija: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  "Velika Britanija": "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Avstrija: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Jordanija: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Malta: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Singapur: "/images/blog/nazaj_v_prihodnost/japan_header.webp",
  Tajska: "/images/blog/rdeca-dzungla/lanterne_3.webp",
};

/** Home carousel: same destination order as taxonomy / blog filters. */
export const destinations = taxonomy.destinations.map((name) => ({
  name,
  image: DESTINATION_IMAGES[name] ?? FALLBACK_IMAGE,
}));
