/**
 * Affiche les moyens de paiement supportés sous forme de petits badges colorés.
 * Couvre les Mobile Money d'Afrique de l'Ouest + cartes bancaires internationales.
 */

type PaymentMethod = {
  id: string;
  label: string;
  bg: string; // couleur de fond
  fg: string; // couleur du texte
};

const METHODS: PaymentMethod[] = [
  // Mobile Money
  { id: "wave", label: "Wave", bg: "bg-[#1DCEFF]", fg: "text-white" },
  {
    id: "orange",
    label: "Orange Money",
    bg: "bg-[#FF6600]",
    fg: "text-white",
  },
  { id: "moov", label: "Moov Money", bg: "bg-[#E0001B]", fg: "text-white" },
  { id: "mtn", label: "MTN MoMo", bg: "bg-[#FFCC00]", fg: "text-black" },
  { id: "free", label: "Free Money", bg: "bg-white", fg: "text-[#CD113B]" },
  { id: "celtiis", label: "Celtiis Cash", bg: "bg-[#00A99D]", fg: "text-white" },
  // Cartes bancaires
  { id: "visa", label: "Visa", bg: "bg-[#1A1F71]", fg: "text-white" },
  {
    id: "mastercard",
    label: "Mastercard",
    bg: "bg-white",
    fg: "text-ink-900",
  },
];

type Props = {
  /** Filtre par ID si tu veux n'afficher qu'une partie des moyens */
  only?: string[];
  /** Style sombre (utile sur fond foncé comme la card devis) */
  variant?: "light" | "dark";
};

export function PaymentMethods({ only, variant = "light" }: Props) {
  const list = only ? METHODS.filter((m) => only.includes(m.id)) : METHODS;
  const isDark = variant === "dark";

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {list.map((m) => (
        <span
          key={m.id}
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset ${
            m.bg
          } ${m.fg} ${
            isDark ? "ring-white/15" : "ring-black/5"
          }`}
        >
          {m.label}
        </span>
      ))}
    </div>
  );
}
