export function calculateAge(dobValue) {
    if (!dobValue) return null;

    const dob = dobValue instanceof Date ? dobValue : new Date(dobValue);
    if (Number.isNaN(dob.getTime())) return null;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age -= 1;
    }

    return age;
}

export default calculateAge;