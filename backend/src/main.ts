import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe – validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // strip unknown properties
      forbidNonWhitelisted: true, // throw if unknown properties are sent
      transform: true,           // auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Serve static frontend application
  const express = require('express');
  const path = require('path');
  const frontendPath = path.join(__dirname, '..', '..', 'frontend');
  app.use(express.static(frontendPath));

  // Swagger / OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('Fleet Intelligence 360 – Tyre Module API')
    .setDescription(
      'REST API for the FI360 Tyre Management module. ' +
      'Provides endpoints for tyre registration, fitment, removal, inspection, ' +
      'tread monitoring, lifecycle tracking, and dashboard summaries.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Tyres', 'Tyre CRUD, fitment, inspection, and lifecycle operations')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 FI360 Tyre API running on http://localhost:${port}`);
  console.log(`📖 Swagger docs available at http://localhost:${port}/api/docs`);
}
bootstrap();
