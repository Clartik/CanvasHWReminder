import * as fs from 'fs'
import * as path from 'path';

import { promisify } from 'util'

import { app } from 'electron';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

class SaveManager {
    static getLocalPath(filename: string): string {
        const filepath = path.join(__baseDir, filename);
        return filepath;
    }

    static getSavePath(filename: string): string {
        const userDataPath: string = app.getPath("userData");
        return `${userDataPath}\\${filename}`;
    }

    static async getLocalData(filename: string): Promise<Object> {
        const localPath: string = SaveManager.getLocalPath(filename);
        return await SaveManager.getData(localPath);
    }

    static async getSavedData(filename: string): Promise<Object> {
        const savePath: string = SaveManager.getSavePath(filename);
        return await SaveManager.getData(savePath);
    }

    static async writeSavedData(filename: string, data: Object): Promise<boolean> {
        const savePath: string = SaveManager.getSavePath(filename);
        const success =  await SaveManager.writeData(savePath, data);

        if (success)
            console.log(`[SaveManager]: Saved ${filename}`);
        else
            console.error(`[SaveManager]: Failed to Save ${filename}`);

        return success;
    }

    static async getData(filepath: string): Promise<Object> {
        const data = await readFileAsync(filepath, 'utf-8');
        return JSON.parse(data);
    }

    static async writeData(filepath: string, data: Object): Promise<boolean> {
        const formattedData = JSON.stringify(data, null, 4);

        try {
            await writeFileAsync(filepath, formattedData, 'utf-8');
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }

    static getDataSync(filepath: string): Object {
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
    }

    static writeDataSync(filepath: string, data: Object): boolean {
        const formattedData = JSON.stringify(data, null, 4);

        try {
            fs.writeFileSync(filepath, formattedData, 'utf-8');
        } catch (error) {
            console.error(error);
            return false;
        }

        return true;
    }
}

export default SaveManager;