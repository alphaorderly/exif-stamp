// filepath: g:\Created\EXIFstamp\src\components\image-upload\ExifStampSettings.tsx
import React from 'react';
import { useAtom } from 'jotai';
import {
    exifStampSettingsAtom,
    type ExifStampPosition,
} from '@/stores/states/exifStampSettings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Stamp } from 'lucide-react';
import { cn } from '@/utils/cn/cn';
import { useTranslation } from 'react-i18next';

const ExifStampSettings: React.FC = () => {
    const { t } = useTranslation();
    const [settings, setSettings] = useAtom(exifStampSettingsAtom);

    const toggleEnabled = () => {
        setSettings({ enabled: !settings.enabled });
    };

    const setPosition = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSettings({ position: e.target.value as ExifStampPosition });
    };

    const toggleField = (field: keyof typeof settings.fields) => {
        setSettings({
            fields: {
                ...settings.fields,
                [field]: !settings.fields[field],
            },
        });
    };

    return (
        <Card className="bg-card mt-2 w-full gap-1">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-base leading-none font-semibold tracking-tight">
                    <Stamp className="text-muted-foreground mr-2 h-4 w-4" />{' '}
                    {t('stamp.title')}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="grid gap-2">
                    <div className="flex items-center justify-between">
                        <Label
                            htmlFor="enable-stamp"
                            className="cursor-pointer text-sm"
                        >
                            {t('stamp.enable')}
                        </Label>
                        <Button
                            id="enable-stamp"
                            variant={settings.enabled ? 'default' : 'outline'}
                            size="sm"
                            onClick={toggleEnabled}
                            className={cn(
                                'h-7 w-16 text-xs',
                                settings.enabled ? 'bg-primary' : 'bg-muted'
                            )}
                        >
                            {settings.enabled ? t('stamp.on') : t('stamp.off')}
                        </Button>
                    </div>

                    <div className="mt-1 flex items-center justify-between">
                        <Label htmlFor="position-select" className="text-sm">
                            {t('stamp.position')}
                        </Label>
                        <select
                            id="position-select"
                            value={settings.position}
                            onChange={setPosition}
                            className="border-input bg-background h-7 w-[180px] rounded-md border px-2 text-xs"
                        >
                            <option value="inside-bottom">
                                {t('stamp.positionOptions.insideBottom')}
                            </option>
                            <option value="inside-top">
                                {t('stamp.positionOptions.insideTop')}
                            </option>
                            <option value="outside-bottom">
                                {t('stamp.positionOptions.outsideBottom')}
                            </option>
                            <option value="outside-top">
                                {t('stamp.positionOptions.outsideTop')}
                            </option>
                        </select>
                    </div>

                    <div className="mt-1">
                        <Label className="mb-1 block text-sm">
                            {t('stamp.fields')}
                        </Label>
                        <div className="flex flex-wrap gap-1">
                            <Button
                                variant={
                                    settings.fields.make ? 'default' : 'outline'
                                }
                                size="sm"
                                onClick={() => toggleField('make')}
                                className={cn(
                                    'h-6 px-2 text-xs',
                                    settings.fields.make && 'bg-primary'
                                )}
                            >
                                {settings.fields.make
                                    ? `✓ ${t('stamp.fieldLabels.make')}`
                                    : t('stamp.fieldLabels.make')}
                            </Button>
                            <Button
                                variant={
                                    settings.fields.model
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                onClick={() => toggleField('model')}
                                className={cn(
                                    'h-6 px-2 text-xs',
                                    settings.fields.model && 'bg-primary'
                                )}
                            >
                                {settings.fields.model
                                    ? `✓ ${t('stamp.fieldLabels.model')}`
                                    : t('stamp.fieldLabels.model')}
                            </Button>
                            <Button
                                variant={
                                    settings.fields.dateTaken
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                onClick={() => toggleField('dateTaken')}
                                className={cn(
                                    'h-6 px-2 text-xs',
                                    settings.fields.dateTaken && 'bg-primary'
                                )}
                            >
                                {settings.fields.dateTaken
                                    ? `✓ ${t('stamp.fieldLabels.date')}`
                                    : t('stamp.fieldLabels.date')}
                            </Button>
                            <Button
                                variant={
                                    settings.fields.gpsCoordinates
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                onClick={() => toggleField('gpsCoordinates')}
                                className={cn(
                                    'h-6 px-2 text-xs',
                                    settings.fields.gpsCoordinates &&
                                        'bg-primary'
                                )}
                            >
                                {settings.fields.gpsCoordinates
                                    ? `✓ ${t('stamp.fieldLabels.gps')}`
                                    : t('stamp.fieldLabels.gps')}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ExifStampSettings;
