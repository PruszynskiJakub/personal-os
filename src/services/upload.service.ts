import {mkdir, writeFile} from "fs/promises";
import {join} from 'path';

export const uploadFile = async (input: {
    uuid: string,
    file: File | Blob | { base64: string, mime_type: string },
    original_name: string
}): Promise<{ uuid: string, type: 'image' | 'file', path: string }> => {
    const date_string = new Date().toISOString().slice(0, 10);
    const storage_path = join("storage", 'image', date_string);
    const file_path = join(storage_path, input.uuid, input.original_name);

    await mkdir(join(storage_path, input.uuid), {recursive: true});

    const buffer =
        input.file instanceof Blob || input.file instanceof File
            ? Buffer.from(await input.file.arrayBuffer())
            : Buffer.from(input.file.base64.replace(/^data:[^;]+;base64,/, ''), 'base64');

    await writeFile(file_path, buffer);

    return {uuid: input.uuid, type: 'image', path: file_path};
}