import {mkdir, readFile, writeFile} from "fs/promises";
import {join} from 'path';
import {glob} from 'glob';

const STORAGE_PATH = "./storage"

export const uploadFile = async (input: {
    uuid: string,
    file: File | Blob | { base64: string, mime_type: string },
    original_name: string
}): Promise<{ uuid: string, type: 'image' | 'file', path: string }> => {
    const date_string = new Date().toISOString().slice(0, 10);
    const storage_path = join(STORAGE_PATH, 'image', date_string);
    const file_path = join(storage_path, input.uuid, input.original_name);

    await mkdir(join(storage_path, input.uuid), {recursive: true});

    const buffer =
        input.file instanceof Blob || input.file instanceof File
            ? Buffer.from(await input.file.arrayBuffer())
            : Buffer.from(input.file.base64.replace(/^data:[^;]+;base64,/, ''), 'base64');

    await writeFile(file_path, buffer);

    return {uuid: input.uuid, type: 'image', path: file_path};
}

export const findFileByUuid = async (uuid: string): Promise<{
    original_name: string,
    uuid: string,
    buffer: Buffer
} | null> => {
    try {
        const files = await glob(`${STORAGE_PATH}/**/${uuid}/*`);

        if (files.length === 0) {
            return null
        }

        const file_path = files[0];
        const original_name = file_path.split('/').pop() || '';
        const buffer = await readFile(file_path);

        return {
            uuid: uuid,
            buffer: buffer,
            original_name: original_name
        };
    } catch (error) {
        console.error('Error finding file:', error);
        return null;
    }

}