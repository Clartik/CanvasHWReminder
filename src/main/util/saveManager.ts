import * as semver from 'semver';

import FileManager from './fileManager';
import Logger from '../logger';
import * as DefaultData from './defaultData';

import SaveData from 'src/interfaces/saveData';
import { APP_INFO_SAVE_DATA_VERSION, FILENAME_APP_INFO_SAVE_DATA_JSON, FILENAME_SETTINGS_DATA_JSON, SETTINGS_DATA_VERSION } from '../../constants';

const logger = Logger.add({logId: 'SaveManager' });

const DEFAULT_SAVE_VERSION = '0.0';

export default class SaveManager {
    static savePath: string = '';

    //////////////////////////////////////// PUBLIC ////////////////////////////////////////

    static init(saveDataPath: string) {
        this.savePath = saveDataPath;
    }

    static getSavePath(filename: string): string {
        return `${this.savePath}\\${filename}`;
    }

    static getSaveVersion(filename: string): string {
        switch (filename) {
            case FILENAME_SETTINGS_DATA_JSON:
                return SETTINGS_DATA_VERSION;

            case FILENAME_APP_INFO_SAVE_DATA_JSON:
                return APP_INFO_SAVE_DATA_VERSION;
        
            default:
                return DEFAULT_SAVE_VERSION;
        }
    }

    static async load(filename: string, can_upgrade: boolean = true): Promise<SaveData | null> {
        const filepath: string = SaveManager.getSavePath(filename);
        const data = await FileManager.loadData(filepath) as SaveData | null;

        if (data === null)
            return data;

        const saveVersion: string = SaveManager.getSaveVersion(filename);

        if (!semver.eq(saveVersion, data.version) && semver.gt(saveVersion, data.version) && can_upgrade) {
            logger.warn(`Data (${filename}) Needs to Be Upgraded! (${data.version} -> ${saveVersion})`);
            return await SaveManager.upgradeData(filename, data);
        }

        logger.info(`Retrieved Data (${filename})`)
        return data;
    }

    static async save(filename: string, data: SaveData): Promise<void> {
        const filepath: string = SaveManager.getSavePath(filename);
        await FileManager.writeData(filepath, data);

        logger.info(`Saved Data (${filename})`);
    }

    //////////////////////////////////////// PRIVATE ////////////////////////////////////////

    private static async upgradeData(filename: string, savedData: SaveData): Promise<SaveData> {
        const defaultData: SaveData = SaveManager.getDefaultData(filename);

        const upgradedData: SaveData = { ...defaultData, ...savedData };
        upgradedData.version = SaveManager.getSaveVersion(filename);

        logger.info(`Upgraded Data (${filename}) to Latest Version! (${upgradedData.version})`);

        await SaveManager.save(filename, upgradedData);

        return upgradedData;
    }

    private static getDefaultData(filename: string): SaveData {
        switch (filename) {
            case FILENAME_SETTINGS_DATA_JSON:
                return DefaultData.getDefaultSettingsData(SETTINGS_DATA_VERSION);

            case FILENAME_APP_INFO_SAVE_DATA_JSON:
                return DefaultData.getDefaultAppInfoSaveData(APP_INFO_SAVE_DATA_VERSION);
        
            default:
                return { version: DEFAULT_SAVE_VERSION };
        }
    }
}