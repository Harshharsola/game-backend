import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: `*`, // Allow your front-end domain
    methods: 'GET, POST, PUT, DELETE, OPTIONS', // Allowed methods
    allowedHeaders: 'Content-Type', // Allowed headers
  });
  await app.listen(3000);
}
bootstrap();
