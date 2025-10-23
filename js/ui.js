export class UI {
  constructor() {
    this.soundCardsContainer = null;
    this.masterVolumeSlider = null;
    this.masterVolumeValue = null;
    this.playPauseButton = null;
    this.resetButton = null;
    this.modal = null;
    this.infoModal = null;
    this.customPresetsContainer = null;
    this.timerDisplay = null;
    this.timerSelect = null;
    this.themeToggle = null;
    this.infoButton = null;
    this.closeInfoButton = null;
  }

  init() {
    this.soundCardsContainer = document.querySelector('.grid');
    this.masterVolumeSlider = document.getElementById('masterVolume');
    this.masterVolumeValue = document.getElementById('masterVolumeValue');
    this.playPauseButton = document.getElementById('playPauseAll');
    this.resetButton = document.getElementById('resetAll');
    this.modal = document.getElementById('savePresetModal');
    this.infoModal = document.getElementById('infoModal');
    this.customPresetsContainer = document.getElementById('customPresets');
    this.timerDisplay = document.getElementById('timerDisplay');
    this.timerSelect = document.getElementById('timerSelect');
    this.themeToggle = document.getElementById('themeToggle');
    this.infoButton = document.getElementById('infoButton');
    this.closeInfoButton = document.getElementById('closeInfo');

    // Set up info modal handlers
    this.setupInfoModal();
  }

  // Create sound card HTML
  createSoundCard(sound) {
    const card = document.createElement('div');
    card.className =
      'sound-card bg-white/10 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden transition-all duration-300 border border-white/10 hover:border-primary-500/30';
    card.dataset.sound = sound.id;

    card.innerHTML = ` <div class="flex flex-col h-full">
      <!-- Sound Icon and Name -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="sound-icon-wrapper w-14 h-14 rounded-full bg-gradient-to-br ${sound.color} flex items-center justify-center shadow-lg transform transition-transform duration-300 hover:scale-110">
            <i class="fas ${sound.icon} sound-icon text-white text-2xl"></i>
          </div>
          <div>
            <h3 class="font-bold text-lg">${sound.name}</h3>
            <p class="text-xs opacity-70 text-white/60">${sound.description}</p>
          </div>
        </div>
        <button type="button" class="play-btn w-12 h-12 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 hover:from-primary-500/40 hover:to-accent-500/40 border border-white/20 hover:border-primary-500/50 transition-all duration-300 flex items-center justify-center group hover:scale-110 hover:shadow-glow-sm" data-sound="${sound.id}">
          <i class="fas fa-play text-base group-hover:scale-110 transition-transform duration-300"></i>
        </button>
      </div>

      <!-- Volume Control -->
      <div class="flex-1 flex flex-col justify-center">
        <div class="flex items-center space-x-3 mb-2">
          <i class="fas fa-volume-low opacity-50 text-sm"></i>
          <input type="range" class="volume-slider flex-1 cursor-pointer" min="0" max="100" value="0" data-sound="${sound.id}">
          <span class="volume-value text-sm font-mono w-8 text-right bg-white/10 px-2 py-1 rounded">0</span>
        </div>

        <!-- Volume Bar Visualization -->
        <div class="volume-bar">
          <div class="volume-bar-fill" style="width: 0%"></div>
        </div>

        <!-- Equalizer (hidden by default, shown when playing) -->
        <div class="equalizer hidden mt-3">
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
          <div class="equalizer-bar"></div>
        </div>
      </div>
    </div>`;

    return card;
  }

  // Create custom preset button
  createCustomPresetButton(name, presetId) {
    const button = document.createElement('button');
    button.className =
      'custom-preset-btn bg-white/10 hover:bg-gradient-to-r hover:from-primary-500/40 hover:to-accent-500/40 px-5 py-2.5 rounded-lg transition-all duration-300 border border-white/10 hover:border-primary-500/50 font-semibold transform hover:scale-105 hover:shadow-glow-sm relative group';
    button.dataset.preset = presetId;
    button.innerHTML = `  <i class="fas fa-star mr-2 text-yellow-400 group-hover:scale-110 transition-transform duration-300"></i>
    ${name}
    <button type="button" class="delete-preset absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center border-2 border-white shadow-lg" data-preset="${presetId}">
      <i class="fas fa-times text-xs text-white"></i>
    </button>`;
    return button;
  }

  // Render all sound cards
  renderSoundCards(sounds) {
    this.soundCardsContainer.innerHTML = '';
    sounds.forEach((sound) => {
      const card = this.createSoundCard(sound);
      this.soundCardsContainer.appendChild(card);
    });
  }

  // Update play/pause button for individual sound
  updateSoundPlayButton(soundId, isPlaying) {
    const card = document.querySelector(`[data-sound="${soundId}"]`);

    if (card) {
      const playBtn = card.querySelector('.play-btn');
      const icon = playBtn.querySelector('i');
      const equalizer = card.querySelector('.equalizer');

      if (isPlaying) {
        icon.classList.remove('fa-play');
        icon.classList.add('fa-pause');
        card.classList.add('playing', 'sound-active');
        if (equalizer) {
          equalizer.classList.remove('hidden');
        }
      } else {
        icon.classList.remove('fa-pause');
        icon.classList.add('fa-play');
        card.classList.remove('playing', 'sound-active');
        if (equalizer) {
          equalizer.classList.add('hidden');
        }
      }
    }
  }

  // Update volume display for a sound
  updateVolumeDisplay(soundId, volume) {
    const card = document.querySelector(`[data-sound="${soundId}"]`);

    if (card) {
      // Update number display
      const volumeValue = card.querySelector('.volume-value');
      if (volumeValue) {
        volumeValue.textContent = volume;
      }

      // Update volume bar visuals
      const volumeBarFill = card.querySelector('.volume-bar-fill');
      if (volumeBarFill) {
        volumeBarFill.style.width = `${volume}%`;
      }

      // Udpate slider position
      const slider = card.querySelector('.volume-slider');
      if (slider) {
        slider.value = volume;
      }
    }
  }

  // Update main play/pause button
  updateMainPlayButton(isPlaying) {
    const icon = this.playPauseButton.querySelector('i');

    if (isPlaying) {
      icon.classList.remove('fa-play');
      icon.classList.add('fa-pause');
    } else {
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
    }
  }

  // Reset all UI elements to default state
  resetUI() {
    // Reset sliders to 0
    const sliders = document.querySelectorAll('.volume-slider');
    sliders.forEach((slider) => {
      slider.value = 0;
      const soundId = slider.dataset.sound;
      this.updateVolumeDisplay(soundId, 0);
    });

    // Reset all play buttons to play state
    const playButtons = document.querySelectorAll('.play-btn');
    playButtons.forEach((btn) => {
      const icon = btn.querySelector('i');
      icon.classList.remove('fa-pause');
      icon.classList.add('fa-play');
    });

    // Remove playing class from cards
    const cards = document.querySelectorAll('.sound-card');
    cards.forEach((card) => {
      card.classList.remove('fa-playing');
    });

    // Reset main play/pause button
    this.updateMainPlayButton(false);

    // Reset master volume to 100%
    this.masterVolumeSlider.value = 100;
    this.masterVolumeValue.textContent = '100%';
  }

  // Show save preset modal
  showModal() {
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    document.getElementById('presetName').focus();
  }

  // Hide save preset modal
  hideModal() {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    document.getElementById('presetName').value = '';
  }

  // Add custom preset to UI
  addCustomPreset(name, presetId) {
    const button = this.createCustomPresetButton(name, presetId);
    this.customPresetsContainer.appendChild(button);
  }

  // Highlight active preset
  setActivePreset(presetKey) {
    // Remove active class from all buttons
    document
      .querySelectorAll('.preset-btn, .custom-preset-btn')
      .forEach((btn) => {
        btn.classList.remove('preset-active');
      });

    // Add active class to selected presets
    const activeButton = document.querySelector(
      `.preset-btn[data-preset="${presetKey}"], .custom-preset-btn[data-preset="${presetKey}"]`
    );

    if (activeButton) {
      activeButton.classList.add('preset-active');
    }
  }

  // Remove custom preset from UI
  removeCustomPreset(presetId) {
    const button = document.querySelector(
      `.custom-preset-btn[data-preset="${presetId}"]`
    );
    if (button) {
      button.remove();
    }
  }

  // Update timer display
  updateTimerDisplay(minutes, seconds) {
    if (this.timerDisplay) {
      if (minutes > 0 || seconds > 0) {
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
          .toString()
          .padStart(2, '0')}`;
        this.timerDisplay.textContent = formattedTime;
        this.timerDisplay.classList.remove('hidden');
      } else {
        this.timerDisplay.classList.add('hidden');
      }
    }
  }

  // Toggle theme
  toggleTheme() {
    const body = document.body;
    const icon = this.themeToggle.querySelector('i');

    if (body.classList.contains('light-theme')) {
      body.classList.remove('light-theme');
      icon.classList.replace('fa-moon', 'fa-sun');
      localStorage.setItem('theme', 'dark');
    } else {
      body.classList.add('light-theme');
      icon.classList.replace('fa-sun', 'fa-moon');
      localStorage.setItem('theme', 'light');
    }
  }

  // Setup info modal handlers
  setupInfoModal() {
    // Show info modal
    if (this.infoButton) {
      this.infoButton.addEventListener('click', () => {
        this.showInfoModal();
      });
    }

    // Close info modal
    if (this.closeInfoButton) {
      this.closeInfoButton.addEventListener('click', () => {
        this.hideInfoModal();
      });
    }

    // Close on outside click
    if (this.infoModal) {
      this.infoModal.addEventListener('click', (e) => {
        if (e.target === this.infoModal) {
          this.hideInfoModal();
        }
      });
    }

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.infoModal && !this.infoModal.classList.contains('hidden')) {
          this.hideInfoModal();
        }
        if (this.modal && !this.modal.classList.contains('hidden')) {
          this.hideModal();
        }
      }
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      const icon = this.themeToggle.querySelector('i');
      icon.classList.replace('fa-sun', 'fa-moon');
    }
  }

  // Show info modal
  showInfoModal() {
    if (this.infoModal) {
      this.infoModal.classList.remove('hidden');
      this.infoModal.classList.add('flex');
    }
  }

  // Hide info modal
  hideInfoModal() {
    if (this.infoModal) {
      this.infoModal.classList.add('hidden');
      this.infoModal.classList.remove('flex');
    }
  }
}
