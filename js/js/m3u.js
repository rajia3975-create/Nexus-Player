/* ==========================================================================
   NEXUS PLAYER - M3U & XTREAM PARSER ENGINE (PART 6)
   Handles M3U/M3U8 Parsing, Xtream Codes API, and Playlist Categorization
   ========================================================================== */

const NexusM3U = (() => {
    let rawPlaylist = [];
    let categories = new Set();
    let activeCategory = 'All';

    function init() {
        bindEvents();
    }

    function bindEvents() {
        // Modal / Load Buttons
        const btnLoadM3U = document.getElementById('btn-load-m3u-modal');
        if (btnLoadM3U) {
            btnLoadM3U.addEventListener('click', openM3UModal);
        }

        const btnParseUrl = document.getElementById('btn-parse-m3u-url');
        if (btnParseUrl) {
            btnParseUrl.addEventListener('click', () => {
                const url = document.getElementById('input-m3u-url').value.trim();
                if (url) loadPlaylistFromUrl(url);
            });
        }

        // Category Filter Select
        const categorySelect = document.getElementById('select-category-filter');
        if (categorySelect) {
            categorySelect.addEventListener('change', (e) => {
                filterByCategory(e.target.value);
            });
        }

        // Live Channel Search
        const searchInput = document.getElementById('input-channel-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchChannels(e.target.value.toLowerCase());
            });
        }
    }

    function openM3UModal() {
        const modal = document.getElementById('modal-m3u-loader');
        if (modal) modal.classList.remove('hidden');
    }

    async function loadPlaylistFromUrl(url) {
        try {
            showLoadingState(true);
            const response = await fetch(url);
            if (!response.ok) throw new Error('Network response was not ok');
            const text = await response.text();
            parseM3UText(text);
            
            // Save to history/storage
            NexusStorage.addToHistory({ title: 'M3U Playlist', url: url, type: 'playlist' });
            
            closeModal();
        } catch (error) {
            console.error('Failed to parse M3U from URL:', error);
            alert('Failed to load playlist URL. Please check CORS or link validity.');
        } finally {
            showLoadingState(false);
        }
    }

    function parseM3UText(text) {
        rawPlaylist = [];
        categories.clear();
        categories.add('All');

        const lines = text.split('\n');
        let currentChannel = null;

        lines.forEach(line => {
            line = line.trim();
            if (line.startsWith('#EXTINF:')) {
                currentChannel = {};
                
                // Extract group-title
                const groupMatch = line.match(/group-title="([^"]+)"/i);
                currentChannel.group = groupMatch ? groupMatch[1] : 'Uncategorized';
                categories.add(currentChannel.group);

                // Extract tvg-logo
                const logoMatch = line.match(/tvg-logo="([^"]+)"/i);
                currentChannel.logo = logoMatch ? logoMatch[1] : '';

                // Extract Channel Name
                const commaIdx = line.lastIndexOf(',');
                currentChannel.name = commaIdx !== -1 ? line.substring(commaIdx + 1).trim() : 'Unnamed Channel';

            } else if (line.length > 0 && !line.startsWith('#')) {
                if (currentChannel) {
                    currentChannel.url = line;
                    rawPlaylist.push(currentChannel);
                    currentChannel = null;
                }
            }
        });

        populateCategoryDropdown();
        renderChannelList(rawPlaylist);
    }

    function populateCategoryDropdown() {
        const select = document.getElementById('select-category-filter');
        if (!select) return;

        select.innerHTML = '';
        categories.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat;
            opt.innerText = cat;
            select.appendChild(opt);
        });
    }

    function renderChannelList(channels) {
        const container = document.getElementById('playlist-channel-container');
        if (!container) return;

        container.innerHTML = '';

        if (channels.length === 0) {
            container.innerHTML = '<div class="empty-state">No channels found.</div>';
            return;
        }

        channels.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'channel-item-card';
            item.innerHTML = `
                ${channel.logo ? `<img src="${channel.logo}" class="channel-logo" loading="lazy" alt="" />` : '<div class="channel-icon-placeholder">📺</div>'}
                <div class="channel-info">
                    <div class="channel-title">${channel.name}</div>
                    <div class="channel-group">${channel.group}</div>
                </div>
            `;
            item.addEventListener('click', () => {
                if (window.NexusPlayerCore) {
                    window.NexusPlayerCore.loadStream(channel.url, channel.name);
                }
            });
            container.appendChild(item);
        });
    }

    function filterByCategory(category) {
        activeCategory = category;
        if (category === 'All') {
            renderChannelList(rawPlaylist);
        } else {
            const filtered = rawPlaylist.filter(c => c.group === category);
            renderChannelList(filtered);
        }
    }

    function searchChannels(query) {
        const filtered = rawPlaylist.filter(c => {
            const matchesCat = activeCategory === 'All' || c.group === activeCategory;
            const matchesQuery = c.name.toLowerCase().includes(query);
            return matchesCat && matchesQuery;
        });
        renderChannelList(filtered);
    }

    function closeModal() {
        const modal = document.getElementById('modal-m3u-loader');
        if (modal) modal.classList.add('hidden');
    }

    function showLoadingState(isLoading) {
        const btn = document.getElementById('btn-parse-m3u-url');
        if (btn) btn.innerText = isLoading ? 'Loading...' : 'Load Playlist';
    }

    return {
        init,
        parseM3UText,
        loadPlaylistFromUrl
    };
})();

document.addEventListener('DOMContentLoaded', () => {
    NexusM3U.init();
});
