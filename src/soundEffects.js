// src/soundEffectsManager.js
import { audioContext } from './audioContext';

const soundFiles = {
    playButton: 'play_button.mp3',
    generalButton: 'general_button.mp3',
    gameAction: 'game_action.mp3',
    gameAction5: 'game_action-5.mp3',
    gameAction8: 'game_action-8.mp3',
    gameAction12: 'game_action-12.mp3',
    goodMove: 'wooden_click.mp3',
    badMove: 'wooden_click2.mp3',
    gameOver: 'game_over.mp3',
    gameWon: 'game_won.mp3',
    lazer: 'lazer.mp3',
    boom: 'boom.mp3',
    shortBoom: 'short_boom.mp3',
    card: 'card.mp3',
};

const soundBuffers = {};

const loadSound = async (url) => {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return await audioContext.decodeAudioData(arrayBuffer);
};

const soundEffectsManager = {
    loadAllSounds: async function () {
        const promises = Object.entries(soundFiles).map(async ([key, fileName]) => {
            try {
                const buffer = await loadSound(`./soundfx/${fileName}`);
                soundBuffers[key] = buffer;
                console.log(`Sound "${key}" loaded.`);
            } catch (error) {
                console.error(`Error loading sound "${key}":`, error);
            }
        });

        await Promise.all(promises);
        console.log('All sounds loaded.');
    },

    play: function (soundName) {
        if (soundBuffers[soundName]) {
            const source = audioContext.createBufferSource();
            source.buffer = soundBuffers[soundName];
            source.connect(audioContext.destination);
            source.start(0);
        } else {
            console.warn(`Sound "${soundName}" not found.`);
        }
    },
};

export default soundEffectsManager;
