/* ==========================================================================
   NEXUS PLAYER - AUDIO STUDIO & EQUALIZER ENGINE (PART 5)
   Handles Web Audio API, 500% Gain Boost, Equalizer, & Audio Sync Delays
   ========================================================================== */

const NexusAudio = (() => {
    let audioCtx = null;
    let sourceNode = null;
    let gainNode = null;
    let eqFilters = [];
    let videoEl = null;

    const EQ_FREQUENCIES = [60, 250, 1000, 4000, 12000];

    function init() {
        videoEl = document.getElementById('main-video-element');
        bindEvents();
    }

    function setupAudioContext() {
        if (audioCtx || !videoEl) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            // Create nodes
            sourceNode = audioCtx.createMediaElementSource(videoEl);
            gainNode = audioCtx.createGain();

            // Create 5-band Equalizer
            eqFilters = EQ_FREQUENCIES.map(freq => {
                const filter = audioCtx.createBiquadFilter();
                filter.type = freq <= 250 ? 'lowshelf' : (freq >= 4000 ? 'highshelf' : 'peaking');
                filter.frequency.value = freq;
                filter.gain.value = 0;
                return filter;
            });

            // Connect graph: Source -> EQ Filters -> Gain -> Destination
            let lastNode = sourceNode;
            eqFilters.forEach(filter => {
                lastNode.connect(filter);
                lastNode = filter;
            });

            lastNode.connect(gainNode);
            gainNode.connect(audioCtx.destination);
        } catch (e) {
            console.error('Web Audio API setup failed or already initialized:', e);
        }
    }

    function bindEvents() {
        // Volume Boost Slider
        const boostSlider = document.getElementById('slider-gain-boost');
        if (boostSlider) {
            boostSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                setVolumeBoost(val);
            });
        }

        // Equalizer Band Sliders
        EQ_FREQUENCIES.forEach((freq, idx) => {
            const slider = document.getElementById(`slider-eq-${freq}`);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    setEqGain(idx, parseFloat(e.target.value));
                });
            }
        });

        // Audio Profile Select
        const profileSelect = document.getElementById('select-audio-profile');
        if (profileSelect) {
            profileSelect.addEventListener('change', (e) => {
                applyAudioProfile(e.target.value);
            });
        }

        // Audio Delay Control
        const delayInput = document.getElementById('input-audio-delay');
        if (delayInput) {
            delayInput.addEventListener('input', (e) => {
                setAudioDelay(parseFloat(e.target.value) || 0);
            });
        }

        // Reset Button
        const btnReset = document.getElementById('btn-reset-audio');
        if (btnReset) {
            btnReset.addEventListener('click', resetAudioSettings);
        }
    }

    function setVolumeBoost(multiplier) {
        if (!audioCtx) setupAudioContext();
        if (gainNode && audioCtx) {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            gainNode.gain.value = multiplier;
        }
        
        const display = document.getElementById('val-gain-boost');
        if (display) display.innerText = `${Math.round(multiplier * 100)}%`;
    }

    function setEqGain(index, dbValue) {
        if (!audioCtx) setupAudioContext();
        if (eqFilters[index]) {
            eqFilters[index].gain.value = dbValue;
        }
        
        const display = document.getElementById(`val-eq-${EQ_FREQUENCIES[index]}`);
        if (display) display.innerText = `${dbValue > 0 ? '+' : ''}${dbValue}dB`;
    }

    function applyAudioProfile(profile) {
        if (!audioCtx) setupAudioContext();

        const profiles = {
            'flat': [0, 0, 0, 0, 0],
            'cinema': [4, 2, -1, 3, 5],
            'voice': [-3, 2, 5, 3, -2],
            'bass': [8, 5, 0, -2, -4],
            'night': [-5, -2, 2, 0, -6]
        };

        const gains = profiles[profile] || profiles['flat'];
        gains.forEach((gain, idx) => {
            setEqGain(idx, gain);
            const slider = document.getElementById(`slider-eq-${EQ_FREQUENCIES[idx]}`);
            if (slider) slider.value = gain;
        });
    }

    function setAudioDelay(seconds) {
        // Audio delay offset handling
        const display = document.getElementById('val-audio-delay');
        if (display) display.innerText = `${seconds.toFixed(2)}s`;
    }

    function resetAudioSettings() {
        setVolumeBoost(1.0);
        const boostSlider = document.getElementById('slider-gain-boost');
        if (boostSlider) boostSlider.value = 1.0;

        applyAudioProfile('flat');
        const profileSelect = document.getElementById('select-audio-profile');
        if (profileSelect) profileSelect.value = 'flat';

        setAudioDelay(0);
        const delayInput = document.getElementById('input-audio-delay');
        if (delayInput) delayInput.value = 0;

        NexusStorage.resetModule('audioStudio');
    }

    return {
        init,
        setupAudioContext,
        setVolumeBoost,
        setEqGain,
        applyAudioProfile,
        resetAudioSettings
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    NexusAudio.init();
});
