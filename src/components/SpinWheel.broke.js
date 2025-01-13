import React, { useState, useEffect } from 'react';
import './SpinWheel.css';

const PRIZES = [
    { value: 30, type: 'seconds', label: '30 SEC', probability: 7, color: '#E74C3C' },
    { value: 3, type: 'minutes', label: '3 MIN', probability: 10, color: '#D4A5A5' },
    { value: 3, type: 'minutes', label: '3 MIN', probability: 10, color: '#FF6B6B' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#E67E22' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#FFEEAD' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#F1C40F' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#9B59B6' },
    { value: 7, type: 'minutes', label: '7 MIN', probability: 10, color: '#3498DB' },
    { value: 7, type: 'minutes', label: '7 MIN', probability: 10, color: '#45B7D1' },
    { value: 10, type: 'minutes', label: '10 MIN', probability: 8, color: '#4ECDC4' },
    { value: 20, type: 'minutes', label: '20 MIN', probability: 2, color: '#96CEB4' },
    { value: 0, type: 'day', label: <span>FREE<br/>DAY!</span>, probability: 3, color: '#2ECC71' }
];

/*const PRIZES = [
    { value: 30, type: 'seconds', label: '30 SEC', probability: 15, color: '#FF6B6B' },
    { value: 3, type: 'minutes', label: '3 MIN', probability: 15, color: '#4ECDC4' },
    { value: 4, type: 'minutes', label: '4 MIN', probability: 15, color: '#45B7D1' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#96CEB4' },
    { value: 6, type: 'minutes', label: '6 MIN', probability: 10, color: '#FFEEAD' },
    { value: 8, type: 'minutes', label: '8 MIN', probability: 10, color: '#D4A5A5' },
    { value: 9, type: 'minutes', label: '9 MIN', probability: 10, color: '#9B59B6' },
    { value: 7, type: 'minutes', label: '7 MIN', probability: 5, color: '#3498DB' },
    { value: 11, type: 'minutes', label: '11 MIN', probability: 5, color: '#E67E22' },
    { value: 10, type: 'minutes', label: '10 MIN', probability: 3, color: '#2ECC71' },
    { value: 20, type: 'minutes', label: '20 MIN', probability: 1, color: '#F1C40F' },
    { value: 1440, type: 'day', label: <span>FREE<br/>DAY!</span>, probability: 1, color: '#E74C3C' }
];*/

const SpinWheel = ({ onComplete, onClose, soundEffects }) => {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [hasSpun, setHasSpun] = useState(false);
    const [prize, setPrize] = useState(null);
    const [shuffledPrizes, setShuffledPrizes] = useState([]);
    const [timeIncrements, setTimeIncrements] = useState([]);
    const [spinPhase, setSpinPhase] = useState('initial'); // 'initial', 'spinning', 'slowing'

    // Fisher-Yates shuffle algorithm
    const shuffleArray = (array) => {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    };

    // Shuffle prizes when component mounts
    useEffect(() => {
        setShuffledPrizes(shuffleArray(PRIZES));
    }, []); // Empty dependency array means this runs once on mount

    const spinWheel = () => {
        setIsSpinning(true);
        setSpinPhase('spinning');
        
        // Start sound effects
        let interval = 50;
        let soundInterval;

        const playTickSound = () => {
            soundEffects.play('gameAction');
            interval += 20;

            if (interval <= 500) {
                soundInterval = setTimeout(playTickSound, interval);
            }
        };

        playTickSound();

        // Calculate final position (same as before)
        const totalWeight = shuffledPrizes.reduce((sum, prize) => sum + prize.probability, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize;
        
        for (const prize of shuffledPrizes) {
            random -= prize.probability;
            if (random <= 0) {
                selectedPrize = prize;
                break;
            }
        }

        const prizeIndex = shuffledPrizes.indexOf(selectedPrize);
        const segmentSize = 360 / shuffledPrizes.length;
        const finalRotation = 1440 + (210 - ((prizeIndex * segmentSize) + (segmentSize / 2)));

        // First phase: Fast spinning
        setRotation(rotation => rotation + 1440); // 4 full rotations
        
        // After 2 seconds, start the slowdown phase
        setTimeout(() => {
            setSpinPhase('slowing');
            setRotation(finalRotation);
            
            // Rest of the prize handling logic after 5 more seconds
            setTimeout(() => {
                if (selectedPrize.type === 'day') {
                    onComplete({ 
                        value: 0, 
                        type: 'day',
                        isIncrement: true 
                    });
                    soundEffects.play('gameWon');
                }
                clearTimeout(soundInterval);
                soundEffects.play('success');

                // Convert prize value to seconds for consistent handling
                let totalSeconds;
                if (selectedPrize.type === 'seconds') {
                    totalSeconds = selectedPrize.value;
                } else if (selectedPrize.type === 'minutes') {
                    totalSeconds = selectedPrize.value * 60;
                }

                // Calculate number of 30-second increments
                const increments = Math.ceil(totalSeconds / 30);
                let currentIncrement = 0;

                // Award time in 30-second increments
                const awardInterval = setInterval(() => {
                    if (currentIncrement < increments) {
                        const secondsToAdd = Math.min(30, totalSeconds - (currentIncrement * 30));
                        onComplete({ 
                            value: secondsToAdd, 
                            type: 'seconds',
                            isIncrement: true 
                        });
                        soundEffects.play('goodMove');
                        
                        // Add new increment element with unique ID
                        const newIncrement = {
                            id: Date.now(),
                            value: '+30'
                        };
                        setTimeIncrements(prev => [...prev, newIncrement]);
                        
                        // Remove increment after animation completes
                        setTimeout(() => {
                            setTimeIncrements(prev => prev.filter(inc => inc.id !== newIncrement.id));
                        }, 500); // Match animation duration

                        currentIncrement++;
                    } else {
                        clearInterval(awardInterval);
                        setIsSpinning(false);
                        setHasSpun(true);
                    }
                }, 170); // 5 times per second (200ms)

            }, 5000);
        }, 2000);
    };

    // Handle click outside - only if not spinning and has already spun
    const handleOverlayClick = (e) => {
        if (!isSpinning && hasSpun && e.target.className === 'spin-wheel-container') {
            onClose();
        }
    };

    const handlePostSpinClick = () => {
        // Find and click the ad button
        const adButton = document.querySelector('.ad-btn');
        if (adButton) {
            // Reset states before closing
            setRotation(0);
            setIsSpinning(false);
            setHasSpun(false);
            setPrize(null);
            setShuffledPrizes(shuffleArray(PRIZES));
            // Then close and click ad button
            onClose();
            adButton.click();
        }
    };

    // Use shuffledPrizes in the render method
    return (
        <div className="spin-wheel-container" onClick={handleOverlayClick}>
            <div className="spin-wheel-overlay">
                <div className="spin-wheel">
                    <div 
                        className="wheel" 
                        style={{ 
                            transform: `rotate(${rotation}deg)`,
                            transition: spinPhase === 'initial' ? 'none' :
                                      spinPhase === 'spinning' ? 'transform 2s linear' :
                                      'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
                        }}
                    >
                        {shuffledPrizes.map((prize, index) => (
                            <div 
                                key={index}
                                className="prize-segment"
                                style={{ 
                                    transform: `rotate(${index * (360 / shuffledPrizes.length)}deg)`,
                                    backgroundColor: prize.color,
                                    borderColor: prize.color,
                                }}
                            >
                                <div className={`segment-content ${prize.type === 'day' ? 'freeDay' : ''}`}>
                                    <span>{prize.label}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="pointer">
                        <div className="pointer-head"></div>
                    </div>
                </div>
                <button 
                    className="spin-button" 
                    onClick={hasSpun ? handlePostSpinClick : spinWheel} 
                    disabled={isSpinning}
                >
                    {isSpinning ? 'Spinning...' : 
                     hasSpun ? '📺 Watch to Spin! 🎡' : 
                     'SPIN!'}
                </button>
                {!isSpinning && hasSpun && (
                    <button className="close-button" onClick={onClose}>✕</button>
                )}
                
                {/* Render floating +30s */}
                {timeIncrements.map(increment => (
                    <div 
                        key={increment.id}
                        className="time-increment"
                    >
                        {increment.value}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SpinWheel; 