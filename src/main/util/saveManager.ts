import * as fs from 'fs'
import * as path from 'path';

import { promisify } from 'util'

import * as mainLog from 'electron-log';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

class SaveManager {
    static saveDataPath: string = '';

    static init(userDataPath: string) {
        this.saveDataPath = userDataPath;
    }

    static getLocalPath(filename: string): string {
        const filepath = path.join(__baseDir, filename);
        return filepath;
    }

    static getSavePath(filename: string): string {
        return `${this.saveDataPath}\\${filename}`;
    }

    static async getLocalData(filename: string): Promise<object> {
        const localPath: string = SaveManager.getLocalPath(filename);
        return await SaveManager.getData(localPath);
    }

    static async getSavedData(filename: string): Promise<object> {
        const savePath: string = SaveManager.getSavePath(filename);
        return await SaveManager.getData(savePath);
    }

    static async writeSavedData(filename: string, data: object): Promise<boolean> {
        const savePath: string = SaveManager.getSavePath(filename);
        const success =  await SaveManager.writeData(savePath, data);

        if (success)
            mainLog.log(`[SaveManager]: Saved ${filename}`);
        else
            mainLog.error(`[SaveManager]: Failed to Save ${filename}`);

        return success;
    }

    static async getData(filepath: string): Promise<object> {
        const data = await readFileAsync(filepath, 'utf-8');
        return JSON.parse(data);
    }

    static async writeData(filepath: string, data: object): Promise<boolean> {
        const formattedData = JSON.stringify(data, null, 4);

        try {
            await writeFileAsync(filepath, formattedData, 'utf-8');
        } catch (error) {
            mainLog.error(error);
            return false;
        }

        return true;
    }

    static getDataSync(filepath: string): object {
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    }

    static writeDataSync(filepath: string, data: object): boolean {
        const formattedData = JSON.stringify(data, null, 4);

        try {
            fs.writeFileSync(filepath, formattedData, 'utf-8');
        } catch (error) {
            mainLog.error(error);
            return false;
        }

        return true;
    }
}

export default SaveManager;