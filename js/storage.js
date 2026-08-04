/* ==========================================================================
   NEXUS PLAYER - STORAGE & PERSISTENCE ENGINE (PART 3)
   Handles IndexedDB, LocalStorage, Watch History, and System Resets
   ========================================================================== */

const NexusStorage = (() => {
    const STORAGE_KEY_SETTINGS = 'nexus_player_settings';
    const STORAGE_KEY_HISTORY = 'nexus_watch_history';
    const STORAGE_KEY_FAVORITES = 'nexus_favorites';
    const STORAGE_KEY_PRESETS = 'nexus_color_presets';

    // Factory Default Settings
    const defaultSettings = {
        theme: 'amoled',
        userAgent: '',
        referer: '',
        aspectRatio: 'fit',
        customAspectRatio: '',
        upscalerEnabled: false,
        upscaleSharpness: 25,
        videoLab: {
            brightness: 100,
            contrast: 100,
            saturation: 100,
            hue: 0,
            gamma: 1.0,
            temperature: 0
        },
        audioStudio: {
            profile: 'cinema',
            gainBoost: 1.0,
            delay: 0.0,
            eq: [0, 0, 0, 0, 0]
        },
        subtitles: {
            delay: 0.0,
            fontSize: 24,
            color: '#ffffff',
            bgOpacity: 0.5
        }
    };

    let currentSettings = { ...defaultSettings };

    // Initialize Storage
    function init() {
        loadSettings();
    }

    // Load Settings from LocalStorage
    function loadSettings() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
            if (saved) {
                currentSettings = JSON.parse(saved);
            } else {
                currentSettings = JSON.parse(JSON.stringify(defaultSettings));
            }
        } catch (e) {
            console.error('Error loading settings from localStorage:', e);
            currentSettings = JSON.parse(JSON.stringify(defaultSettings));
        }
        return currentSettings;
    }

    // Save Current Settings
    function saveSettings(newSettings) {
        try {
            currentSettings = { ...currentSettings, ...newSettings };
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(currentSettings));
        } catch (e) {
            console.error('Error saving settings to localStorage:', e);
        }
    }

    // Get Active Settings
    function getSettings() {
        return currentSettings;
    }

    // Reset Specific Settings Module
    function resetModule(moduleName) {
        if (defaultSettings[moduleName]) {
            currentSettings[moduleName] = JSON.parse(JSON.stringify(defaultSettings[moduleName]));
            saveSettings(currentSettings);
        }
        return currentSettings[moduleName];
    }

    // Reset All Settings Back to Factory Defaults
    function resetAllSettings() {
        currentSettings = JSON.parse(JSON.stringify(defaultSettings));
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(currentSettings));
        return currentSettings;
    }

    // Factory Reset (Clears All Cache, Playlists, History, and LocalStorage)
    function factoryReset() {
        try {
            localStorage.clear();
            currentSettings = JSON.parse(JSON.stringify(defaultSettings));
            window.location.reload();
        } catch (e) {
            console.error('Error performing factory reset:', e);
        }
    }

    // Watch History Management
    function addToHistory(item) {
        try {
            let history = JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
            history = history.filter(i => i.url !== item.url);
            history.unshift({ ...item, timestamp: Date.now() });
            if (history.length > 50) history.pop(); // Limit to 50 items
            localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
        } catch (e) {
            console.error('Error updating watch history:', e);
        }
    }

    function getHistory() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_HISTORY) || '[]');
        } catch (e) {
            return [];
        }
    }

    // Favorites Management
    function toggleFavorite(channel) {
        try {
            let favorites = JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) || '[]');
            const index = favorites.findIndex(f => f.name === channel.name || f.url === channel.url);
            if (index >= 0) {
                favorites.splice(index, 1);
            } else {
                favorites.push(channel);
            }
            localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
            return favorites;
        } catch (e) {
            console.error('Error updating favorites:', e);
            return [];
        }
    }

    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_FAVORITES) || '[]');
        } catch (e) {
            return [];
        }
    }

    // Public API Methods
    return {
        init,
        getSettings,
        saveSettings,
        resetModule,
        resetAllSettings,
        factoryReset,
        addToHistory,
        getHistory,
        toggleFavorite,
        getFavorites
    };
})();

// Auto-initialize Storage Module
document.addEventListener('DOMContentLoaded', () => {
    NexusStorage.init();
});
