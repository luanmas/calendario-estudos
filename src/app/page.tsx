import { addDays, format, startOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { createSubject, createBlock, updateBlockStatus, deleteSubject, deleteBlock } from "./actions";
import { rolloverOverdueBlocks } from "@/lib/rollover";
import { CalendarView } from "@/components/calendar-view";

export const dynamic = "force-dynamic";

export default async function Home() {
  await rolloverOverdueBlocks();
  const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
  const today = startOfDay(new Date());
  const from = subDays(today, 3);
  const to = addDays(today, 10);
  const blocks = await prisma.studyBlock.findMany({
    where: { scheduledDate: { gte: from, lte: to } },
    include: { subject: true },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[.2em] text-indigo-600">Seu foco, todos os dias</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Plano de estudos</h1>
          <p className="mt-2 text-slate-500">Estude, acompanhe pendências e revise em 1, 7 e 30 dias.</p>
        </div>
        <div className="rounded-2xl border bg-white px-5 py-3 shadow-sm">
          <div className="text-xs uppercase tracking-wide text-slate-500">Hoje</div>
          <div className="font-semibold">{format(today, "dd 'de' MMMM", { locale: ptBR })}</div>
        </div>
      </header>

      <section className="mb-6 grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Nova matéria</h2>
          <form action={createSubject} className="space-y-3">
            <input name="name" required placeholder="Ex.: Direito Administrativo" className="w-full rounded-lg border px-3 py-2 outline-indigo-500" />
            <select name="category" className="w-full rounded-lg border px-3 py-2">
              <option value="BASICA">Básica</option><option value="ESPECIFICA">Específica</option>
            </select>
            <div className="flex items-center gap-3"><label className="text-sm text-slate-600">Cor no calendário</label><input name="color" type="color" defaultValue="#6366f1" className="h-9 w-12" /></div>
            <button className="w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700">Adicionar matéria</button>
          </form>
          <div className="mt-6 border-t pt-4">
            <h3 className="mb-3 text-sm font-semibold text-slate-600">Matérias cadastradas ({subjects.length})</h3>
            <div className="space-y-2">
              {subjects.map((subject) => <div key={subject.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: subject.color }} />{subject.name}</span>
                <form action={deleteSubject}><input type="hidden" name="id" value={subject.id} /><button title="Excluir matéria e blocos" className="text-slate-400 hover:text-red-600">×</button></form>
              </div>)}
              {!subjects.length && <p className="text-sm text-slate-400">Cadastre sua primeira matéria.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold">Adicionar bloco de estudo</h2>
          {subjects.length ? <form action={createBlock} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <select required name="subjectId" className="rounded-lg border px-3 py-2 sm:col-span-2"><option value="">Selecione a matéria</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name} · {s.category === "BASICA" ? "Básica" : "Específica"}</option>)}</select>
            <input required name="topic" placeholder="Assunto do bloco" className="rounded-lg border px-3 py-2 sm:col-span-2" />
            <input required name="scheduledDate" type="date" defaultValue={format(today, "yyyy-MM-dd")} className="rounded-lg border px-3 py-2" />
            <select name="type" className="rounded-lg border px-3 py-2"><option value="NOVO_CONTEUDO">Novo conteúdo</option><option value="REVISAO_1D">Revisão D+1</option><option value="REVISAO_7D">Revisão D+7</option><option value="REVISAO_30D">Revisão D+30</option></select>
            <button className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700 sm:col-span-2">Criar bloco</button>
          </form> : <p className="text-sm text-slate-500">Cadastre uma matéria antes de criar blocos.</p>}
        </div>
      </section>

      <CalendarView  blocks={blocks.map((b) => ({
        id: b.id, topic: b.topic, scheduledDate: b.scheduledDate.toISOString(),
        type: b.type, status: b.status, subjectName: b.subject.name, subjectColor: b.subject.color,
      }))} updateStatus={updateBlockStatus} deleteBlock={deleteBlock} />
    </main>
  );
}
