import { FastifyInstance } from 'fastify';
import exportController from '../controllers/export.controller';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../utils/error-handler';

export default async function exportRoutes(fastify: FastifyInstance) {
  // Export grades to Excel
  fastify.post(
    '/grades/excel',
    {
      preHandler: [authenticate],
      handler: asyncHandler(exportController.exportGradesToExcel.bind(exportController), 'Export grades to Excel'),
    }
  );

  // Export grades to PDF
  fastify.post(
    '/grades/pdf',
    {
      preHandler: [authenticate],
      handler: asyncHandler(exportController.exportGradesToPdf.bind(exportController), 'Export grades to PDF'),
    }
  );

  // Export student report card
  fastify.get(
    '/report-card/:id',
    {
      preHandler: [authenticate],
      handler: asyncHandler(exportController.exportReportCard.bind(exportController), 'Export report card'),
    }
  );
}

