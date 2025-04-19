// filepath: g:\Created\EXIFstamp\src\stores\states\exifStampSettings.ts
import { atom } from 'jotai';
import { get as idbGet, set as idbSet } from 'idb-keyval';

export type ExifStampPosition =
    | 'inside-bottom'
    | 'inside-top'
    | 'outside-bottom'
    | 'outside-top';

export interface ExifStampSettings {
    enabled: boolean;
    position: ExifStampPosition;
    fontSize: number;
    backgroundColor: string;
    textColor: string;
    opacity: number;
    padding: number;
    fields: {
        make: boolean;
        model: boolean;
        dateTaken: boolean;
        gpsCoordinates: boolean;
    };
}

const defaultSettings: ExifStampSettings = {
    enabled: true,
    position: 'inside-bottom',
    fontSize: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    textColor: 'rgba(255, 255, 255, 1)',
    opacity: 0.9,
    padding: 8,
    fields: {
        make: true,
        model: true,
        dateTaken: true,
        gpsCoordinates: true,
    },
};

const baseSettingsAtom = atom<ExifStampSettings>(defaultSettings);

baseSettingsAtom.onMount = (setSettings) => {
    idbGet<ExifStampSettings>('exifStampSettings').then((data) => {
        if (data) setSettings(data);
    });
};

export const exifStampSettingsAtom = atom(
    (get) => get(baseSettingsAtom),
    (get, set, newSettings: Partial<ExifStampSettings>) => {
        const currentSettings = get(baseSettingsAtom);
        const updatedSettings = { ...currentSettings, ...newSettings };
        set(baseSettingsAtom, updatedSettings);
        idbSet('exifStampSettings', updatedSettings);
    }
);
