import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { AppModule } from '../src/app.module';

const server = express();
let isReady = false;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
  app.enableCors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Fund Manager API')
    .setDescription('Group savings fund management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.init();
  isReady = true;
}

bootstrap();

export default async (req: any, res: any) => {
  if (!isReady) {
    await bootstrap();
  }
  server(req, res);
};
