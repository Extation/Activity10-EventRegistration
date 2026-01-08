import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  AppModule.setupSwagger(app);

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`Event Registration API running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api-docs`);
}

bootstrap();
