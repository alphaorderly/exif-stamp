/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useAtomValue } from 'jotai';
import type { ImageType } from '@/stores/states/image';
import type { ExifStampSettings } from '@/stores/states/exifStampSettings';
import { exifStampSettingsAtom } from '@/stores/states/exifStampSettings';
import { createExifStampedKonvaStage } from '@/utils/exifStampRenderer';

// Cache for storing processed images to avoid reprocessing the same image with the same settings
const imageCache = new Map<string, string>();

// Generate a cache key based on image and settings
const generateCacheKey = (
    image: ImageType,
    settings: ExifStampSettings
): string => {
    // Include full base64 to ensure unique keys per image
    return `${image.base64}_${settings.position}_${Object.values(settings.fields).join('_')}`;
};

interface ExifStampedImageProps {
    image: ImageType;
    className?: string;
    width?: number;
    height?: number;
}

// Debounce timer for processing
const DEBOUNCE_TIME = 150;

const ExifStampedImage: React.FC<ExifStampedImageProps> = React.memo(
    ({ image, className, width, height }) => {
        const settings = useAtomValue(exifStampSettingsAtom);
        const [dataUrl, setDataUrl] = useState<string | null>(null);
        const [imageElement, setImageElement] =
            useState<HTMLImageElement | null>(null);
        const [dimensions, setDimensions] = useState<{
            width: number;
            height: number;
        }>({ width: 0, height: 0 });
        const [isProcessing, setIsProcessing] = useState<boolean>(false);
        const stageRef = useRef<any>(null);
        const processingTimerRef = useRef<any>(null);

        // Extract only the settings we care about to prevent unnecessary rerenders
        const relevantSettings = useMemo(
            () => ({
                enabled: settings.enabled,
                position: settings.position,
                fontSize: settings.fontSize,
                backgroundColor: settings.backgroundColor,
                textColor: settings.textColor,
                opacity: settings.opacity,
                padding: settings.padding,
                fields: {
                    make: settings.fields.make,
                    model: settings.fields.model,
                    dateTaken: settings.fields.dateTaken,
                    gpsCoordinates: settings.fields.gpsCoordinates,
                },
            }),
            [
                settings.enabled,
                settings.position,
                settings.fontSize,
                settings.backgroundColor,
                settings.textColor,
                settings.opacity,
                settings.padding,
                settings.fields.make,
                settings.fields.model,
                settings.fields.dateTaken,
                settings.fields.gpsCoordinates,
            ]
        );

        // Generate cache key
        const cacheKey = useMemo(
            () =>
                image.base64 ? generateCacheKey(image, relevantSettings) : '',
            [image.base64, relevantSettings]
        );

        // Clean up any previous Konva resources when component unmounts
        useEffect(() => {
            return () => {
                if (stageRef.current) {
                    stageRef.current.destroyChildren();
                    stageRef.current.destroy();
                }
                if (processingTimerRef.current) {
                    clearTimeout(processingTimerRef.current);
                }
            };
        }, []);

        // Reset dataUrl when image or relevant settings change
        useEffect(() => {
            // Check if we have a cached version
            if (cacheKey && imageCache.has(cacheKey)) {
                setDataUrl(imageCache.get(cacheKey) || null);
                return;
            }

            setDataUrl(null);
            if (relevantSettings.enabled && image.base64) {
                setIsProcessing(true);
            }
        }, [cacheKey, image.base64, relevantSettings.enabled]);

        // Load the image - this shouldn't change frequently
        useEffect(() => {
            if (!image.base64 || !relevantSettings.enabled) return;

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

                setDimensions({ width: canvasWidth, height: canvasHeight });
            };

            img.onerror = () => {
                console.error('Failed to load image');
                setIsProcessing(false);
            };

            return () => {
                // Clean up image object
                img.onload = null;
                img.onerror = null;
            };
        }, [image.base64, image.mime, width, height, relevantSettings.enabled]);

        // The processing function - memoized to avoid recreating on every render
        const processImage = useCallback(() => {
            if (
                !relevantSettings.enabled ||
                !imageElement ||
                dimensions.width === 0 ||
                dimensions.height === 0 ||
                !cacheKey
            ) {
                setIsProcessing(false);
                return;
            }

            try {
                // Check cache first
                if (imageCache.has(cacheKey)) {
                    setDataUrl(imageCache.get(cacheKey) || null);
                    setIsProcessing(false);
                    return;
                }

                // Clean up any existing stage content
                if (stageRef.current) {
                    stageRef.current.destroyChildren();
                }

                // Use the utility function to get data URL
                const stage = createExifStampedKonvaStage(
                    imageElement,
                    image,
                    settings,
                    dimensions.width,
                    dimensions.height
                );

                const generatedDataUrl = stage.toDataURL();

                // Cache the result
                imageCache.set(cacheKey, generatedDataUrl);

                // Update state
                setDataUrl(generatedDataUrl);

                // Clean up resources
                stage.destroy();
            } catch (error) {
                console.error('Error generating stamped image:', error);
            } finally {
                setIsProcessing(false);
            }
        }, [
            imageElement,
            dimensions,
            image,
            settings,
            cacheKey,
            relevantSettings.enabled,
        ]);

        // Debounced image processing to prevent too many operations during rapid changes
        useEffect(() => {
            if (
                relevantSettings.enabled &&
                imageElement &&
                dimensions.width > 0 &&
                dimensions.height > 0 &&
                !dataUrl
            ) {
                // Clear any existing timer
                if (processingTimerRef.current) {
                    clearTimeout(processingTimerRef.current);
                }

                // Set up debounced processing
                processingTimerRef.current = setTimeout(() => {
                    processImage();
                }, DEBOUNCE_TIME);

                // Cleanup
                return () => {
                    if (processingTimerRef.current) {
                        clearTimeout(processingTimerRef.current);
                    }
                };
            }
        }, [
            imageElement,
            dimensions,
            dataUrl,
            processImage,
            relevantSettings.enabled,
        ]);

        // If settings are disabled, just show the original image
        if (!relevantSettings.enabled) {
            return (
                <img
                    src={`data:${image.mime};base64,${image.base64}`}
                    alt="preview"
                    className={className}
                    style={{ maxWidth: '100%', maxHeight: '100%' }}
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

        // Show original image with loading overlay during processing
        if (isProcessing && image.base64) {
            return (
                <div
                    className={className}
                    style={{
                        position: 'relative',
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                >
                    {/* Original image as background while processing */}
                    <img
                        src={`data:${image.mime};base64,${image.base64}`}
                        alt="preview being processed"
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            opacity: 0.7,
                        }}
                    />

                    {/* Loading overlay */}
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                            color: 'white',
                            borderRadius: '4px',
                        }}
                    >
                        <div
                            style={{
                                width: '40px',
                                height: '40px',
                                border: '4px solid rgba(255, 255, 255, 0.3)',
                                borderTop: '4px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                        <div style={{ marginTop: '12px', fontSize: '14px' }}>
                            Applying EXIF data...
                        </div>
                    </div>
                </div>
            );
        }

        // Show loading state when no image is loaded yet
        if (
            !imageElement ||
            dimensions.width === 0 ||
            dimensions.height === 0
        ) {
            return (
                <div
                    className={className}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: '150px',
                        backgroundColor: 'rgba(0, 0, 0, 0.05)',
                        borderRadius: '4px',
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                width: '30px',
                                height: '30px',
                                margin: '0 auto',
                                border: '3px solid rgba(0, 0, 0, 0.1)',
                                borderTop: '3px solid #333',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                            }}
                        />
                        <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                        <div style={{ marginTop: '8px', fontSize: '14px' }}>
                            Loading image...
                        </div>
                    </div>
                </div>
            );
        }

        // This should rarely be rendered as we prioritize showing either
        // the processed image or the loading state
        return null;
    }
);

ExifStampedImage.displayName = 'ExifStampedImage';

export default ExifStampedImage;
