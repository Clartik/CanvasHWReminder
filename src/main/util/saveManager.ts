import * as fs from 'fs'

import { promisify } from 'util'

import * as mainLog from 'electron-log';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

class SaveManager {
    static savePath: string = '';

    static init(saveDataPath: string) {
        this.savePath = saveDataPath;
    }

    static getSavePath(filename: string): string {
        return `${this.savePath}\\${filename}`;
    }

    static async getData(filename: string): Promise<object> {
        const filepath: string = SaveManager.getSavePath(filename);

        const data = await readFileAsync(filepath, 'utf-8');
        return JSON.parse(data);
    }

    static async saveData(filename: string, data: object): Promise<boolean> {
        const filepath: string = SaveManager.getSavePath(filename);
        const formattedData = JSON.stringify(data, null, 4);

        try {
            await writeFileAsync(filepath, formattedData, 'utf-8');
        } catch (error) {
            mainLog.error(`[SaveManager]: Failed to Save ${filename} - ${error}`);
            return false;
        }

        mainLog.log(`[SaveManager]: Saved ${filename}`);
        return true;
    }
}

export default SaveManager;