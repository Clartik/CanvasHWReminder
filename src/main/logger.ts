import { MainLogger, LevelOption, create } from 'electron-log';

function createLogger(filename: string, level: LevelOption = 'debug'): MainLogger {
    const logger = create({ logId: filename });

    logger.transports.file.fileName = filename;
    logger.transports.file.level = level;

    logger.errorHandler.startCatching();

    return logger;
}

function initializeRendererLogger() {
    const rendererLogger = createLogger('Renderer.log');
    rendererLogger.initialize({ spyRendererConsole: true });
}

export { createLogger, initializeRendererLogger };