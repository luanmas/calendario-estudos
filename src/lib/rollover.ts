import { startOfDay } from "date-fns";
import { BlockStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Move todo bloco PENDENTE com data anterior a hoje para hoje.
// Concluídos e não realizados permanecem como estão.
export async function rolloverOverdueBlocks() {
  const today = startOfDay(new Date());
  await prisma.studyBlock.updateMany({
    where: { scheduledDate: { lt: today }, status: BlockStatus.PENDENTE },
    data: { scheduledDate: today },
  });
}
