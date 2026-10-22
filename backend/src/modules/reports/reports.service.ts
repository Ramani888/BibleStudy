import { prisma } from '../../config/db';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { sendUserReportEmail } from '../../utils/email';
import type { CreateReportDtoType } from './reports.dto';

const person = { select: { id: true, name: true, email: true } } as const;

/** Store the report, then email support. The email is best-effort: the stored row is the record. */
export async function createReport(reporterId: string, dto: CreateReportDtoType) {
  if (reporterId === dto.reportedId) throw new ValidationError('You cannot report yourself');
  const target = await prisma.user.findUnique({ where: { id: dto.reportedId }, select: { id: true } });
  if (!target) throw new NotFoundError('User not found');

  const report = await prisma.report.create({
    data: { reporterId, reportedId: dto.reportedId, reason: dto.reason, note: dto.note || null },
    include: { reporter: person, reported: person },
  });

  sendUserReportEmail(report).catch(err =>
    console.error(`[REPORT-EMAIL] reportId=${report.id} sendFailed — still stored in DB`, err),
  );
  return { id: report.id };
}
