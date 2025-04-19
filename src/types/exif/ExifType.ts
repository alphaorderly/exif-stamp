type ExifType = {
    Make?: string;
    Model?: string;
    Orientation?: string;
    DateTimeOriginal?: Date;
    GPSLatitudeRef?: string;
    GPSLatitude?: [number, number, number];
    GPSLongitudeRef?: string;
    GPSLongitude?: [number, number, number];
};

export default ExifType;
