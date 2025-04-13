class SoundManager {
    constructor() {
        this.synth = new Tone.Synth().toDestination();
        this.initialized = false;

        // Create a separate synth for shooting sounds
        this.shootSynth = new Tone.Synth({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0,
                release: 0.1
            }
        }).toDestination();
        this.shootSynth.volume.value = -10;

        // Create a synth for upgrade sounds with more complex harmonics
        this.upgradeSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 0.02,
                decay: 0.3,
                sustain: 0.2,
                release: 0.5
            }
        }).toDestination();
        this.upgradeSynth.volume.value = -5;

        // Additional FX for upgrade sounds
        this.reverbFX = new Tone.Reverb({
            decay: 2,
            wet: 0.3
        }).toDestination();
        this.upgradeSynth.connect(this.reverbFX);
        
        // Sound effect mappings
        this.soundEffects = {
            'enemyExplosion': { 
                type: 'layered', 
                components: [
                    { type: 'synth', notes: ['D3'], duration: 0.15, decay: 0.2 },
                    { type: 'synth', notes: ['A2'], duration: 0.1, decay: 0.3 },
                    { type: 'noise', duration: 0.2, envelope: { attack: 0.001, decay: 0.2, sustain: 0.1, release: 0.2 } }
                ]
            },
            'enemyExplosionLarge': { 
                type: 'layered',
                components: [
                    { type: 'synth', notes: ['G2', 'C3'], duration: 0.25, decay: 0.4 },
                    { type: 'synth', notes: ['D2'], duration: 0.35, decay: 0.5 },
                    { type: 'noise', duration: 0.45, envelope: { attack: 0.001, decay: 0.4, sustain: 0.2, release: 0.3 } }
                ]
            },
            'playerCollision': { 
                type: 'layered',
                components: [
                    { type: 'synth', notes: ['A2'], duration: 0.15, decay: 0.3 },
                    { type: 'noise', duration: 0.25, envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.2 } }
                ]
            },
            'portalActivate': { type: 'synth', notes: ['G4', 'C5'], duration: 0.2 },
            'safeZoneActivate': { type: 'synth', notes: ['E4', 'A4'], duration: 0.15 }
        };

        // Setup cosmic background music
        this.backgroundSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.1,
                decay: 0.3,
                sustain: 0.8,
                release: 1
            }
        }).toDestination();
        this.backgroundSynth.volume.value = -20;

        // Ambient pad synth
        this.padSynth = new Tone.PolySynth(Tone.Synth, {
            oscillator: {
                type: "triangle"
            },
            envelope: {
                attack: 2,
                decay: 1,
                sustain: 1,
                release: 3
            }
        }).toDestination();
        this.padSynth.volume.value = -25;

        // Effects for cosmic sounds
        this.cosmicReverb = new Tone.Reverb({
            decay: 5,
            wet: 0.5
        }).toDestination();
        this.backgroundSynth.connect(this.cosmicReverb);
        this.padSynth.connect(this.cosmicReverb);

        // Delay effect for ethereal sound
        this.delay = new Tone.PingPongDelay({
            delayTime: "8n",
            feedback: 0.2,
            wet: 0.1
        }).toDestination();
        this.backgroundSynth.connect(this.delay);

        this.currentIntensity = 0;
        this.backgroundLoop = null;
        this.padLoop = null;
    }

    async initialize() {
        if (!this.initialized) {
            await Tone.start();
            this.initialized = true;
            this.startBackgroundMusic();
        }
    }

    startBackgroundMusic() {
        if (!this.initialized) return;

        // Use peaceful ethereal notes in a major scale for space ambiance
        const baseNotes = ['E3', 'G3', 'B3', 'D4'];
        const padNotes = ['E2', 'B2', 'E3', 'G3', 'B3'];
        
        // Update synth settings for more peaceful sound
        this.backgroundSynth.set({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 0.5,
                decay: 0.5,
                sustain: 0.8,
                release: 2
            }
        });
        
        this.padSynth.set({
            oscillator: {
                type: "sine"
            },
            envelope: {
                attack: 3,
                decay: 2,
                sustain: 0.8,
                release: 4
            }
        });
        
        // Increase reverb and delay for more spacious sound
        this.cosmicReverb.set({
            decay: 8,
            wet: 0.7
        });
        
        this.delay.set({
            delayTime: "8n",
            feedback: 0.3,
            wet: 0.2
        });
        
        // Lower volume for more ambient backdrop
        this.backgroundSynth.volume.value = -25;
        this.padSynth.volume.value = -28;

        // Background arpeggio pattern - slower and more gentle
        this.backgroundLoop = new Tone.Loop((time) => {
            baseNotes.forEach((note, i) => {
                this.backgroundSynth.triggerAttackRelease(
                    note,
                    '4n',
                    time + i * 0.8,
                    0.2 + (this.currentIntensity * 0.15)
                );
            });
        }, '4m').start(0);

        // Ambient pad pattern - longer sustaining chords
        this.padLoop = new Tone.Loop((time) => {
            // Play chord as a group with slight offsets for gentler attack
            padNotes.forEach((note, i) => {
                this.padSynth.triggerAttackRelease(
                    note,
                    '8m',
                    time + (i * 0.1),
                    0.15 + (this.currentIntensity * 0.1)
                );
            });
        }, '8m').start(0);

        // Slower tempo for more peaceful feel
        Tone.Transport.bpm.value = 50;
        Tone.Transport.start();
    }

    setMusicIntensity(intensity) {
        // Clamp intensity between 0 and 1
        this.currentIntensity = Math.max(0, Math.min(1, intensity));

        // Adjust volume based on intensity
        this.backgroundSynth.volume.rampTo(-20 + (this.currentIntensity * 5), 1);
        this.padSynth.volume.rampTo(-25 + (this.currentIntensity * 5), 1);

        // Adjust effects based on intensity
        this.delay.feedback.rampTo(0.2 + (this.currentIntensity * 0.3), 1);
        this.cosmicReverb.wet.rampTo(0.5 + (this.currentIntensity * 0.3), 1);

        // Adjust tempo based on intensity
        Tone.Transport.bpm.rampTo(60 + (this.currentIntensity * 40), 1);
    }

    playUpgradeSound(shipType) {
        if (!this.initialized) return;

        // Different upgrade sounds based on ship type
        const now = Tone.now();
        let notes = ["C4", "E4", "G4", "C5"];
        let timings = [0, 0.1, 0.2, 0.3];
        let durations = ["16n", "16n", "16n", "8n"];

        switch(shipType) {
            case 'sniper':
            case 'sniper-burst':
            case 'sniper-precision':
                notes = ["E4", "G4", "B4", "E5"];
                this.upgradeSynth.volume.value = -8;
                break;
            case 'quasar':
            case 'quasar-pulse':
            case 'quasar-storm':
                notes = ["G4", "B4", "D5", "G5"];
                timings = [0, 0.08, 0.16, 0.24];
                this.upgradeSynth.volume.value = -6;
                break;
            case 'heavy':
            case 'heavy-siege':
            case 'heavy-fortress':
                notes = ["C3", "G3", "C4", "G4"];
                timings = [0, 0.15, 0.3, 0.45];
                durations = ["8n", "8n", "8n", "4n"];
                this.upgradeSynth.volume.value = -4;
                break;
            default:
                this.upgradeSynth.volume.value = -5;
        }

        // Play the arpeggio sequence
        notes.forEach((note, index) => {
            this.upgradeSynth.triggerAttackRelease(note, durations[index], now + timings[index]);
        });
    }

    playTierUpSound() {
        if (!this.initialized) return;

        const now = Tone.now();
        // Play a more dramatic ascending pattern with chord progression
        const chords = [
            ["C4", "E4", "G4"],
            ["F4", "A4", "C5"],
            ["G4", "B4", "D5"],
            ["C5", "E5", "G5"]
        ];

        chords.forEach((chord, i) => {
            this.upgradeSynth.triggerAttackRelease(chord, i < 3 ? "8n" : "4n", now + i * 0.2);
        });

        // Add a final triumphant chord
        setTimeout(() => {
            this.upgradeSynth.triggerAttackRelease(["C4", "E4", "G4", "C5"], "2n");
        }, 1000);
    }

    playShootSound(shipType) {
        if (!this.initialized) return;

        // Different sound characteristics based on ship type
        let note, duration;
        switch(shipType.type) {
            case 'sniper':
            case 'sniper-burst':
            case 'sniper-precision':
                note = "G5";
                duration = "32n";
                this.shootSynth.volume.value = -15;
                break;
            case 'quasar':
            case 'quasar-pulse':
            case 'quasar-storm':
                note = "E5";
                duration = "16n";
                this.shootSynth.volume.value = -20;
                break;
            case 'heavy':
            case 'heavy-siege':
            case 'heavy-fortress':
                note = "C4";
                duration = "8n";
                this.shootSynth.volume.value = -5;
                break;
            default:
                note = "E4";
                duration = "16n";
                this.shootSynth.volume.value = -10;
        }

        this.shootSynth.triggerAttackRelease(note, duration);
    }
    
    /**
     * Generic sound effect player for various game events
     * @param {string} soundName - Name of the sound to play (enemyExplosion, enemyExplosionLarge, playerCollision, etc.)
     * @param {number} volume - Volume modifier (0-1)
     */
    playSound(soundName, volume = 0.5) {
        if (!this.initialized) return;
        
        try {
            // Check if this is a valid sound effect
            if (!this.soundEffects[soundName]) {
                console.warn(`Sound effect "${soundName}" not found.`);
                return;
            }
            
            const effect = this.soundEffects[soundName];
            const now = Tone.now();
            
            // Handle different types of sound effects
            if (effect.type === 'noise') {
                this.playNoiseEffect(effect, volume);
            } 
            else if (effect.type === 'synth') {
                this.playSynthEffect(effect, volume, now);
            }
            else if (effect.type === 'layered') {
                // For layered effects, play each component
                if (effect.components && effect.components.length > 0) {
                    effect.components.forEach(component => {
                        if (component.type === 'noise') {
                            this.playNoiseEffect(component, volume);
                        } 
                        else if (component.type === 'synth') {
                            this.playSynthEffect(component, volume, now);
                        }
                    });
                }
            }
        } catch (error) {
            console.error("Error playing sound effect:", error);
        }
    }
    
    playNoiseEffect(effect, volume) {
        // Create a more customizable noise effect
        const envelopeSettings = effect.envelope || {
            attack: 0.001,
            decay: effect.duration || 0.2,
            sustain: 0,
            release: 0.05
        };
        
        // Choose noise type - brown gives deeper explosion sound
        const noiseType = effect.noiseType || 'brown';
        
        const noise = new Tone.NoiseSynth({
            noise: {
                type: noiseType
            },
            envelope: envelopeSettings,
            volume: -10 + (volume * 10) // Adjust volume
        }).toDestination();
        
        // Create effects chain for more realistic explosion sound
        
        // Low pass filter to shape the noise
        const filter = new Tone.Filter({
            type: 'lowpass',
            frequency: effect.filterFreq || 2000,
            Q: effect.filterQ || 1.5
        }).toDestination();
        
        // Add dynamic compression to make the sound more punchy
        const compressor = new Tone.Compressor({
            threshold: -24,
            ratio: 4,
            attack: 0.005,
            release: 0.05
        }).toDestination();
        
        // Connect the effects
        noise.connect(filter);
        filter.connect(compressor);
        
        // Optionally add a frequency envelope for more dramatic effect
        if (effect.useFreqEnvelope) {
            const now = Tone.now();
            const freqEnvDuration = effect.duration || 0.2;
            // Start at a higher frequency and sweep down
            filter.frequency.setValueAtTime(4000, now);
            filter.frequency.exponentialRampToValueAtTime(
                500, 
                now + freqEnvDuration
            );
        }
        
        // Play the noise with specified duration
        noise.triggerAttackRelease(effect.duration || 0.2);
        
        // Clean up after playing
        setTimeout(() => {
            noise.dispose();
            filter.dispose();
            compressor.dispose();
        }, (effect.duration || 0.2) * 1000 + 300);
    }
    
    playSynthEffect(effect, volume, now) {
        // Create a dedicated synth for this sound effect with better oscillator
        const oscillatorType = effect.oscillatorType || 'triangle';
        const synth = new Tone.Synth({
            oscillator: {
                type: oscillatorType
            },
            envelope: {
                attack: 0.005,
                decay: effect.decay || 0.1,
                sustain: 0.1,
                release: 0.1
            },
            volume: -8 + (volume * 8)
        }).toDestination();
        
        // Add distortion for more impact in explosion sounds
        const distortion = new Tone.Distortion({
            distortion: 0.3,
            wet: 0.2
        }).toDestination();
        
        // Add a bit of reverb for spaciousness
        const reverb = new Tone.Reverb({
            decay: 0.8,
            wet: 0.2
        }).toDestination();
        
        // Connect effects chain
        synth.connect(distortion);
        distortion.connect(reverb);
        
        // Play sequence of notes with velocity variations for more dynamic sound
        if (effect.notes && effect.notes.length > 0) {
            effect.notes.forEach((note, i) => {
                // Add slight randomization to timing for more natural sound
                const timingVariation = Math.random() * 0.02;
                // Decrease velocity for subsequent notes in a sequence
                const velocityFactor = 1 - (i * 0.15);
                
                synth.triggerAttackRelease(
                    note, 
                    effect.duration || "16n", 
                    now + (i * 0.08) + timingVariation, 
                    volume * velocityFactor
                );
            });
        }
        
        // Clean up after playing
        const cleanupTime = (effect.notes?.length || 1) * (effect.duration || 0.1) * 1000 + 400;
        setTimeout(() => {
            synth.dispose();
            distortion.dispose();
            reverb.dispose();
        }, cleanupTime);
    }
}