import {
    ImageType,
    selectedIndex,
    uploadedImages,
} from '@/stores/states/image';
import { useAtom, useAtomValue } from 'jotai';
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Download, FileArchive, Trash2 } from 'lucide-react';
import Preview from './Preview';
import { downloadImage, downloadImagesAsZip } from '@/utils/exportUtils';
import { exifStampSettingsAtom } from '@/stores/states/exifStampSettings';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import heic2any from 'heic2any';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

const UploadList = () => {
    const { t } = useTranslation();
    const [images, setImages] = useAtom(uploadedImages);
    const [index, setIndex] = useAtom(selectedIndex);
    const exifStampSettings = useAtomValue(exifStampSettingsAtom);
    const [isZipping, setIsZipping] = useState(false);
    const [zipProgress, setZipProgress] = useState(0);
    const [isConverting, setIsConverting] = useState(false);
    const [convertProgress, setConvertProgress] = useState(0);

    const resetImages = () => {
        setImages([]);
        setIndex(null);
    };

    // Helper function to check if a file is HEIF/HEIC format
    const isHeifFormat = (file: File): boolean => {
        return (
            file.type === 'image/heic' ||
            file.type === 'image/heif' ||
            file.name.toLowerCase().endsWith('.heic') ||
            file.name.toLowerCase().endsWith('.heif')
        );
    };

    // Function to convert HEIF/HEIC to JPEG
    const convertHeifToJpeg = async (file: File): Promise<File> => {
        try {
            const convertedBlob = (await heic2any({
                blob: file,
                toType: 'image/jpeg',
                quality: 0.9,
            })) as Blob;

            // Create a new file with the converted blob
            return new File(
                [convertedBlob],
                file.name.replace(/\.(heic|heif)$/i, ''),
                { type: 'image/jpeg' }
            );
        } catch (error) {
            console.error('Error converting HEIF/HEIC file:', error);
            throw error;
        }
    };

    const processFile = async (file: File): Promise<ImageType> => {
        try {
            // Check if we need to convert from HEIF/HEIC
            let processedFile = file;
            if (isHeifFormat(file)) {
                processedFile = await convertHeifToJpeg(file);
            }

            // Read file as data URL using a Promise wrapper around FileReader
            const dataUrl = await readFileAsDataURL(processedFile);

            return {
                mime: processedFile.type,
                base64: dataUrl.split(',')[1] || '',
                fileName: processedFile.name,
            };
        } catch (error) {
            console.error('Error processing file:', error);
            throw error;
        }
    };

    // Helper function to convert FileReader to a Promise
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : [];
        if (!files.length) return;

        // Check if any files need HEIF conversion
        const hasHeifFiles = files.some((file) => isHeifFormat(file));
        if (hasHeifFiles) {
            setIsConverting(true);
            setConvertProgress(0);
        }

        let processed = 0;

        Promise.all(
            files.map((file) => {
                return processFile(file).then((result) => {
                    // Update conversion progress
                    if (hasHeifFiles) {
                        processed++;
                        setConvertProgress(
                            Math.round((processed / files.length) * 100)
                        );
                    }
                    return result;
                });
            })
        )
            .then((newImages) => {
                if (hasHeifFiles) {
                    setIsConverting(false);
                }

                // Assuming uploadedImages atom handles EXIF extraction
                const updated = [...images, ...newImages];
                setImages(updated); // Let the atom handle EXIF processing
                if (index === null && updated.length > 0) {
                    setIndex(0);
                }
            })
            .catch((error) => {
                console.error('Error processing images:', error);
                setIsConverting(false);
                alert(
                    t('alerts.errorProcessingImages') ||
                        'Error processing images'
                );
            });
    };

    const handleSelect = (idx: number) => setIndex(idx);

    const handleExportSingle = () => {
        if (index !== null && images[index]) {
            downloadImage(images[index], exifStampSettings);
        } else {
            alert(t('alerts.selectToExport')); // Now using translation
        }
    };

    const handleExportZip = async () => {
        if (images.length > 0) {
            setIsZipping(true);
            await downloadImagesAsZip(images, exifStampSettings, (percent) =>
                setZipProgress(Math.round(percent))
            );
            setIsZipping(false);
        } else {
            alert(t('alerts.noImagesToExport')); // Now using translation
        }
    };

    // Remove a single image and adjust selection
    const handleRemove = (removeIdx: number) => {
        const updated = images.filter((_, i) => i !== removeIdx);
        setImages(updated);
        if (index !== null) {
            if (removeIdx < index) {
                setIndex(index - 1);
            } else if (removeIdx === index) {
                if (updated.length > 0) {
                    const newIndex =
                        removeIdx < updated.length
                            ? removeIdx
                            : updated.length - 1;
                    setIndex(newIndex);
                } else {
                    setIndex(null);
                }
            }
        }
    };

    return (
        <div className="space-y-4 p-4">
            <div className="space-y-4 md:flex md:h-[calc(100vh-100px)] md:space-y-0 md:space-x-4">
                {' '}
                {/* Adjusted height */}
                <Card className="flex flex-col md:w-1/4">
                    <CardHeader>
                        <CardTitle>{t('upload.gallery')}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-2 overflow-y-auto">
                        {' '}
                        {/* Reduced space */}
                        <Button
                            variant="outline"
                            className="relative w-full overflow-hidden"
                        >
                            <Upload className="mr-2 h-4 w-4" />{' '}
                            {/* Adjusted icon size */}
                            <span>{t('upload.selectImages')}</span>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handleFiles}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                            />
                        </Button>
                        {/* Export Buttons */}
                        <div className="flex flex-col gap-2">
                            <Button
                                variant="default"
                                className="flex-1 cursor-pointer"
                                onClick={handleExportSingle}
                                disabled={index === null}
                            >
                                <Download className="mr-2 h-4 w-4" />{' '}
                                {t('upload.exportSelected')}
                            </Button>
                            <Button
                                variant="secondary"
                                className="flex-1 cursor-pointer"
                                onClick={handleExportZip}
                                disabled={images.length === 0 || isZipping}
                            >
                                <FileArchive className="mr-2 h-4 w-4" />{' '}
                                {t('upload.exportAllZip')}
                            </Button>
                        </div>
                        {isZipping && (
                            <div className="mt-2">
                                <Progress value={zipProgress} />
                                <p className="mt-1 text-center text-sm">
                                    {zipProgress}%
                                </p>
                            </div>
                        )}
                        {isConverting && (
                            <div className="mt-2">
                                <Progress value={convertProgress} />
                                <p className="mt-1 text-center text-sm">
                                    {t(
                                        'upload.convertingHeif',
                                        'Converting HEIF/HEIC'
                                    )}{' '}
                                    {convertProgress}%
                                </p>
                            </div>
                        )}
                        <Button
                            variant="destructive"
                            className="w-full"
                            onClick={resetImages}
                            disabled={images.length === 0}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />{' '}
                            {t('upload.resetImages')}
                        </Button>
                        {images.length > 0 ? (
                            <>
                                {/* Desktop Thumbnail List with Filenames */}
                                <div className="hidden pt-2 md:flex md:flex-col md:space-y-2">
                                    {images.map((img, idx) => (
                                        <div
                                            key={idx}
                                            className={`flex items-center justify-between rounded-md p-1 transition-all ${index === idx ? 'bg-muted ring-primary ring-2 ring-offset-2' : 'hover:bg-muted/50'}`}
                                        >
                                            <div
                                                onClick={() =>
                                                    handleSelect(idx)
                                                }
                                                className="flex flex-1 cursor-pointer items-center"
                                            >
                                                <div className="relative h-16 w-16 flex-shrink-0">
                                                    <img
                                                        src={`data:${img.mime};base64,${img.base64}`}
                                                        alt={`thumb-${idx}`}
                                                        className="h-full w-full rounded-md object-cover"
                                                    />
                                                </div>
                                                <div className="ml-2 flex-1 overflow-hidden">
                                                    <p className="truncate text-sm font-medium">
                                                        {img.fileName ||
                                                            `Image ${idx + 1}`}
                                                    </p>
                                                    <p className="text-muted-foreground text-xs">
                                                        {(img.mime || '')
                                                            .split('/')[1]
                                                            ?.toUpperCase() ||
                                                            'Image'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleRemove(idx)
                                                }
                                                className="ml-2 rounded-full bg-red-50 p-1 text-red-600 hover:bg-red-100 hover:text-red-800 focus:ring-2 focus:ring-red-200 focus:outline-none"
                                                aria-label={t(
                                                    'upload.removeImage'
                                                )}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                {/* Mobile Dropdown with shadcn Select */}
                                <div className="mt-2 block md:hidden">
                                    <Select
                                        value={
                                            index !== null
                                                ? index.toString()
                                                : ''
                                        }
                                        onValueChange={(value) =>
                                            handleSelect(Number(value))
                                        }
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue
                                                placeholder={t(
                                                    'upload.selectImage'
                                                )}
                                            />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {images.map((img, idx) => (
                                                <SelectItem
                                                    key={idx}
                                                    value={idx.toString()}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <img
                                                                src={`data:${img.mime};base64,${img.base64}`}
                                                                alt={
                                                                    img.fileName ||
                                                                    `Image ${idx + 1}`
                                                                }
                                                                className="mr-2 h-6 w-6 rounded-md object-cover"
                                                            />
                                                            <span className="truncate">
                                                                {img.fileName ||
                                                                    `Image ${idx + 1}`}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemove(
                                                                    idx
                                                                );
                                                            }}
                                                            className="ml-2 p-1 text-red-500 hover:text-red-700 focus:outline-none"
                                                            aria-label={t(
                                                                'upload.removeImage'
                                                            )}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <div className="text-muted-foreground pt-4 text-center text-sm">
                                {t('upload.noImagesUploaded')}
                            </div> // Added padding top
                        )}
                    </CardContent>
                </Card>
                {/* Preview Area */}
                <Card className="flex flex-col md:flex-1">
                    {' '}
                    {/* Added flex flex-col */}
                    <CardHeader>
                        <CardTitle>{t('preview.title')}</CardTitle>
                    </CardHeader>
                    {/* Ensure CardContent takes remaining space and scrolls if needed */}
                    <CardContent className="flex flex-1 flex-col items-center space-y-4 overflow-y-auto">
                        {/* Pass the selected image data to Preview */}
                        <Preview
                            image={index !== null ? images[index] : undefined}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default UploadList;
