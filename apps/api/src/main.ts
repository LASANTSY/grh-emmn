import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.use(json({ limit: '25mb' }));
  app.use(urlencoded({ extended: true, limit: '25mb' }));

  app.enableCors({
    origin: (config.get<string>('WEB_ORIGIN') ?? 'http://localhost:5173').split(',').map((o) => o.trim()),
    credentials: true,
  });
  app.useGlobalFilters(new AllExceptionsFilter());

  const swagger = new DocumentBuilder()
    .setTitle('GRH EMMN — API')
    .setDescription('Gestion des Ressources Humaines — État-Major de la Marine Nationale de Madagascar')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swagger);
  SwaggerModule.setup('api/docs', app, document);

  const port = Number(config.get<string>('PORT') ?? 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API GRH EMMN démarrée sur http://localhost:${port}/api — docs : /api/docs`);
}

void bootstrap();