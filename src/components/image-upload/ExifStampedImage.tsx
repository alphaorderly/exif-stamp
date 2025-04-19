import React, { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import type { ImageType } from '@/stores/states/image';
import { exifStampSettingsAtom } from '@/stores/states/exifStampSettings';
import ExifStampedKonvaImage from './ExifStampedKonvaImage';

interface ExifStampedImageProps {
    image: ImageType;
    className?: string;
}

const ExifStampedImage: React.FC<ExifStampedImageProps> = ({
    image,
    className,
}) => {
    const settings = useAtomValue(exifStampSettingsAtom);
    const [dataUrl, setDataUrl] = useState<string | null>(null);

    // Reset dataUrl when image or any settings change to ensure re-rendering
    useEffect(() => {
        setDataUrl(null);
    }, [
        image.base64,
        settings.enabled,
        settings.position,
        settings.fields.make,
        settings.fields.model,
        settings.fields.dateTaken,
        settings.fields.gpsCoordinates,
    ]);

    // If settings are disabled, just show the original image
    if (!settings.enabled) {
        return (
            <img
                src={`data:${image.mime};base64,${image.base64}`}
                alt="preview"
                className={className}
            />
        );
    }

    // If we have a rendered data URL, use it
    if (dataUrl) {
        return (
            <img
                src={dataUrl}
                alt="preview with EXIF data"
                className={className}
                style={{ maxWidth: '100%', maxHeight: '100%' }}
            />
        );
    }

    // Otherwise, render using Konva and capture the result
    return (
        <div
            className={className}
            style={{ maxWidth: '100%', maxHeight: '100%' }}
        >
            <ExifStampedKonvaImage
                image={image}
                settings={settings}
                onImageReady={setDataUrl}
                key={`konva-image-${image.base64.substring(0, 20)}`} // Add key to force re-mount on image change
            />
        </div>
    );
};

export default ExifStampedImage;
