import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { MOCK_CLOSING_ASSIGNMENTS } from "@/lib/data/mock-closing";
import { CLOSING_STATUS_LABELS } from "@/lib/types/closing";
import { formatXOF } from "@/lib/format";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClosingDetailPage({ params }: PageProps) {
  const { id } = await params;
  const a = MOCK_CLOSING_ASSIGNMENTS.find((x) => x.id === id);
  if (!a) notFound();

  return (
    <div className="flex flex-col">
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b border-line bg-white px-10 py-5">
        <Link
          href="/closing"
          className="grid h-9 w-9 place-items-center rounded-lg bg-paper-2 text-ink-500 hover:text-ink-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
            Commande Closing
          </div>
          <div className="mt-1 flex items-center gap-3">
            <h1 className="font-mono-kamoo text-xl font-bold text-ink-900">
              {a.publicCode}
            </h1>
            <span className="rounded-full bg-kamoo-blue-50 px-2.5 py-1 text-[11px] font-bold text-kamoo-blue-700">
              {CLOSING_STATUS_LABELS[a.status]}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-5 px-10 py-6">
        {/* Gauche : produit + commentaire + historique */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Produit
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div
                className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
                style={{ background: a.productBg }}
              >
                {a.productEmoji}
              </div>
              <div>
                <div className="text-[15px] font-bold text-ink-900">
                  {a.productName}
                </div>
                <div className="text-[12px] text-ink-500">
                  Quantité : ×{a.quantity} · Total :{" "}
                  <b>{formatXOF(a.amountXof)}</b>
                </div>
              </div>
            </div>
          </section>

          {a.comment && (
            <section className="rounded-2xl border border-line bg-white p-5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                Commentaire de la closeuse
              </div>
              <p className="mt-2 text-[14px] italic text-ink-700">
                {a.comment}
              </p>
            </section>
          )}

          <section className="rounded-2xl border border-dashed border-line bg-white p-10 text-center">
            <div className="text-3xl">🚧</div>
            <p className="mt-2 text-sm text-ink-500">
              Historique des appels et timeline d&apos;activité — à venir
            </p>
          </section>
        </div>

        {/* Droite : client + actions */}
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-line bg-white p-5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              Client
            </div>
            <div className="mt-2 text-[15px] font-bold text-ink-900">
              {a.client.name}
            </div>
            <div className="text-[12px] text-ink-500">{a.client.city}</div>

            <div className="mt-4 flex flex-col gap-2">
              <a
                href={`tel:${a.client.phone}`}
                className="flex items-center gap-2 rounded-xl border border-line bg-paper-2 px-3 py-2.5 text-[13px] font-semibold text-ink-900 hover:bg-paper-2/70"
              >
                <Phone className="h-4 w-4" />
                <span className="font-mono-kamoo">{a.client.phone}</span>
              </a>
              {a.client.whatsapp && (
                <a
                  href={`https://wa.me/${a.client.whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-[13px] font-bold text-white hover:bg-emerald-700"
                >
                  <MessageCircle className="h-4 w-4" />
                  Ouvrir WhatsApp
                </a>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
