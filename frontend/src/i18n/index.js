import sq from '../locales/sq.json'

const LOCALES = {
    sq,
}

let current = 'sq'

export function setLocale(locale) {
    if (LOCALES[locale]) current = locale
}

export function t(key, fallback = '') {
    const parts = key.split('.')
    let node = LOCALES[current]

    for (const p of parts) {
        if (!node) return fallback || key
        node = node[p]
    }

    return node ?? fallback ?? key
}

export default { t, setLocale }
