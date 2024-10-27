import * as electronLog from 'electron-log';

function initializeMainLogger(): electronLog.MainLogger {
    electronLog.transports.file.fileName = 'Main.log';
    electronLog.transports.file.level = 'debug';

    electronLog.errorHandler.startCatching();

    return electronLog;
}

function initializeRendererLogger() {
    const rendererLogger = createLogger({ filename: 'Renderer.log' });
    rendererLogger.initialize({ spyRendererConsole: true });
}

interface CreateLoggerParams {
    filename: string;
    level?: electronLog.LevelOption;
    writeToConsole?: boolean;
    writeToFile?: boolean;
}

interface CreateLoggerOptions {
    filename: string;
    level: electronLog.LevelOption;
    writeToConsole: boolean;
    writeToFile: boolean;
}

const DEFAULT_CREATE_LOGGER_OPTIONS: CreateLoggerOptions = {
    filename: '',
    level: 'debug',
    writeToConsole: true,
    writeToFile: true
}

function createLogger(params: CreateLoggerParams): electronLog.MainLogger {
    const options: CreateLoggerOptions = { ...DEFAULT_CREATE_LOGGER_OPTIONS, ...params }

    const logId: string = options.filename.split('.log')[0];

    const logger = electronLog.create({ logId: logId });

    logger.transports.file.fileName = options.filename;
    logger.transports.file.level = options.level;

    if (!options.writeToConsole)
        logger.transports.console.level = false;

    return logger;
}

export { createLogger, initializeMainLogger, initializeRendererLogger };