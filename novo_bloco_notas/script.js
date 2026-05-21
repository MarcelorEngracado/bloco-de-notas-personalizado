const STORAGE_KEY = 'minhaNota';
const THEME_KEY = 'blocoDeNotasTema';

function getLocalStorage() {
    try {
        const testKey = '__bloco_de_notas_teste__';
        window.localStorage.setItem(testKey, testKey);
        window.localStorage.removeItem(testKey);
        return window.localStorage;
    } catch (error) {
        console.warn('localStorage não disponível:', error);
        return null;
    }
}

function debounce(callback, delay = 250) {
    let timeoutId = null;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = window.setTimeout(() => callback(...args), delay);
    };
}

function formatCount(value, label) {
    return `${value} ${label}${value === 1 ? '' : 's'}`;
}

function updateCounters(text) {
    const wordCountElement = document.getElementById('wordCount');
    const charCountElement = document.getElementById('charCount');
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const chars = text.length;

    if (wordCountElement) {
        wordCountElement.textContent = formatCount(words, 'palavra');
    }

    if (charCountElement) {
        charCountElement.textContent = formatCount(chars, 'caractere');
    }
}

function updateStatus(message, type = 'info') {
    const statusText = document.getElementById('statusText');
    if (!statusText) {
        return;
    }

    statusText.textContent = message;
    statusText.style.color = type === 'error' ? 'var(--danger)' : 'var(--muted)';
}

function loadSavedNote(textarea, storage) {
    if (!storage) {
        updateStatus('localStorage indisponível. As notas não serão salvas.');
        return;
    }

    const savedNote = storage.getItem(STORAGE_KEY);
    if (savedNote) {
        textarea.value = savedNote;
    }

    updateCounters(textarea.value);
    updateStatus('Nota carregada. Tudo pronto para escrever.');
}

function saveNoteValue(storage, value) {
    if (!storage) {
        return;
    }

    storage.setItem(STORAGE_KEY, value);
    updateStatus('Notas salvas automaticamente.');
}

function manualSave(storage, textarea) {
    if (!storage) {
        updateStatus('Não foi possível salvar. localStorage indisponível.', 'error');
        return;
    }

    storage.setItem(STORAGE_KEY, textarea.value);
    updateStatus('Nota salva manualmente.');
}

function exportNote(text) {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'minha_nota.txt';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    updateStatus('Arquivo exportado com sucesso.');
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        updateStatus('Texto copiado para a área de transferência.');
    } catch (error) {
        updateStatus('Não foi possível copiar o texto.', 'error');
        console.error(error);
    }
}

function clearNote(textarea, storage) {
    textarea.value = '';
    updateCounters('');
    if (storage) {
        storage.removeItem(STORAGE_KEY);
    }
    updateStatus('Nota limpa. Comece de novo quando quiser.');
}

function applyTheme(theme) {
    const html = document.documentElement;
    const button = document.getElementById('themeToggle');
    if (theme === 'dark') {
        html.classList.add('dark');
        if (button) button.textContent = 'Modo Claro';
    } else {
        html.classList.remove('dark');
        if (button) button.textContent = 'Modo Noturno';
    }
}

function loadTheme(storage) {
    const preferred = storage ? storage.getItem(THEME_KEY) : null;
    if (preferred) {
        applyTheme(preferred);
        return preferred;
    }

    const isDarkPreferred = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(isDarkPreferred ? 'dark' : 'light');
    return isDarkPreferred ? 'dark' : 'light';
}

function toggleTheme(storage) {
    const isDark = document.documentElement.classList.contains('dark');
    const nextTheme = isDark ? 'light' : 'dark';
    applyTheme(nextTheme);

    if (storage) {
        storage.setItem(THEME_KEY, nextTheme);
    }
}

function init() {
    const textarea = document.getElementById('blocoDeNotas');
    const saveButton = document.getElementById('saveButton');
    const copyButton = document.getElementById('copyButton');
    const exportButton = document.getElementById('exportButton');
    const clearButton = document.getElementById('clearButton');
    const themeToggle = document.getElementById('themeToggle');

    if (!textarea) {
        return;
    }

    const storage = getLocalStorage();
    const currentTheme = loadTheme(storage);
    applyTheme(currentTheme);
    loadSavedNote(textarea, storage);

    const debouncedSave = debounce((event) => {
        const value = event.target.value;
        updateCounters(value);
        saveNoteValue(storage, value);
    }, 220);

    textarea.addEventListener('input', debouncedSave);

    if (saveButton) {
        saveButton.addEventListener('click', () => manualSave(storage, textarea));
    }

    if (copyButton) {
        copyButton.addEventListener('click', () => copyToClipboard(textarea.value));
    }

    if (exportButton) {
        exportButton.addEventListener('click', () => exportNote(textarea.value));
    }

    if (clearButton) {
        clearButton.addEventListener('click', () => clearNote(textarea, storage));
    }

    if (themeToggle) {
        themeToggle.addEventListener('click', () => toggleTheme(storage));
    }
}

document.addEventListener('DOMContentLoaded', init);