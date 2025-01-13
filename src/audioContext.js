// src/audioContext.js (update this file)
export const audioContext = new (window.AudioContext || window.webkitAudioContext)();

export const unlockAudioContext = () => {
    if (audioContext.state !== 'running') {
        const resume = () => {
            audioContext.resume();
            document.body.removeEventListener('touchend', resume, false);
        };
        document.body.addEventListener('touchend', resume, false);
    }
};
