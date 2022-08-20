import { createLogger } from '@/utils/logger';
import { container } from 'tsyringe';
import { Application } from '@/app';

export async function initApp() {
  const logger = createLogger('Application');
  logger.info('Starting application...');
  const app = await container.resolve(Application);
  await app.init();
  logger.info('Application started');
}
