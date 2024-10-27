import { Logger, LevelOption, create } from 'electron-log';

function createLogger(filename: string, level: LevelOption = 'debug'): Logger {
    const logger = create({ logId: filename });

    logger.transports.file.fileName = filename;
    logger.transports.file.level = level;

    logger.errorHandler.startCatching();

    return logger;
}

export default createLogger;