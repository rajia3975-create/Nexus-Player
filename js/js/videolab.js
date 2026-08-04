/* ==========================================================================
   NEXUS PLAYER - VIDEO LAB & COLOR GRADING ENGINE (PART 4)
   Handles Canvas Filters, Color Grading, Movie Profiles, & Upscaling
   ========================================================================== */

const NexusVideoLab = (() => {
    let videoEl = null;
    let canvasEl = null;
    let ctx = null;

    // Preset Movie Color Look Database
    const moviePresets = {
        'matrix': { brightness: 95, contrast: 110, saturation: 85, hue: 120, gamma: 1.1, temperature: -20 },
        'blade runner 2049': { brightness: 105, contrast: 125, saturation: 130, hue: 35, gamma: 0.9, temperature: 15 },
        'mad max': { brightness: 110, contrast: 135, saturation: 140, hue: 15, gamma: 1.0, temperature: 40 },
        'oppenheimer': { brightness: 100, contrast: 120, saturation: 70, hue: 0, gamma: 1.0, temperature: -10 },
        'batman': { brightness: 85, contrast: 140, saturation: 60, hue: 200, gamma: 0.8, temperature: -30 },
        'godfather': { brightness: 90, contrast: 115, saturation: 80, hue: 25, gamma: 1.1, temperature: 25 }
    };

    function init() {
        videoEl = document.getElementById('main-video-element');
        canvasEl = document.getElementById('video-processing-canvas');
        if (canvasEl) ctx = canvasEl.getContext('2d');
        
        bindEvents();
    }

    function bindEvents() {
        // Slider controls
        const sliders = ['brightness', 'contrast', 'saturation', 'hue', 'gamma', 'temperature'];
        sliders.forEach(param => {
            const el = document.getElementById(`slider-${param}`);
            if (el) {
                el.addEventListener('input', (e) => {
                    updateValDisplay(param, e.target.value);
                    applyVideoFilters();
                });
            }
        });

        // Movie Preset Search
        const btnApplyMovie = document.getElementById('btn-apply-movie-grade');
        if (btnApplyMovie) {
            btnApplyMovie.addEventListener('click', () => {
                const query = document.getElementById('movie-grade-search-input').value.toLowerCase().trim();
                applyMoviePreset(query);
            });
        }

        // Custom Aspect Ratio
        const btnApplyAspect = document.getElementById('btn-apply-custom-aspect');
        if (btnApplyAspect) {
            btnApplyAspect.addEventListener('click', () => {
                const ratioStr = document.getElementById('custom-aspect-ratio-input').value.trim();
                applyCustomAspectRatio(ratioStr);
            });
        }

        // Reset Button
        const btnReset = document.getElementById('btn-reset-videolab');
        if (btnReset) {
            btnReset.addEventListener('click', resetVideoLab);
        }
    }

    function updateValDisplay(param, val) {
        const display = document.getElementById(`val-${param}`);
        if (!display) return;
        if (param === 'hue') display.innerText = `${val}°`;
        else if (param === 'brightness' || param === 'contrast' || param === 'saturation') display.innerText = `${val}%`;
        else display.innerText = val;
    }

    function applyVideoFilters() {
        if (!videoEl) return;
        
        const b = document.getElementById('slider-brightness')?.value || 100;
        const c = document.getElementById('slider-contrast')?.value || 100;
        const s = document.getElementById('slider-saturation')?.value || 100;
        const h = document.getElementById('slider-hue')?.value || 0;

        // Apply CSS Filter directly to Video Node
        videoEl.style.filter = `brightness(${b}%) contrast(${c}%) saturate(${s}%) hue-rotate(${h}deg)`;
        
        // Save state to Storage
        NexusStorage.saveSettings({
            videoLab: { brightness: b, contrast: c, saturation: s, hue: h }
        });
    }

    function applyMoviePreset(query) {
        let preset = null;
        for (let key in moviePresets) {
            if (query.includes(key)) {
                preset = moviePresets[key];
                break;
            }
        }

        if (!preset) {
            // Default cinematic look if movie is not found directly
            preset = { brightness: 100, contrast: 120, saturation: 110, hue: 10, gamma: 1.0, temperature: 5 };
        }

        // Set Slider Values
        setSlider('brightness', preset.brightness);
        setSlider('contrast', preset.contrast);
        setSlider('saturation', preset.saturation);
        setSlider('hue', preset.hue);
        setSlider('gamma', preset.gamma);
        setSlider('temperature', preset.temperature);

        applyVideoFilters();
    }

    function setSlider(id, value) {
        const el = document.getElementById(`slider-${id}`);
        if (el) {
            el.value = value;
            updateValDisplay(id, value);
        }
    }

    function applyCustomAspectRatio(ratioStr) {
        if (!videoEl || !ratioStr) return;
        if (ratioStr.includes(':')) {
            const parts = ratioStr.split(':');
            const ratio = parseFloat(parts[0]) / parseFloat(parts[1]);
            if (!isNaN(ratio)) {
                videoEl.style.aspectRatio = `${parts[0]} / ${parts[1]}`;
                videoEl.style.objectFit = 'fill';
            }
        } else if (ratioStr === 'fit') {
            videoEl.style.aspectRatio = 'auto';
            videoEl.style.objectFit = 'contain';
        }
    }

    function resetVideoLab() {
        setSlider('brightness', 100);
        setSlider('contrast', 100);
        setSlider('saturation', 100);
        setSlider('hue', 0);
        setSlider('gamma', 1.0);
        setSlider('temperature', 0);
        
        if (videoEl) {
            videoEl.style.filter = 'none';
            videoEl.style.aspectRatio = 'auto';
            videoEl.style.objectFit = 'contain';
        }

        NexusStorage.resetModule('videoLab');
    }

    return {
        init,
        applyVideoFilters,
        applyMoviePreset,
        resetVideoLab
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    NexusVideoLab.init();
});
