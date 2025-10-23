import { PresetManager } from './presetManager.js';
import { sounds, defaultPresets } from './soundData.js';
import { SoundManager } from './soundManager.js';
import { UI } from './ui.js';
import { Timer } from './timer.js';

class AmbientMixer {
  // Initialize dependencies and default state
  constructor() {
    this.soundManager = new SoundManager();
    this.ui = new UI();
    this.presetManager = new PresetManager();
    this.timer = new Timer(
      () => this.onTimerComplete(),
      (minutes, seconds) => this.ui.updateTimerDisplay(minutes, seconds)
    );
    this.currentSoundState = {};
    this.masterVolume = 100;
    this.isInitialized = false;
  }

  init() {
    try {
      // Initialize UI
      this.ui.init();

      // Render sound cards using our sound data
      this.ui.renderSoundCards(sounds);

      this.setupEventListeners();

      // Load custom presets in UI
      this.loadCustomPresetsUI();

      // Load all sound files
      this.loadAllSounds();

      // Initialize sound states after loading sounds
      sounds.forEach((sound) => {
        this.currentSoundState[sound.id] = 0;
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize app: ', error);
    }
  }

  // Setup all event listeners
  setupEventListeners() {
    // Handle all clicks with event delegation
    document.addEventListener('click', async (e) => {
      // Check if play button was clicked
      if (e.target.closest('.play-btn')) {
        const soundId = e.target.closest('.play-btn').dataset.sound;
        await this.toggleSound(soundId);
      }

      // Check if delete button was clicked
      if (e.target.closest('.delete-preset')) {
        e.stopPropagation();
        const presetId = e.target.closest('.delete-preset').dataset.preset;

        this.deleteCustomPreset(presetId);

        return;
      }

      // Check if a default preset button was clicked
      if (e.target.closest('.preset-btn')) {
        const presetKey = e.target.closest('.preset-btn').dataset.preset;
        await this.loadPreset(presetKey);
      }

      // Check if a default preset button was clicked
      if (e.target.closest('.custom-preset-btn')) {
        const presetKey = e.target.closest('.custom-preset-btn').dataset.preset;
        await this.loadPreset(presetKey, true);
      }
    });

    // Handle volume slider changes
    document.addEventListener('input', (e) => {
      if (e.target.classList.contains('volume-slider')) {
        const soundId = e.target.dataset.sound;
        const volume = parseInt(e.target.value);
        this.setSoundVolume(soundId, volume);
      }
    });

    // Handle master volume slider
    const masterVolumeSlider = document.getElementById('masterVolume');
    if (masterVolumeSlider) {
      masterVolumeSlider.addEventListener('input', (e) => {
        const volume = parseInt(e.target.value);
        this.setMasterVolume(volume);
      });
    }

    // Handle master play/pause button
    if (this.ui.playPauseButton) {
      this.ui.playPauseButton.addEventListener('click', () => {
        this.toggleAllSounds();
      });
    }

    // Handle reset button
    if (this.ui.resetButton) {
      this.ui.resetButton.addEventListener('click', () => {
        this.resetAll();
      });
    }

    // Save preset button
    const saveButton = document.getElementById('savePreset');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        this.showSavePresetModal();
      });
    }

    // Confirm save preset button
    const confirmSaveButton = document.getElementById('confirmSave');
    if (confirmSaveButton) {
      confirmSaveButton.addEventListener('click', () => {
        this.saveCurrentPreset();
      });
    }

    // Cancel save preset button
    const cancelSaveButton = document.getElementById('cancelSave');
    if (cancelSaveButton) {
      cancelSaveButton.addEventListener('click', () => {
        this.ui.hideModal();
      });
    }

    // Close modal if backdrop is clicked
    if (this.ui.modal) {
      this.ui.modal.addEventListener('click', (e) => {
        if (e.target === this.ui.modal) {
          this.ui.hideModal();
        }
      });
    }

    // Timer select
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
      timerSelect.addEventListener('change', (e) => {
        const value = e.target.value;
        
        if (value === 'custom') {
          // Show custom timer modal
          this.showCustomTimerModal();
          // Reset dropdown to 0
          e.target.value = '0';
        } else {
          const minutes = parseInt(value);
          if (minutes > 0) {
            this.timer.start(minutes);
            console.log(`Timer started for ${minutes} minutes`);
          } else {
            this.timer.stop();
          }
        }
      });
    }

    // Custom timer modal handlers
    const confirmCustomTimer = document.getElementById('confirmCustomTimer');
    if (confirmCustomTimer) {
      confirmCustomTimer.addEventListener('click', () => {
        this.setCustomTimer();
      });
    }

    const cancelCustomTimer = document.getElementById('cancelCustomTimer');
    if (cancelCustomTimer) {
      cancelCustomTimer.addEventListener('click', () => {
        this.hideCustomTimerModal();
      });
    }

    // Close custom timer modal on backdrop click
    const customTimerModal = document.getElementById('customTimerModal');
    if (customTimerModal) {
      customTimerModal.addEventListener('click', (e) => {
        if (e.target === customTimerModal) {
          this.hideCustomTimerModal();
        }
      });
    }

    // Allow Enter key to submit custom timer
    const customTimerInput = document.getElementById('customTimerInput');
    if (customTimerInput) {
      customTimerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.setCustomTimer();
        }
      });
    }

    // Timer end modal close button
    const closeTimerEnd = document.getElementById('closeTimerEnd');
    if (closeTimerEnd) {
      closeTimerEnd.addEventListener('click', () => {
        this.hideTimerEndModal();
      });
    }

    // Close timer end modal on backdrop click
    const timerEndModal = document.getElementById('timerEndModal');
    if (timerEndModal) {
      timerEndModal.addEventListener('click', (e) => {
        if (e.target === timerEndModal) {
          this.hideTimerEndModal();
        }
      });
    }

    // Theme toggle
    if (this.ui.themeToggle) {
      this.ui.themeToggle.addEventListener('click', () => {
        this.ui.toggleTheme();
      });
    }
  }

  // Load all sound files
  loadAllSounds() {
    sounds.forEach((sound) => {
      const audioUrl = `audio/${sound.file}`;
      const success = this.soundManager.loadSound(sound.id, audioUrl);
      if (!success) {
        console.warn(`Could not load sound: ${sound.name} from ${audioUrl}`);
      }
    });
  }

  // Toggle individual sound
  async toggleSound(soundId) {
    const audio = this.soundManager.audioElements.get(soundId);

    if (!audio) {
      console.error(`Sound ${soundId} not found`);
      return false;
    }

    if (audio.paused) {
      // Get current slider value
      const card = document.querySelector(`[data-sound="${soundId}"]`);
      const slider = card.querySelector('.volume-slider');
      let volume = parseInt(slider.value);

      // If slider is at 0, default to 50%
      if (volume === 0) {
        volume = 50;
        this.ui.updateVolumeDisplay(soundId, volume);
      }

      // Set current sound state
      this.currentSoundState[soundId] = volume;

      // Sound is off, turn it on
      this.soundManager.setVolume(soundId, volume);
      await this.soundManager.playSound(soundId);
      this.ui.updateSoundPlayButton(soundId, true);
    } else {
      // Sound is on, shut it off
      this.soundManager.pauseSound(soundId);
      this.currentSoundState[soundId] = 0;
      this.ui.updateSoundPlayButton(soundId, false);

      // Set current sound state to 0 when paused
      this.currentSoundState[soundId] = 0;
    }

    // Update main play button state
    this.updateMainPlayButtonState();
  }

  // Toggle all sounds
  toggleAllSounds() {
    if (this.soundManager.isPlaying) {
      // Toggle sounds off
      this.soundManager.pauseAll();
      this.ui.updateMainPlayButton(false);
      sounds.forEach((sound) => {
        this.ui.updateSoundPlayButton(sound.id, false);
      });
    } else {
      // Toggle sounds on
      for (const [soundId, audio] of this.soundManager.audioElements) {
        const card = document.querySelector(`[data-sound=${soundId}]`);
        const slider = card?.querySelector('.volume-slider');

        if (slider) {
          let volume = parseInt(slider.value);

          if (volume === 0) {
            volume = 50;
            slider.value = 50;
            this.ui.updateVolumeDisplay(soundId, 50);
          }

          this.currentSoundState[soundId] = volume;

          const effectiveVolume = (volume * this.masterVolume) / 100;
          audio.volume = effectiveVolume / 100;
          this.ui.updateSoundPlayButton(soundId, true);
        }
      }

      // Play all sounds
      this.soundManager.playAll();

      this.ui.updateMainPlayButton(true);
    }
  }

  // Set sound volume
  setSoundVolume(soundId, volume) {
    // Set sound volume in state
    this.currentSoundState[soundId] = volume;

    // Caclulate effective volume with master volume
    const effectiveVolume = (volume * this.masterVolume) / 100;

    // Update the sound volume with the scaled volume
    const audio = this.soundManager.audioElements.get(soundId);

    if (audio) {
      audio.volume = effectiveVolume / 100;
    }

    // Update visual display
    this.ui.updateVolumeDisplay(soundId, volume);

    // Sync sounds
    this.updateMainPlayButtonState();
  }

  // Set master volume
  setMasterVolume(volume) {
    this.masterVolume = volume;

    // Update the display
    const masterVolumeValue = document.getElementById('masterVolumeValue');
    if (masterVolumeValue) {
      masterVolumeValue.textContent = `${volume}%`;
    }

    // Apply master volume to all currently playing sounds
    this.applyMasterVolumeToAll();
  }

  // Apply master volume to all playing sounds
  applyMasterVolumeToAll() {
    for (const [soundId, audio] of this.soundManager.audioElements) {
      if (!audio.paused) {
        const card = document.querySelector(`[data-sound="${soundId}"]`);
        const slider = card?.querySelector('.volume-slider');

        if (slider) {
          const individualVolume = parseInt(slider.value);
          // Calculate effective volume (individual * master / 100)
          const effectiveVolume = (individualVolume * this.masterVolume) / 100;

          // Apply to the actual audio element
          audio.volume = effectiveVolume / 100;
        }
      }
    }
  }

  // Update main play button based on individual sounds
  updateMainPlayButtonState() {
    // Check if any sounds playing
    let anySoundsPlaying = false;
    for (const [soundId, audio] of this.soundManager.audioElements) {
      if (!audio.paused) {
        anySoundsPlaying = true;
        break;
      }
    }

    // Update the main button and the internal state
    this.soundManager.isPlaying = anySoundsPlaying;
    this.ui.updateMainPlayButton(anySoundsPlaying);
  }

  // Reset everything to default state
  resetAll() {
    // Stop all sounds
    this.soundManager.stopAll();

    // Reset master volume
    this.masterVolume = 100;

    // Reset timer
    this.timer.stop();
    if (this.ui.timerSelect) {
      this.ui.timerSelect.value = '0';
    }

    // Reset active preset
    this.ui.setActivePreset(null);

    // Reset sound states
    sounds.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
    });

    // Reset UI
    this.ui.resetUI();
  }

  // Load a preset config
  loadPreset(presetKey, custom = false) {
    let preset;

    if (custom) {
      preset = this.presetManager.loadPreset(presetKey);
    } else {
      preset = defaultPresets[presetKey];
    }

    if (!preset) {
      console.error(`Preset ${presetKey} not found`);
      return;
    }

    // First, stop all sounds
    this.soundManager.stopAll();

    // Reset all volumes to 0
    sounds.forEach((sound) => {
      this.currentSoundState[sound.id] = 0;
      this.ui.updateVolumeDisplay(sound.id, 0);
      this.ui.updateSoundPlayButton(sound.id, false);
    });

    // Apply the preset volumes
    for (const [soundId, volume] of Object.entries(preset.sounds)) {
      // Set volume state
      this.currentSoundState[soundId] = volume;

      // Update UI
      this.ui.updateVolumeDisplay(soundId, volume);

      // Calculate effective volume
      const effectiveVolume = (volume * this.masterVolume) / 100;

      // Get audio element and set value
      const audio = this.soundManager.audioElements.get(soundId);

      if (audio) {
        audio.volume = effectiveVolume / 100;

        // Play sound
        audio.play();
        this.ui.updateSoundPlayButton(soundId, true);
      }
    }

    // Update main play button and state
    this.soundManager.isPlaying = true;
    this.ui.updateMainPlayButton(true);

    // Set active preset
    if (presetKey) {
      this.ui.setActivePreset(presetKey);
    }
  }

  // Show save preset modal
  showSavePresetModal() {
    // Check if any sounds are active
    const hasActiveSounds = Object.values(this.currentSoundState).some(
      (v) => v > 0
    );

    if (!hasActiveSounds) {
      alert('No active sounds for preset');
      return;
    }

    this.ui.showModal();
  }

  // Save current preset
  saveCurrentPreset() {
    const nameInput = document.getElementById('presetName');
    const name = nameInput.value.trim();

    if (!name) {
      alert('Please enter a preset name');
      return;
    }

    if (this.presetManager.presetNameExists(name)) {
      alert(`A preset with the name ${name} already exists`);
      return;
    }

    const presetId = this.presetManager.savePreset(
      name,
      this.currentSoundState
    );

    // Add custom preset button to UI
    this.ui.addCustomPreset(name, presetId);

    this.ui.hideModal();

    console.log(`Preset "${name}" saved successfully with ID: ${presetId}`);
  }

  // Load custom preset buttons in UI
  loadCustomPresetsUI() {
    const customPresets = this.presetManager.customPresets;
    for (const [presetId, preset] of Object.entries(customPresets)) {
      this.ui.addCustomPreset(preset.name, presetId);
    }
  }

  // Delete custom preset
  deleteCustomPreset(presetId) {
    if (this.presetManager.deletePreset(presetId)) {
      this.ui.removeCustomPreset(presetId);
      console.log(`Preset ${presetId} deleted`);
    }
  }

  //Timer complete callback
  onTimerComplete() {
    // Play notification sound
    this.playNotificationSound();

    // Stop all sounds
    this.soundManager.pauseAll();
    this.ui.updateMainPlayButton(false);

    // Update individual buttons
    sounds.forEach((sound) => {
      this.ui.updateSoundPlayButton(sound.id, false);
    });

    // Reset timer dropdown
    const timerSelect = document.getElementById('timerSelect');
    if (timerSelect) {
      timerSelect.value = '0';
    }

    // Clear and hide timer display
    if (this.ui.timerDisplay) {
      this.ui.timerDisplay.textContent = '';
      this.ui.timerDisplay.classList.add('hidden');
    }

    // Show timer end notification modal
    this.showTimerEndModal();
  }

  // Play notification sound using Web Audio API
  playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a pleasant notification sound (three beeps)
      const playBeep = (frequency, startTime, duration) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        // Envelope for smooth sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      // Play three pleasant beeps
      const now = audioContext.currentTime;
      playBeep(800, now, 0.15);           // First beep
      playBeep(1000, now + 0.2, 0.15);    // Second beep (higher)
      playBeep(1200, now + 0.4, 0.25);    // Third beep (highest, longer)

    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  // Show timer end notification modal
  showTimerEndModal() {
    const modal = document.getElementById('timerEndModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  }

  // Hide timer end notification modal
  hideTimerEndModal() {
    const modal = document.getElementById('timerEndModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  // Show custom timer modal
  showCustomTimerModal() {
    const modal = document.getElementById('customTimerModal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
      
      // Focus on input
      const input = document.getElementById('customTimerInput');
      if (input) {
        input.value = '';
        setTimeout(() => input.focus(), 100);
      }
    }
  }

  // Hide custom timer modal
  hideCustomTimerModal() {
    const modal = document.getElementById('customTimerModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      
      // Clear input
      const input = document.getElementById('customTimerInput');
      if (input) {
        input.value = '';
      }
    }
  }

  // Set custom timer
  setCustomTimer() {
    const input = document.getElementById('customTimerInput');
    if (!input) return;

    const minutes = parseInt(input.value);

    if (isNaN(minutes) || minutes < 1 || minutes > 999) {
      alert('Please enter a valid time between 1 and 999 minutes');
      return;
    }

    // Start the timer
    this.timer.start(minutes);
    console.log(`Custom timer started for ${minutes} minutes`);

    // Hide the modal
    this.hideCustomTimerModal();
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new AmbientMixer();
  app.init();
});
