import type { ImageType } from '@/stores/states/image';
import { ExifStampSettings } from '@/stores/states/exifStampSettings';
import dayjs from 'dayjs';
import 'dayjs/locale/ko'; // 한국어 로케일 포함
import i18n from '@/i18n'; // i18n 인스턴스 (언어 설정용)
import Konva from 'konva';

// Helper function to format GPS coordinates (DMS to string) - 그대로 유지
export const formatGPS = (
    coord: [number, number, number] | undefined,
    ref: string | undefined
): string => {
    if (!coord) return ''; // N/A 대신 빈 문자열 반환 고려
    const [degrees, minutes, seconds] = coord;
    // 초 단위는 소수점 없이 깔끔하게 표시
    return `${degrees}° ${minutes}' ${seconds.toFixed(0)}" ${ref || ''}`;
};

// Function to create text measurements (Konva 내장 기능 활용) - Konva Text 객체로 측정
const measureTextWidth = (
    text: string,
    fontSize: number,
    fontFamily: string,
    fontStyle: string = 'normal'
): number => {
    // Konva Text 객체를 임시로 생성하여 너비 측정
    const tempText = new Konva.Text({
        text,
        fontSize,
        fontFamily,
        fontStyle,
    });
    return tempText.width();
};

// Shared function to render EXIF stamp - returns a Konva stage
export const createExifStampedKonvaStage = (
    img: HTMLImageElement,
    image: ImageType,
    settings: ExifStampSettings,
    containerWidth: number,
    containerHeight: number
): Konva.Stage => {
    // --- 1. 초기화 및 기본 설정 ---
    let w = containerWidth || img.width;
    let h = containerHeight || img.height;

    // Ensure minimum width for small images (moved from ExifStampedKonvaImage.tsx)
    const minWidth = 500;
    if (w < minWidth && img.width > 0) {
        const scale = minWidth / w;
        w = minWidth;
        h = Math.round(h * scale);
    }
    // --- 2. 스타일링 상수 정의 (모던 디자인) ---
    const fontFamily = 'Roboto, "Noto Sans KR", Arial, sans-serif'; // 웹 친화적이고 깔끔한 폰트
    const baseFontSize = settings.fontSize; // 설정에서 기본 크기 가져오기
    const basePadding = Math.max(12, w * 0.03); // 이미지 너비에 비례하는 *가로* 패딩 (최소 12px)
    const textColor = '#FFFFFF'; // 밝은 텍스트 색상
    const isOutside = settings.position.includes('outside');
    // 외부 배치일 때 더 어두운 배경색 사용
    const backgroundColor = isOutside
        ? 'rgba(0, 0, 0, 0.8)' // 외부 배치는 더 어둡게
        : 'rgba(0, 0, 0, 0.6)'; // 내부 배치는 기존대로
    const separatorColor = 'rgba(255, 255, 255, 0.25)'; // 구분선 색상

    // --- 3. 표시할 EXIF 정보 수집 ---
    const leftColumn: { text: string; style: 'bold' | 'normal' }[] = [];
    const rightColumn: { text: string; style: 'bold' | 'normal' }[] = [];

    // EXIF 데이터 없으면 원본 이미지만 있는 stage 반환
    if (!image.exif) {
        const stage = new Konva.Stage({
            container: document.createElement('div'),
            width: w,
            height: h,
        });
        const layer = new Konva.Layer();
        stage.add(layer);
        layer.add(
            new Konva.Image({ image: img, x: 0, y: 0, width: w, height: h })
        );
        layer.batchDraw();
        return stage;
    }

    // 왼쪽 열: 카메라 제조사 및 모델 (굵게)
    if (settings.fields.make && image.exif.Make) {
        leftColumn.push({ text: image.exif.Make, style: 'bold' });
    }
    if (settings.fields.model && image.exif.Model) {
        leftColumn.push({ text: image.exif.Model, style: 'bold' });
    }

    // 오른쪽 열: 촬영 날짜 및 GPS (일반 두께)
    if (settings.fields.dateTaken && image.exif.DateTimeOriginal) {
        const currentLang = i18n.language || 'en';
        dayjs.locale(currentLang); // 현재 언어 설정
        const format =
            currentLang === 'ko'
                ? 'YYYY.MM.DD • HH:mm'
                : 'MMM D, YYYY • h:mm A'; // 날짜 형식
        rightColumn.push({
            text: dayjs(image.exif.DateTimeOriginal).format(format),
            style: 'normal',
        });
    }
    if (
        settings.fields.gpsCoordinates &&
        (image.exif.GPSLatitude || image.exif.GPSLongitude)
    ) {
        const lat = image.exif.GPSLatitude
            ? formatGPS(image.exif.GPSLatitude, image.exif.GPSLatitudeRef)
            : '';
        const lng = image.exif.GPSLongitude
            ? formatGPS(image.exif.GPSLongitude, image.exif.GPSLongitudeRef)
            : '';
        const gpsText = [lat, lng].filter(Boolean).join(' / '); // '/'로 구분, 빈 값 제거
        if (gpsText) {
            rightColumn.push({ text: gpsText, style: 'normal' });
        }
    }

    // 표시할 내용 없으면 종료 (기본 stage 반환)
    if (leftColumn.length === 0 && rightColumn.length === 0) {
        const stage = new Konva.Stage({
            container: document.createElement('div'),
            width: w,
            height: h,
        });
        const layer = new Konva.Layer();
        stage.add(layer);
        layer.add(
            new Konva.Image({ image: img, x: 0, y: 0, width: w, height: h })
        );
        layer.batchDraw();
        return stage;
    }

    // --- 4. 동적 폰트 크기 및 스탬프 높이 계산 ---
    // 이미지 크기에 따라 폰트 크기 조정 (기존보다 크게, 최대 한도 상향)
    let fontSize = Math.max(16, Math.min(w * 0.032, baseFontSize * 5));
    fontSize = Math.round(fontSize);
    // 줄 간격은 폰트 크기에 비례 (1.4 배율 사용)
    const lineHeight = fontSize * 1.4;

    const maxLines = Math.max(leftColumn.length, rightColumn.length);

    // 세로 패딩은 폰트 크기의 60%
    const paddingVert = Math.round(fontSize * 0.6);
    // 스탬프 높이 계산
    const stampHeight = paddingVert * 2 + maxLines * lineHeight;

    const isTop = settings.position.includes('top');

    // 스테이지 크기 결정 (외부 배치 시 확장)
    let stageHeight = h;
    let imageY = 0;
    let stampY = 0;

    if (isOutside) {
        // 외부 배치는 스테이지를 확장함
        stageHeight = h + stampHeight;

        if (isTop) {
            // 외부-상단: 스탬프가 위, 이미지가 아래
            stampY = 0;
            imageY = stampHeight;
        } else {
            // 외부-하단: 이미지가 위, 스탬프가 아래
            stampY = h;
            imageY = 0;
        }
    } else {
        // 내부 배치는 이미지 위에 오버레이
        stampY = isTop ? 0 : h - stampHeight;
    }

    // 스테이지 생성 (외부 배치 시 확장된 높이로)
    const stage = new Konva.Stage({
        container: document.createElement('div'),
        width: w,
        height: stageHeight,
    });

    const layer = new Konva.Layer();
    stage.add(layer);

    // 이미지 추가 (외부-상단인 경우 이미지가 아래로)
    layer.add(
        new Konva.Image({
            image: img,
            x: 0,
            y: imageY,
            width: w,
            height: h,
        })
    );
    // --- 5. 스탬프 배경 그리기 ---
    const background = new Konva.Rect({
        x: 0,
        y: stampY,
        width: w,
        height: stampHeight,
        fill: isOutside ? 'rgba(0, 0, 0, 0.85)' : backgroundColor, // 외부 배치시 더 어두운 배경
        shadowColor: isOutside ? '#000000' : undefined,
        shadowBlur: isOutside ? 3 : 0,
        shadowOpacity: isOutside ? 0.3 : 0,
    });
    layer.add(background);

    // --- 6. 텍스트 요소 추가 ---
    // 텍스트 Y 위치 계산 함수 (라인 내 세로 중앙 정렬 개선)
    const textY = (index: number) =>
        stampY +
        paddingVert +
        index * lineHeight +
        lineHeight / 2 -
        fontSize / 2;

    // 왼쪽 열 텍스트
    leftColumn.forEach((item, index) => {
        layer.add(
            new Konva.Text({
                x: basePadding, // 가로 패딩 적용 (왼쪽 정렬)
                y: textY(index), // 계산된 Y 위치
                text: item.text,
                fontSize: fontSize, // 커진 폰트 크기 적용
                fontFamily: fontFamily,
                fontStyle: item.style, // 지정된 스타일 (bold)
                fill: textColor,
                letterSpacing: 0.2,
                height: lineHeight, // 명시적으로 높이 지정 (Konva 정렬 도움)
                verticalAlign: 'middle', // Konva Text 객체 내에서 세로 중앙 정렬
            })
        );
    });

    // 오른쪽 열 텍스트
    rightColumn.forEach((item, index) => {
        const textWidth = measureTextWidth(
            item.text,
            fontSize,
            fontFamily,
            item.style
        );
        layer.add(
            new Konva.Text({
                x: w - textWidth - basePadding, // 가로 패딩 적용 (오른쪽 정렬)
                y: textY(index), // 계산된 Y 위치
                text: item.text,
                fontSize: fontSize, // 커진 폰트 크기 적용
                fontFamily: fontFamily,
                fontStyle: item.style, // 지정된 스타일 (normal)
                fill: textColor,
                letterSpacing: 0.2,
                height: lineHeight, // 명시적으로 높이 지정
                verticalAlign: 'middle', // Konva Text 객체 내에서 세로 중앙 정렬
            })
        );
    });

    // --- 7. 중앙 구분선 추가 (선택적, 양쪽에 내용이 있을 때만) ---
    if (w > 400 && leftColumn.length > 0 && rightColumn.length > 0) {
        // 너비가 충분하고 양쪽에 내용이 있을 때
        const separatorX = w / 2;
        // 구분선 높이를 텍스트 영역 높이에 맞춤 (stampHeight - paddingVert * 2 = maxLines * lineHeight)
        const separatorHeight = maxLines * lineHeight * 0.8; // 텍스트 높이의 80% 정도
        const separatorY =
            stampY +
            paddingVert +
            (maxLines * lineHeight - separatorHeight) / 2; // 세로 중앙 정렬

        layer.add(
            new Konva.Line({
                points: [
                    separatorX,
                    separatorY,
                    separatorX,
                    separatorY + separatorHeight,
                ],
                stroke: separatorColor, // 연한 구분선 색상
                strokeWidth: 1, // 얇은 선
            })
        );
    }

    // --- 8. 상단/하단 구분선 추가 (미세하게) ---
    layer.add(
        new Konva.Line({
            points: [
                0,
                isOutside
                    ? isTop
                        ? stampHeight - 0.5
                        : stampY + 0.5 // 외부 위치
                    : isTop
                      ? stampHeight - 0.5
                      : stampY + 0.5, // 내부 위치
                w,
                isOutside
                    ? isTop
                        ? stampHeight - 0.5
                        : stampY + 0.5 // 외부 위치
                    : isTop
                      ? stampHeight - 0.5
                      : stampY + 0.5, // 내부 위치
            ],
            stroke: separatorColor, // 연한 구분선 색상
            strokeWidth: 1, // 얇은 선
            opacity: 0.5, // 약간의 투명도 추가
        })
    );

    layer.batchDraw(); // 성능을 위해 마지막에 한 번만 그림
    return stage;
};

// Function to render EXIF stamped image to a canvas context - 이전과 동일 (내부적으로 업데이트된 create 사용)
export const renderExifStampedImage = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    image: ImageType,
    settings: ExifStampSettings,
    canvas: HTMLCanvasElement
): void => {
    const minWidth = 400; // 최소 너비 설정 (선택 사항)
    let targetWidth = canvas.width;
    let targetHeight = canvas.height;

    // 원본 canvas 크기가 작을 경우 비율 유지하며 확대 (렌더링 품질 위해)
    if (canvas.width < minWidth && img.width > 0) {
        const scale = minWidth / canvas.width;
        targetWidth = minWidth;
        targetHeight = Math.round(canvas.height * scale);
        // 실제 canvas 크기 조정은 이 함수 호출 전에 하는 것이 좋을 수 있음
    }

    // 업데이트된 createExifStampedKonvaStage 사용 (target 크기로 생성)
    const stage = createExifStampedKonvaStage(
        img,
        image,
        settings,
        targetWidth,
        targetHeight
    );

    // Konva Stage를 주어진 Canvas에 그리기
    stage.toCanvas({
        callback: (konvaCanvas: HTMLCanvasElement) => {
            if (ctx) {
                // ctx 유효성 검사
                ctx.clearRect(0, 0, canvas.width, canvas.height); // 그리기 전 클리어
                // 생성된 konvaCanvas(targetWidth/Height)를 원본 canvas 크기에 맞게 그림
                ctx.drawImage(
                    konvaCanvas,
                    0,
                    0,
                    konvaCanvas.width,
                    konvaCanvas.height,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );
            } else {
                console.error('Canvas rendering context is not available.');
            }
        },
        mimeType: 'image/png', // 필요시 이미지 형식 지정
    });
};

// Function to get a data URL from the Konva stage - 이전과 동일 (내부적으로 업데이트된 create 사용)
export const getExifStampedImageDataURL = (
    img: HTMLImageElement,
    image: ImageType,
    settings: ExifStampSettings,
    width: number = img.width, // 기본값은 원본 이미지 크기
    height: number = img.height
): Promise<string> => {
    // 비동기 처리를 위해 Promise 반환
    // 업데이트된 createExifStampedKonvaStage 사용
    const stage = createExifStampedKonvaStage(
        img,
        image,
        settings,
        width,
        height
    );

    return new Promise((resolve) => {
        // toDataURL은 비동기일 수 있으므로 Promise 사용
        resolve(stage.toDataURL({ mimeType: 'image/png' })); // 필요시 형식 및 품질 지정
    });
};
