import * as fs from 'fs';
import { promisify } from 'util';

import * as logger from 'electron-log';

const writeFileAsync = promisify(fs.writeFile);
const readFileAsync = promisify(fs.readFile);

export default class FileManager {
    static async loadData(filepath: string): Promise<object | null> {        
        try {
            const data = await readFileAsync(filepath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            logger.error(`[FileManager]: Failed to Load Data from (${filepath}) - ${error}`);
            return null;
        }
    }

    static async writeData(filepath: string, data: object): Promise<boolean> {
        const formattedData = JSON.stringify(data, null, 4);

        try {
            await writeFileAsync(filepath, formattedData, 'utf-8');
        } catch (error) {
            logger.error(`[FileManager]: Failed to Write to (${filepath}) - ${error}`);
            return false;
        }

        return true;
    }
}