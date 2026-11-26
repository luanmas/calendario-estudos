"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { addDays, format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check, Clock3, CircleX, Trash2 } from "lucide-react";
import { deleteBlock } from "@/app/actions";

type Block = {
  id: string; topic: string; scheduledDate: string; type: string; status: string;
  subjectName: string; subjectColor: string;
};
const typeLabels: Record<string, string> = {
  NOVO_CONTEUDO: "Novo conteúdo", REVISAO_1D: "Revisão D+1", REVISAO_7D: "Revisão D+7", REVISAO_30D: "Revisão D+30",
};
const statusLabels: Record<string, string> = { PENDENTE: "Pendente", CONCLUIDO: "Concluído", NAO_REALIZADO: "Não realizado" };

export function CalendarView({ blocks, updateStatus, deleteBlock }: {
  blocks: Block[];
  updateStatus: (formData: FormData) => Promise<void>;
  deleteBlock: (formData: FormData) => Promise<void>;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => {
    const start = addDays(startOfDay(new Date()), weekOffset * 7 - 3);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekOffset]);
  const grouped = useMemo(() => {
    const map = new Map<string, Block[]>();
    blocks.forEach((block) => {
      const key = format(new Date(block.scheduledDate), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), block]);
    });
    return map;
  }, [blocks]);
  const [toDelete, setToDelete] = useState<Block | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!toDelete) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !pending) setToDelete(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toDelete, pending]);

  function confirmDelete() {
    if (!toDelete) return;
    const fd = new FormData();
    fd.set("id", toDelete.id);
    startTransition(async () => {
      await deleteBlock(fd);
      setToDelete(null);
    });
  }

  return <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold">Calendário de estudos</h2><p className="text-sm text-slate-500">Pendências vencidas são trazidas para hoje automaticamente.</p></div>
      <div className="flex items-center gap-2"><button onClick={() => setWeekOffset((v) => v - 1)} className="rounded-lg border p-2 hover:bg-slate-50" aria-label="Semana anterior"><ChevronLeft size={18}/></button><button onClick={() => setWeekOffset(0)} className="rounded-lg border px-3 py-2 text-sm hover:bg-slate-50">Hoje</button><button onClick={() => setWeekOffset((v) => v + 1)} className="rounded-lg border p-2 hover:bg-slate-50" aria-label="Próxima semana"><ChevronRight size={18}/></button></div>
    </div>
    <div className="grid gap-3 md:grid-cols-7">
      {days.map((date) => {
        const key = format(date, "yyyy-MM-dd");
        const dayBlocks = grouped.get(key) ?? [];
        const isToday = key === format(new Date(), "yyyy-MM-dd");
        return <div key={key} className={`min-h-52 rounded-xl border p-2 ${isToday ? "border-indigo-300 bg-indigo-50/50" : "border-slate-200 bg-slate-50/50"}`}>
          <div className="mb-3 px-1"><div className="text-xs uppercase text-slate-500">{format(date, "EEE", { locale: ptBR })}</div><div className={`text-lg font-bold ${isToday ? "text-indigo-700" : ""}`}>{format(date, "dd/MM")}</div></div>
          <div className="space-y-2">
            {dayBlocks.map((block) => <article key={block.id} className="rounded-lg border bg-white p-2 shadow-sm" style={{ borderLeft: `3px solid ${block.subjectColor}` }}>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{block.subjectName}</div>
              <div className="text-xs font-semibold leading-snug">{block.topic}</div>
              <div className="mt-1 text-[10px] text-indigo-600">{typeLabels[block.type] ?? block.type}</div>
              <div className="mt-2 flex items-center justify-between gap-1">
                <span className={`text-[10px] ${block.status === "CONCLUIDO" ? "text-emerald-600" : block.status === "NAO_REALIZADO" ? "text-red-500" : "text-amber-600"}`}>{statusLabels[block.status] ?? block.status}</span>
                <div className="flex gap-1">
                  {block.status !== "CONCLUIDO" && <form action={updateStatus}><input type="hidden" name="id" value={block.id}/><input type="hidden" name="status" value="CONCLUIDO"/><button title="Concluir" className="rounded bg-emerald-50 p-1 text-emerald-700 hover:bg-emerald-100"><Check size={13}/></button></form>}
                  {block.status !== "PENDENTE" && <form action={updateStatus}><input type="hidden" name="id" value={block.id}/><input type="hidden" name="status" value="PENDENTE"/><button title="Marcar pendente" className="rounded bg-amber-50 p-1 text-amber-700 hover:bg-amber-100"><Clock3 size={13}/></button></form>}
                  {block.status !== "NAO_REALIZADO" && <form action={updateStatus}><input type="hidden" name="id" value={block.id}/><input type="hidden" name="status" value="NAO_REALIZADO"/><button title="Não realizado" className="rounded bg-red-50 p-1 text-red-600 hover:bg-red-100"><CircleX size={13}/></button></form>}
                </div>
                <button type="button" title="Excluir bloco" onClick={() => setToDelete(block)}
                  className="rounded bg-slate-100 p-1 text-slate-500 hover:bg-red-100 hover:text-red-600">
                  <Trash2 size={13}/>
                </button>
              </div>
            </article>)}
            {!dayBlocks.length && <div className="py-5 text-center text-xs text-slate-300">Sem blocos</div>}
          </div>
        </div>;
      })}
    </div>

    {toDelete && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          onClick={() => !pending && setToDelete(null)}>
        <div role="dialog" aria-modal="true" aria-labelledby="delete-title"
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}>
          <h3 id="delete-title" className="text-lg font-bold">Excluir bloco?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Você vai excluir <strong>{toDelete.topic}</strong> ({toDelete.subjectName} ·{" "}
            {typeLabels[toDelete.type] ?? toDelete.type}).
            {toDelete.type === "NOVO_CONTEUDO" && " As revisões D+1, D+7 e D+30 deste conteúdo também serão excluídas."}
            {" "}Essa ação não pode ser desfeita.
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" disabled={pending} onClick={() => setToDelete(null)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50 disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" disabled={pending} onClick={confirmDelete}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">
              {pending ? "Excluindo..." : "Excluir"}
            </button>
          </div>
        </div>
      </div>
    )}
  </section>;
}
