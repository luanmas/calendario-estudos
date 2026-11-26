"use server";

import { revalidatePath } from "next/cache";
import { addDays, startOfDay } from "date-fns";
import { prisma } from "@/lib/prisma";
import { BlockStatus, BlockType, SubjectCategory } from "@prisma/client";

function refresh() {
  revalidatePath("/");
}
function dateFrom(value: FormDataEntryValue | null) {
  if (!value || typeof value !== "string")
    throw new Error("Informe uma data válida.");
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) throw new Error("Data inválida.");
  return startOfDay(parsed);
}

export async function createSubject(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const category = String(formData.get("category") ?? "BASICA");
  const color = String(formData.get("color") ?? "#64748b");
  if (!name) throw new Error("O nome da matéria é obrigatório.");
  if (!Object.values(SubjectCategory).includes(category as SubjectCategory))
    throw new Error("Categoria inválida.");
  await prisma.subject.create({
    data: { name, category: category as SubjectCategory, color },
  });
  refresh();
}

export async function deleteSubject(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  await prisma.subject.delete({ where: { id } });
  refresh();
}

export async function createBlock(formData: FormData) {
  const subjectId = String(formData.get("subjectId") ?? "");
  const topic = String(formData.get("topic") ?? "").trim();
  const scheduledDate = dateFrom(formData.get("scheduledDate"));
  const type = String(formData.get("type") ?? "NOVO_CONTEUDO");
  if (!subjectId || !topic)
    throw new Error("Matéria e assunto são obrigatórios.");
  if (!Object.values(BlockType).includes(type as BlockType))
    throw new Error("Tipo inválido.");
  await prisma.studyBlock.create({
    data: { subjectId, topic, scheduledDate, type: type as BlockType },
  });
  refresh();
}

export async function updateBlockStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!Object.values(BlockStatus).includes(status as BlockStatus))
    throw new Error("Status inválido.");
  const block = await prisma.studyBlock.findUnique({
    where: { id },
    include: { reviewBlocks: true },
  });
  if (!block) throw new Error("Bloco não encontrado.");

  const completed = status === "CONCLUIDO";
  const completedAt = completed ? new Date() : null;
  await prisma.$transaction(async (tx) => {
    await tx.studyBlock.update({
      where: { id },
      data: { status: status as BlockStatus, completed, completedAt },
    });

    // Generate the D+1, D+7 and D+30 blocks only once, on completion of new content.
    if (
      completed &&
      block.type === "NOVO_CONTEUDO" &&
      block.reviewBlocks.length === 0
    ) {
      const dates = [1, 7, 30].map((n) => startOfDay(addDays(completedAt!, n)));
      await tx.studyBlock.createMany({
        data: dates.map((scheduledDate, index) => ({
          subjectId: block.subjectId,
          topic: block.topic,
          scheduledDate,
          type: (
            [
              BlockType.REVISAO_1D,
              BlockType.REVISAO_7D,
              BlockType.REVISAO_30D,
            ] as const
          )[index],
          parentBlockId: block.id,
        })),
      });
    }
  });
  refresh();
}

export async function rolloverOverdue() {
  const today = startOfDay(new Date());
  // Move every open block dated before today to today; completed and missed blocks remain unchanged.
  await prisma.studyBlock.updateMany({
    where: { scheduledDate: { lt: today }, status: BlockStatus.PENDENTE },
    data: { scheduledDate: today },
  });
  refresh();
}

export async function deleteBlock(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Bloco inválido.");
  // Apaga o bloco e, se for um novo conteúdo, as revisões D+1/D+7/D+30 geradas a partir dele.
  // Só as revisões têm parentBlockId, então excluir uma revisão avulsa apaga só ela.
  await prisma.studyBlock.deleteMany({
    where: { OR: [{ id }, { parentBlockId: id }] },
  });
  refresh();
}
