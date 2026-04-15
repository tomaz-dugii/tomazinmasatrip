import authors from "../../data/authors.json";

export const aboutData = {
  intro: [
    "Na pragu zrelosti, v pisarni, za ekranom do mraka, sva se velikokrat spraševala, kaj se skriva tako daleč za obzorjem. Želja po odkrivanju naju je gnala, da onstran domačih meja ozreva širni svet. Tako sva spakirala nahrbtnika, se poslovila od bližnjih, ter se z jutrom podala dogodivščinam naproti.",
    "Sva Maša in Tomaž, popotnika po obalah Tihega oceana.",
    "Dobrodošli v najinem kotičku tega širnega interneta, kjer opisujeva svoja doživetja. Malo to počneva zase, malo za bližnje doma in malo za vsakega radovedneža, ki se slučajno znajde tukaj.",
  ],
  quote: "Končna destinacija je neznana. Dobrodošli na poti.",
  authors: authors as {
    id: string;
    name: string;
    image: string;
    bio: string;
    social: { type: string; url: string; label: string }[];
  }[],
};

export { authors };
