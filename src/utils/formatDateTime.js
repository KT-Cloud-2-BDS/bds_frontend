export const toKoreanTime = (utcDateStr) => {
    if (!utcDateStr) return '';
    const date = new Date(utcDateStr + 'Z');
    return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
};