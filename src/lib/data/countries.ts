/**
 * Pays supportés par Kamoo en V1.
 * V2 : Bénin, Togo, Mali, Burkina Faso, Nigeria.
 */

export type CountryCode = "SN" | "CI" | "CM" | "GLOBAL";

export type Country = {
  code: CountryCode;
  name: string;
  flag: string;
  warehouseCity: string;
  currency: "XOF" | "XAF";
  isGlobal?: boolean;
};

export const COUNTRIES: Country[] = [
  {
    code: "SN",
    name: "Sénégal",
    flag: "🇸🇳",
    warehouseCity: "Entrepôt Dakar",
    currency: "XOF",
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    flag: "🇨🇮",
    warehouseCity: "Entrepôt Abidjan",
    currency: "XOF",
  },
  {
    code: "CM",
    name: "Cameroun",
    flag: "🇨🇲",
    warehouseCity: "Entrepôt Douala",
    currency: "XAF",
  },
];

export const GLOBAL_OPTION: Country = {
  code: "GLOBAL",
  name: "Mode Global",
  flag: "🌍",
  warehouseCity: "Tous pays consolidés",
  currency: "XOF",
  isGlobal: true,
};

export function getCountryByCode(code: CountryCode): Country {
  if (code === "GLOBAL") return GLOBAL_OPTION;
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}
