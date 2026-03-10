let toast = $state({ show: false, message: '', type: 'error' });
let toastTimeout;

export function showToast(message, type = 'error') {
    clearTimeout(toastTimeout);
    toast = { show: true, message, type };
    toastTimeout = setTimeout(() => {
        toast = { ...toast, show: false };
    }, 4000);
}

export function dismissToast() {
    toast = { ...toast, show: false };
}

export function getToast() {
    return toast;
}
