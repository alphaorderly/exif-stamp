import React from 'react';
import ExifView from './ExifView';
import ExifStampedImage from './ExifStampedImage';
import ExifStampSettings from './ExifStampSettings';
import type { ImageType } from '@/stores/states/image';
import { useTranslation } from 'react-i18next';

type PreviewProps = {
    image?: ImageType;
};

const Preview: React.FC<PreviewProps> = ({ image }) => {
    const { t } = useTranslation();

    if (!image) {
        return (
            <div className="text-muted-foreground flex h-full items-center justify-center text-center text-sm">
                {t('preview.selectToPreview')}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-grow flex-col items-center space-y-4 overflow-y-auto p-1">
            <div className="flex h-auto max-h-[50vh] w-full max-w-full items-center justify-center overflow-hidden rounded-md border bg-gray-100 dark:bg-gray-800">
                <ExifStampedImage
                    image={image}
                    className="max-h-full max-w-full object-contain"
                />
            </div>
            {image.exif && <ExifView exif={image.exif} />}
            <ExifStampSettings />
        </div>
    );
};

export default Preview;
