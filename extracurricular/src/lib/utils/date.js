export function formatIsoDate(value, fallback = 'Unknown') {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toISOString().slice(0, 10);
}

export function formatIsoDateTime(value, fallback = 'Unknown') {
    if (!value) return fallback;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return date.toISOString().replace('T', ' ').slice(0, 16);
}

export default formatIsoDate;
