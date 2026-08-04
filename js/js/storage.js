/* ==========================================================================
   NEXUS PLAYER - STORAGE & SETTINGS MANAGER (PART 3)
   Handles LocalStorage Persistence, Player Profiles, & Playback History
   ========================================================================== */

const NexusStorage = (() => {
    const STORAGE_KEY_SETTINGS = 'nexus_player_settings';
    const STORAGE_KEY_HISTORY = 'nexus_player_history';
    const STORAGE_KEY_PLAYLISTS = 'nexus_player_playlists';

    const defaultSettings = {
        theme: 'dark-neon',
        volume: 1.0,
        muted: false,
        videoLab: { brightness: 100, contrast: 100, saturation: 100, hue: 0 },
        audioStudio: { boost: 1.0, profile: 'flat', delay: 0 },
        userAgent: '',
        referer: ''
    };

    function getSettings() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_SETTINGS);
            return data ? { ...defaultSettings, ...JSON.parse(data) } : defaultSettings;
        } catch (e) {
            console.error('Error reading settings from LocalStorage:', e);
            return defaultSettings;
        }
    }

    function saveSettings(newSettings) {
        try {
            const current = getSettings();
            const updated = { ...current, ...newSettings };
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
            return updated;
        } catch (e) {
            console.error('Error saving settings to LocalStorage:', e);
            return null;
        }
    }

    function addToHistory(item) {
        try {
            let history = getHistory();
            history = history.filter(h => h.url !== item.url); // Remove duplicates
            history.unshift({
                title: item.title || 'Untitled Stream',
                url: item.url,
                timestamp: new Date().toISOString(),
                type: item.type || 'direct'
            });
            if (history.length > 50) history.pop(); // Keep last 50 items
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('Error updating history:', e);
        }
    }

    function getHistory() {
        try {
            const data = localStorage.getItem(STORAGE_KEY_HISTORY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            return [];
        }
    }

    function clearHistory() {
        localStorage.removeItem(STORAGE_KEY_HISTORY);
    }

    function resetModule(moduleName) {
        const settings = getSettings();
        if (moduleName && settings[moduleName]) {
            settings[moduleName] = defaultSettings[moduleName];
            saveSettings(settings);
        }
    }

    return {
        getSettings,
        saveSettings,
        addToHistory,
        getHistory,
        clearHistory,
        resetModule
    };
})();

// Attach globally
window.NexusStorage = NexusStorage;
