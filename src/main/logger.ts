import * as electronLog from 'electron-log';

interface CreateLoggerParams {
    logId: string;
    level?: electronLog.LevelOption;
    writeToConsole?: boolean;
    writeToFile?: boolean;
}

interface CreateLoggerOptions {
    logId: string;
    filename: string;
    level: electronLog.LevelOption;
    writeToConsole: boolean;
    writeToFile: boolean;
}

const DEFAULT_CREATE_LOGGER_OPTIONS: CreateLoggerOptions = {
    logId: '',
    filename: '',
    level: 'debug',
    writeToConsole: true,
    writeToFile: true
}

class Logger {
    private static loggers: Map<string, electronLog.MainLogger> = new Map();

    static init(): electronLog.MainLogger {
        const mainLog = this.initializeMainLogger();
        this.initializeRendererLogger();

        return mainLog;
    }

    static get(logId: string): electronLog.MainLogger | undefined {
        return this.loggers.get(logId);
    }

    static add(params: CreateLoggerParams): electronLog.MainLogger {
        const logger = Logger.createLogger(params);
        logger.log('-------------- New Session --------------');

        Logger.loggers.set(params.logId, logger);

        return logger;
    }

    private static createLogger(params: CreateLoggerParams): electronLog.MainLogger {
        const options: CreateLoggerOptions = { ...DEFAULT_CREATE_LOGGER_OPTIONS, ...params }
        options.filename = params.logId + '.log'

        const logger = electronLog.create({ logId: options.logId });

        logger.transports.file.fileName = options.filename;
        logger.transports.file.level = options.level;

        if (!options.writeToConsole)
            logger.transports.console.level = false;

        return logger;
    }

    private static initializeMainLogger(): electronLog.MainLogger {
        electronLog.transports.file.fileName = 'Main.log';
        electronLog.transports.file.level = 'debug';
        
        electronLog.errorHandler.startCatching();

        electronLog.log('-------------- New Session --------------');
    
        return electronLog;
    }

    private static initializeRendererLogger(): electronLog.MainLogger {
        const rendererLogger = this.add({ logId: 'Renderer', writeToConsole: false });
        rendererLogger.initialize({ spyRendererConsole: true });

        return rendererLogger;
    }
}

export default Logger;