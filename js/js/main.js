/* ==========================================================================
   NEXUS PLAYER - MAIN APPLICATION ORCHESTRATOR (PART 8)
   Handles UI Themes, Subtitle Engine, Modal Controllers, & Init Sequence
   ========================================================================== */

const NexusApp = (() => {
    function init() {
        bindThemeControls();
        bindModalControls();
        bindSubtitleControls();
        bindHeaderOptions();
        loadSavedTheme();
    }

    // Theme Switcher Logic
    function bindThemeControls() {
        const themeSelect = document.getElementById('select-app-theme');
        if (themeSelect) {
            themeSelect.addEventListener('change', (e) => {
                setTheme(e.target.value);
            });
        }
    }

    function setTheme(themeName) {
        document.body.setAttribute('data-theme', themeName);
        NexusStorage.saveSettings({ theme: themeName });
    }

    function loadSavedTheme() {
        const settings = NexusStorage.getSettings();
        if (settings && settings.theme) {
            setTheme(settings.theme);
            const themeSelect = document.getElementById('select-app-theme');
            if (themeSelect) themeSelect.value = settings.theme;
        }
    }

    // Subtitle Engine
    function bindSubtitleControls() {
        const subFileInput = document.getElementById('input-subtitle-file');
        if (subFileInput) {
            subFileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) loadSubtitleFile(file);
            });
        }

        const subDelayInput = document.getElementById('input-subtitle-delay');
        if (subDelayInput) {
            subDelayInput.addEventListener('input', (e) => {
                const delay = parseFloat(e.target.value) || 0;
                const display = document.getElementById('val-subtitle-delay');
                if (display) display.innerText = `${delay.toFixed(1)}s`;
            });
        }
    }

    function loadSubtitleFile(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const videoEl = document.getElementById('main-video-element');
            if (!videoEl) return;

            // Convert VTT/SRT text content to Track element
            const blob = new Blob([convertToVTT(content)], { type: 'text/vtt' });
            const url = URL.createObjectURL(blob);

            // Remove previous tracks
            const existingTracks = videoEl.querySelectorAll('track');
            existingTracks.forEach(t => t.remove());

            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.label = file.name;
            track.srclang = 'en';
            track.src = url;
            track.default = true;

            videoEl.appendChild(track);
            videoEl.textTracks[0].mode = 'showing';
        };
        reader.readAsText(file);
    }

    function convertToVTT(srtText) {
        let vtt = 'WEBVTT\n\n';
        vtt += srtText.replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, '$1.$2');
        return vtt;
    }

    // Modal & Dialog Controller
    function bindModalControls() {
        // Generic close modal buttons
        const closeBtns = document.querySelectorAll('.btn-close-modal');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const modal = btn.closest('.nexus-modal');
                if (modal) modal.classList.add('hidden');
            });
        });

        // Close on background overlay click
        const modals = document.querySelectorAll('.nexus-modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        });
    }

    // Header Options & User Agent Customization
    function bindHeaderOptions() {
        const uaInput = document.getElementById('input-custom-user-agent');
        const refInput = document.getElementById('input-custom-referer');
        const btnSaveHeaders = document.getElementById('btn-save-custom-headers');

        if (btnSaveHeaders) {
            btnSaveHeaders.addEventListener('click', () => {
                const userAgent = uaInput ? uaInput.value.trim() : '';
                const referer = refInput ? refInput.value.trim() : '';

                NexusStorage.saveSettings({ userAgent, referer });
                alert('Network headers saved successfully.');
            });
        }
    }

    return {
        init
    };
})();

// Initialize Application Core
document.addEventListener('DOMContentLoaded', () => {
    NexusApp.init();
});
