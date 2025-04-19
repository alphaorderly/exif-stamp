// filepath: g:\Created\EXIFstamp\src\utils\exportUtils.ts
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import type { ImageType } from '@/stores/states/image';
import { ExifStampSettings } from '@/stores/states/exifStampSettings';
import { createExifStampedKonvaStage } from './exifStampRenderer';

// Function to create a canvas with EXIF data stamped onto the image
const createExifStampedCanvas = (
    image: ImageType,
    settings: ExifStampSettings
): Promise<Blob> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            // Create canvas matching image dimensions
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                // Fallback if canvas context is not available
                const byteString = atob(image.base64);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab], { type: image.mime }));
                return;
            } // Create a Konva stage for stamping
            const stage = createExifStampedKonvaStage(
                img,
                image,
                settings,
                canvas.width,
                canvas.height
            );
            // Generate a data URL synchronously from Konva stage
            const dataUrl = stage.toDataURL({ pixelRatio: 1 });
            // Convert data URL to Blob
            const base64 = dataUrl.split(',')[1] || '';
            try {
                const byteString = atob(base64);
                const ab = new ArrayBuffer(byteString.length);
                const ia = new Uint8Array(ab);
                for (let i = 0; i < byteString.length; i++) {
                    ia[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab], { type: image.mime }));
            } catch {
                // Fallback to raw image data if conversion fails
                const byteString = atob(image.base64);
                const ab2 = new ArrayBuffer(byteString.length);
                const ia2 = new Uint8Array(ab2);
                for (let i = 0; i < byteString.length; i++) {
                    ia2[i] = byteString.charCodeAt(i);
                }
                resolve(new Blob([ab2], { type: image.mime }));
            }
        };

        img.src = `data:${image.mime};base64,${image.base64}`;
    });
};

// Function to download a single image with EXIF stamp
export const downloadImage = async (
    image: ImageType,
    settings: ExifStampSettings
) => {
    let blob;

    if (settings.enabled) {
        blob = await createExifStampedCanvas(image, settings);
    } else {
        // If stamping is disabled, use the original image
        const byteString = atob(image.base64);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        blob = new Blob([ab], { type: image.mime });
    }

    const fileName = `edited_${image.fileName}.${image.mime.split('/')[1] || 'jpg'}`;
    saveAs(blob, fileName);
};

// Function to download all images as a zip file with EXIF stamps
export const downloadImagesAsZip = async (
    images: ImageType[],
    settings: ExifStampSettings,
    onProgress?: (percent: number) => void
) => {
    const zip = new JSZip();

    // Process all images in parallel
    await Promise.all(
        images.map(async (image) => {
            const fileName = `edited_${image.fileName}.${image.mime.split('/')[1] || 'jpg'}`;

            if (settings.enabled) {
                // Create stamped image
                const blob = await createExifStampedCanvas(image, settings);
                // Convert blob to ArrayBuffer for adding to zip
                const arrayBuffer = await blob.arrayBuffer();
                zip.file(fileName, arrayBuffer);
            } else {
                // Add the original image file to the zip
                zip.file(fileName, image.base64, { base64: true });
            }
        })
    );

    // Generate the zip file asynchronously with progress updates
    const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        if (onProgress) onProgress(metadata.percent);
    });

    // Trigger the download
    saveAs(zipBlob, 'exported_images.zip');
    if (onProgress) {
        onProgress(0); // Reset progress after download
    }
};
