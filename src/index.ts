import 'source-map-support/register';
import 'reflect-metadata';
import 'dotenv/config';
import '@/utils/shenanigans/rollemParserV1';
import { initApp } from '@/app/init';
import { createLogger } from '@/utils/logger';

initApp().catch((error) => {
  createLogger('Application').error('Error during application start-up', { error });
});
