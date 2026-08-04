/* ==========================================================================
   NEXUS PLAYER - CORE PLAYER ENGINE (PART 7)
   Handles Stream Decoding (HLS/Dash/Direct), UI Controls, & Fullscreen Mode
   ========================================================================== */

const NexusPlayerCore = (() => {
    let videoEl = null;
    let hlsInstance = null;
    let dashInstance = null;
    let currentStreamUrl = '';
    let isPlaying = false;

    function init() {
        videoEl = document.getElementById('main-video-element');
        if (!videoEl) return;

        bindEvents();
        bindKeyboardShortcuts();
    }

    function bindEvents() {
        // Play / Pause Toggle
        const btnPlayPause = document.getElementById('btn-play-pause');
        if (btnPlayPause) {
            btnPlayPause.addEventListener('click', togglePlay);
        }

        videoEl.addEventListener('click', togglePlay);

        // Updates UI on video events
        videoEl.addEventListener('play', () => updatePlayState(true));
        videoEl.addEventListener('pause', () => updatePlayState(false));
        videoEl.addEventListener('timeupdate', handleTimeUpdate);
        videoEl.addEventListener('loadedmetadata', handleMetadataLoaded);

        // Progress Bar Seeking
        const progressBar = document.getElementById('player-progress-bar');
        if (progressBar) {
            progressBar.addEventListener('input', (e) => {
                const seekTime = (e.target.value / 100) * videoEl.duration;
                if (!isNaN(seekTime)) videoEl.currentTime = seekTime;
            });
        }

        // Master Volume Control
        const volumeSlider = document.getElementById('slider-master-volume');
        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                videoEl.volume = parseFloat(e.target.value);
            });
        }

        // Fullscreen Toggle
        const btnFullscreen = document.getElementById('btn-fullscreen');
        if (btnFullscreen) {
            btnFullscreen.addEventListener('click', toggleFullscreen);
        }

        // Picture-in-Picture Mode
        const btnPip = document.getElementById('btn-pip');
        if (btnPip) {
            btnPip.addEventListener('click', togglePip);
        }

        // Direct Stream Loader Input
        const btnLoadStream = document.getElementById('btn-load-direct-stream');
        if (btnLoadStream) {
            btnLoadStream.addEventListener('click', () => {
                const url = document.getElementById('input-direct-stream-url')?.value.trim();
                if (url) loadStream(url, 'Direct Stream');
            });
        }
    }

    function bindKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Avoid triggering shortcuts when typing in input boxes
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

            switch (e.code) {
                case 'Space':
                case 'KeyK':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'KeyF':
                    e.preventDefault();
                    toggleFullscreen();
                    break;
                case 'KeyM':
                    e.preventDefault();
                    videoEl.muted = !videoEl.muted;
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    videoEl.currentTime = Math.max(0, videoEl.currentTime - 5);
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    videoEl.currentTime = Math.min(videoEl.duration, videoEl.currentTime + 5);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    videoEl.volume = Math.min(1, videoEl.volume + 0.1);
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    videoEl.volume = Math.max(0, videoEl.volume - 0.1);
                    break;
            }
        });
    }

    function loadStream(url, title = 'Live Stream') {
        currentStreamUrl = url;
        resetDecoders();

        // Update Title Display
        const titleDisplay = document.getElementById('player-stream-title');
        if (titleDisplay) titleDisplay.innerText = title;

        // Check format extension or type
        if (url.includes('.m3u8') || url.includes('hls')) {
            loadHlsStream(url);
        } else if (url.includes('.mpd')) {
            loadDashStream(url);
        } else {
            // Fallback Native Video Playback
            videoEl.src = url;
            videoEl.play().catch(e => console.warn('Autoplay prevented:', e));
        }

        // Add stream to history
        if (window.NexusStorage) {
            NexusStorage.addToHistory({ title, url, type: 'stream' });
        }
    }

    function loadHlsStream(url) {
        if (Hls.isSupported()) {
            hlsInstance = new Hls({
                enableWorker: true,
                lowLatencyMode: true
            });
            hlsInstance.loadSource(url);
            hlsInstance.attachMedia(videoEl);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
                videoEl.play().catch(e => console.warn('Autoplay prevented:', e));
            });
        } else if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            // Safari / Native HLS Support
            videoEl.src = url;
            videoEl.play().catch(e => console.warn('Autoplay prevented:', e));
        }
    }

    function loadDashStream(url) {
        if (typeof dashjs !== 'undefined') {
            dashInstance = dashjs.MediaPlayer().create();
            dashInstance.initialize(videoEl, url, true);
        }
    }

    function resetDecoders() {
        if (hlsInstance) {
            hlsInstance.destroy();
            hlsInstance = null;
        }
        if (dashInstance) {
            dashInstance.reset();
            dashInstance = null;
        }
        videoEl.removeAttribute('src');
        videoEl.load();
    }

    function togglePlay() {
        if (!videoEl.src && !hlsInstance && !dashInstance) return;

        if (videoEl.paused) {
            videoEl.play();
        } else {
            videoEl.pause();
        }
    }

    function updatePlayState(playing) {
        isPlaying = playing;
        const btnPlayPause = document.getElementById('btn-play-pause');
        if (btnPlayPause) {
            btnPlayPause.innerText = isPlaying ? '⏸' : '▶';
        }
    }

    function handleTimeUpdate() {
        if (!videoEl.duration) return;

        const progress = (videoEl.currentTime / videoEl.duration) * 100;
        const progressBar = document.getElementById('player-progress-bar');
        if (progressBar) progressBar.value = progress;

        const timeDisplay = document.getElementById('player-time-display');
        if (timeDisplay) {
            timeDisplay.innerText = `${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`;
        }
    }

    function handleMetadataLoaded() {
        handleTimeUpdate();
    }

    function formatTime(seconds) {
        if (isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    function toggleFullscreen() {
        const playerContainer = document.getElementById('nexus-player-container');
        if (!playerContainer) return;

        if (!document.fullscreenElement) {
            playerContainer.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    }

    async function togglePip() {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled && videoEl) {
                await videoEl.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Picture-in-Picture failed:', error);
        }
    }

    return {
        init,
        loadStream,
        togglePlay,
        toggleFullscreen
    };
})();

// Assign to global window object
window.NexusPlayerCore = NexusPlayerCore;

document.addEventListener('DOMContentLoaded', () => {
    NexusPlayerCore.init();
});
