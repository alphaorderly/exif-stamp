/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef, useState } from 'react';
import { Stage } from 'react-konva';
import { ImageType } from '@/stores/states/image';
import { ExifStampSettings } from '@/stores/states/exifStampSettings';
import { createExifStampedKonvaStage } from '@/utils/exifStampRenderer';

interface ExifStampedKonvaImageProps {
    image: ImageType;
    settings: ExifStampSettings;
    width?: number;
    height?: number;
    onImageReady?: (dataUrl: string) => void;
}

const ExifStampedKonvaImage: React.FC<ExifStampedKonvaImageProps> = ({
    image,
    settings,
    width,
    height,
    onImageReady,
}) => {
    const [imageElement, setImageElement] = useState<HTMLImageElement | null>(
        null
    );
    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    }>({ width: 0, height: 0 });
    const stageRef = useRef<any>(null);
    useEffect(() => {
        if (!image.base64) return;

        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = `data:${image.mime};base64,${image.base64}`;

        img.onload = () => {
            setImageElement(img);
            let canvasWidth = img.width;
            let canvasHeight = img.height;

            // Set initial dimensions
            if (width && height) {
                canvasWidth = width;
                canvasHeight = height;
            }

            // The minimum width logic is now handled in createExifStampedKonvaStage
            setDimensions({ width: canvasWidth, height: canvasHeight });
        };

        img.onerror = () => {
            console.error('Failed to load image');
        };
    }, [image.base64, image.mime, width, height]);

    // Export image as data URL when ready
    useEffect(() => {
        if (
            imageElement &&
            dimensions.width > 0 &&
            dimensions.height > 0 &&
            onImageReady
        ) {
            // Use the utility function to get data URL
            const stage = createExifStampedKonvaStage(
                imageElement,
                image,
                settings,
                dimensions.width,
                dimensions.height
            );

            const dataUrl = stage.toDataURL();
            onImageReady(dataUrl);

            if (stageRef.current) {
                // Clone the stage's content to our React Konva stage for display
                const layer = stage.getLayers()[0];
                stageRef.current.add(layer);
                stageRef.current.batchDraw();
            }
        }
    }, [imageElement, dimensions, image, settings, onImageReady]);

    if (!imageElement || dimensions.width === 0 || dimensions.height === 0) {
        return <div>Loading...</div>;
    }

    return (
        <Stage
            width={dimensions.width}
            height={dimensions.height}
            ref={stageRef}
        />
    );
};

export default ExifStampedKonvaImage;
