"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = require("express");
const app_module_1 = require("../src/app.module");
const server = (0, express_1.default)();
let isReady = false;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(server));
    app.enableCors({
        origin: process.env.FRONTEND_URL || '*',
        credentials: true,
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Fund Manager API')
        .setDescription('Group savings fund management')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('docs', app, document);
    await app.init();
    isReady = true;
}
bootstrap();
exports.default = async (req, res) => {
    if (!isReady) {
        await bootstrap();
    }
    server(req, res);
};
//# sourceMappingURL=index.js.map