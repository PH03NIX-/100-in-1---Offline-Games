import React from 'react';
import './SoundTestGame.css';

function SoundTestGame({ soundEffects }) {
  // List of all available sound effects
  const soundEffectsList = [
    'playButton',
    'generalButton',
    'gameAction',
    'gameAction5',
    'gameAction8',
    'gameAction12',
    'goodMove',
    'badMove',
    'gameOver',
    'gameWon',
    'lazer',
    'boom',
    'shortBoom',
    'card'
  ];

  const handleSoundClick = (soundName) => {
    soundEffects.play(soundName);
  };

  return (
    <div className="sound-test-container">
      <h2>Sound Effects Test Panel</h2>
      <div className="sound-buttons-grid">
        {soundEffectsList.map((soundName) => (
          <button
            key={soundName}
            className="sound-button"
            onClick={() => handleSoundClick(soundName)}
          >
            {soundName}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SoundTestGame; 