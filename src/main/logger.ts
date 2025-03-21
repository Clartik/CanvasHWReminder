import * as electronLog from 'electron-log';

interface CreateLoggerParams {
    logId: string;
    fileLevel?: electronLog.LevelOption;
    writeToConsole?: boolean;
    writeToFile?: boolean;
}

interface CreateLoggerOptions {
    logId: string;
    filename: string;
    consoleLevel: electronLog.LevelOption,
    fileLevel: electronLog.LevelOption;
    writeToConsole: boolean;
    writeToFile: boolean;
}

const DEFAULT_CREATE_LOGGER_OPTIONS: CreateLoggerOptions = {
    logId: '',
    filename: '',
    consoleLevel: 'info',
    fileLevel: 'debug',
    writeToConsole: true,
    writeToFile: true
}

const DEFAULT_CONSOLE_FORMAT = '[{label}] > {text}';

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

    static getAll(): electronLog.MainLogger[] {
        return Array.from(this.loggers.values());
    }

    static add(params: CreateLoggerParams): electronLog.MainLogger {
        const logger = Logger.createLogger(params);
        Logger.loggers.set(params.logId, logger);

        return logger;
    }

    private static createLogger(params: CreateLoggerParams): electronLog.MainLogger {
        const options: CreateLoggerOptions = { ...DEFAULT_CREATE_LOGGER_OPTIONS, ...params }
        options.filename = params.logId + '.log'

        const logger = electronLog.create({ logId: options.logId });

        logger.variables.label = params.logId;

        logger.transports.console.format = DEFAULT_CONSOLE_FORMAT;
        logger.transports.console.level = options.consoleLevel;
        
        logger.transports.file.fileName = options.filename;
        logger.transports.file.level = options.fileLevel;

        if (!options.writeToConsole)
            logger.transports.console.level = false;

        return logger;
    }

    private static initializeMainLogger(): electronLog.MainLogger {
        const logId = 'Main';

        electronLog.variables.label = logId;

        electronLog.transports.console.format = DEFAULT_CONSOLE_FORMAT;
        electronLog.transports.console.level = 'info';

        electronLog.transports.file.fileName = logId + '.log';
        electronLog.transports.file.level = 'debug';
        
        electronLog.errorHandler.startCatching();
        this.loggers.set(logId, electronLog);
    
        return electronLog;
    }

    private static initializeRendererLogger(): electronLog.MainLogger {
        const rendererLogger = this.add({ logId: 'Renderer', writeToConsole: false });
        rendererLogger.initialize({ spyRendererConsole: true });

        return rendererLogger;
    }
}

export default Logger;