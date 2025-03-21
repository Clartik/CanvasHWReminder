import * as fs from 'fs'
import { promisify } from 'util'

import * as mainLog from 'electron-log';

import * as DefaultData from './defaultData';
import { FILENAME_APP_INFO_SAVE_DATA_JSON, FILENAME_SETTINGS_DATA_JSON, FILENAME_WHATS_NEW_JSON } from '../../constants';
import SaveData from 'src/interfaces/saveData';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

export default class SaveManager {
    static savePath: string = '';
    static dataVersion: string = '0.0.0';

    //////////////////////////////////////// PUBLIC ////////////////////////////////////////

    static init(saveDataPath: string, dataVersion: string) {
        this.savePath = saveDataPath;
        this.dataVersion = dataVersion;
    }

    static getSavePath(filename: string): string {
        return `${this.savePath}\\${filename}`;
    }

    static async getData(filename: string): Promise<SaveData | null> {
        const filepath: string = SaveManager.getSavePath(filename);
        const data: SaveData | null = await SaveManager.#loadData(filepath);

        if (data === null)
            return data;

        if (data.version < SaveManager.dataVersion) {
            mainLog.warn(`[SaveManager]: Data (${filename}) Needs to Be Upgraded! (${data.version} -> ${this.dataVersion})`);
            return await SaveManager.#upgradeData(filename, data);
        }

        mainLog.debug(`[SaveManager]: Retrieved Data ${filename}`)
        return data;
    }

    static async saveData(filename: string, data: SaveData): Promise<void> {
        const filepath: string = SaveManager.getSavePath(filename);
        await SaveManager.#writeData(filepath, data);

        mainLog.debug(`[SaveManager]: Saved Data (${filename})`);
    }

    //////////////////////////////////////// PRIVATE ////////////////////////////////////////

    static async #loadData(filepath: string): Promise<SaveData | null> {        
        try {
            const data = await readFileAsync(filepath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            mainLog.error(`[SaveManager]: Failed to Load Data from (${filepath}) - ${error}`);
            return null;
        }
    }

    static async #writeData(filepath: string, data: SaveData): Promise<boolean> {
        const formattedData = JSON.stringify(data, null, 4);

        try {
            await writeFileAsync(filepath, formattedData, 'utf-8');
        } catch (error) {
            mainLog.error(`[SaveManager]: Failed to Write to (${filepath}) - ${error}`);
            return false;
        }

        return true;
    }

    static async #upgradeData(filename: string, savedData: SaveData): Promise<SaveData> {
        const defaultData: SaveData = SaveManager.#getDefaultData(filename);

        const upgradedData: SaveData = { ...defaultData, ...savedData };

        mainLog.debug(`[SaveManager]: Upgraded Data (${filename}) to Latest Version!`);
        await SaveManager.saveData(filename, upgradedData);

        return upgradedData;
    }

    static #getDefaultData(filename: string): SaveData {
        switch (filename) {
            case FILENAME_SETTINGS_DATA_JSON:
                return DefaultData.getDefaultSettingsData(SaveManager.dataVersion);

            case FILENAME_APP_INFO_SAVE_DATA_JSON:
                return DefaultData.getDefaultAppInfoSaveData(SaveManager.dataVersion);

            case FILENAME_WHATS_NEW_JSON:
                return DefaultData.getDefaultWhatsNew(SaveManager.dataVersion);
        
            default:
                return { version: SaveManager.dataVersion };
        }
    }
}