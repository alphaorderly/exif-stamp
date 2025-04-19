import React from 'react';
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from '@/components/ui/accordion';
import ExifType from '@/types/exif/ExifType';
import dayjs from 'dayjs';
import { MapPin, Calendar, Camera, Smartphone } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ExifViewProps = {
    exif: ExifType;
};

// Helper function to format GPS coordinates (DMS to string)
const formatGPS = (
    coord: [number, number, number] | undefined,
    ref: string | undefined
): string => {
    if (!coord) return 'N/A';
    const [degrees, minutes, seconds] = coord;
    return `${degrees}° ${minutes}' ${seconds.toFixed(2)}" ${ref || ''}`;
};

const ExifView: React.FC<ExifViewProps> = ({ exif }) => {
    const { t } = useTranslation();

    return (
        <Accordion
            type="single"
            collapsible
            className="bg-card text-card-foreground w-full gap-2 border pb-2 shadow-sm"
        >
            <AccordionItem value="metadata">
                <AccordionTrigger className="cursor-pointer pb-3">
                    <div className="flex w-full items-center justify-between text-base leading-none font-semibold tracking-tight">
                        <div className="flex items-center">
                            <Camera className="text-muted-foreground mr-2 h-4 w-4" />
                            {t('exif.metadata')}
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 pt-0 pb-2 text-sm sm:grid-cols-2">
                        {/* Use a helper component for consistent styling */}
                        {exif.Make && (
                            <ExifField
                                label={t('exif.make')}
                                value={exif.Make}
                            />
                        )}
                        {exif.Model && (
                            <ExifField
                                label={t('exif.model')}
                                value={exif.Model}
                                icon={Smartphone}
                            />
                        )}
                        {exif.Orientation && (
                            <ExifField
                                label={t('exif.orientation')}
                                value={exif.Orientation}
                            />
                        )}
                        {exif.DateTimeOriginal && (
                            <ExifField
                                label={t('exif.dateTaken')}
                                value={dayjs(exif.DateTimeOriginal).format(
                                    'YYYY-MM-DD HH:mm:ss'
                                )}
                                icon={Calendar}
                            />
                        )}
                        {exif.GPSLatitude && (
                            <ExifField
                                label={t('exif.latitude')}
                                value={formatGPS(
                                    exif.GPSLatitude,
                                    exif.GPSLatitudeRef
                                )}
                                icon={MapPin}
                            />
                        )}
                        {exif.GPSLongitude && (
                            <ExifField
                                label={t('exif.longitude')}
                                value={formatGPS(
                                    exif.GPSLongitude,
                                    exif.GPSLongitudeRef
                                )}
                                icon={MapPin}
                            />
                        )}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};

// Helper component for individual EXIF fields
const ExifField: React.FC<{
    label: string;
    value: string | number;
    icon?: React.ElementType;
}> = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col space-y-0.5">
        <span className="text-muted-foreground flex items-center text-xs font-medium">
            {Icon && <Icon className="mr-1.5 h-3.5 w-3.5" />}
            {label}
        </span>
        <span className="text-foreground text-sm break-words">{value}</span>
    </div>
);

export default ExifView;
