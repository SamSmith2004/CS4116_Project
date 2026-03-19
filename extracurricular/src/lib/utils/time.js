export function formatTime(ts) {
    if (!ts) return '';
    let t = ts;
    if (typeof ts === 'string') {
        const parsed = Date.parse(ts);
        t = isNaN(parsed) ? Date.now() : parsed;
    }
    if (typeof ts === 'number') t = ts;
    const diff = Date.now() - t;
    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diff < minute) return 'Just now';
    if (diff < hour) return Math.floor(diff / minute) + 'm';
    if (diff < day) return Math.floor(diff / hour) + 'h';
    if (diff < 2 * day) return 'Yesterday';

    const d = new Date(t);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ' • ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default formatTime;
