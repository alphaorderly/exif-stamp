import { atom } from 'jotai';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import { parse } from 'exifr';
import ExifType from '@/types/exif/ExifType';

export type ImageType = {
    mime: string;
    base64: string;
    exif?: ExifType;
    fileName: string;
};

const baseImagesAtom = atom<ImageType[]>([]);

baseImagesAtom.onMount = (setImages) => {
    idbGet<ImageType[]>('uploadedImages').then((data) => {
        if (data) setImages(data);
    });
};

const uploadedImages = atom(
    (get) => get(baseImagesAtom),
    async (_get, set, newImages: ImageType[]) => {
        const imagesWithExif: ImageType[] = await Promise.all(
            newImages.map(async (img: ImageType) => {
                const data = img.base64.split(',')[1] || img.base64;
                const binary = atob(data);
                const arrayBuffer = new ArrayBuffer(binary.length);
                const view = new Uint8Array(arrayBuffer);
                for (let i = 0; i < binary.length; i++)
                    view[i] = binary.charCodeAt(i);
                const blob = new Blob([arrayBuffer], { type: img.mime });
                const exifData = await parse(blob);
                return { ...img, exif: exifData || {} };
            })
        );
        set(baseImagesAtom, imagesWithExif);
        idbSet('uploadedImages', imagesWithExif);
    }
);

const selectedIndex = atom<number | null>(null);

export { uploadedImages, selectedIndex };
