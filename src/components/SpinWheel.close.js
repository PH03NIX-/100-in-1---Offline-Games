import React, { useState, useEffect } from 'react';
import './SpinWheel.css';

const PRIZES = [
    { value: 30, type: 'seconds', label: '30 SEC', probability: 15, color: '#FF6B6B' },
    { value: 3, type: 'minutes', label: '3 MIN', probability: 15, color: '#4ECDC4' },
    { value: 3, type: 'minutes', label: '3 MIN', probability: 15, color: '#45B7D1' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#96CEB4' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#FFEEAD' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#D4A5A5' },
    { value: 5, type: 'minutes', label: '5 MIN', probability: 10, color: '#9B59B6' },
    { value: 7, type: 'minutes', label: '7 MIN', probability: 5, color: '#3498DB' },
    { value: 7, type: 'minutes', label: '7 MIN', probability: 5, color: '#E67E22' },
    { value: 10, type: 'minutes', label: '10 MIN', probability: 3, color: '#2ECC71' },
    { value: 20, type: 'minutes', label: '20 MIN', probability: 1, color: '#F1C40F' },
    { value: 1440, type: 'minutes', label: 'FREE DAY!', probability: 1, color: '#E74C3C' }
];

const SpinWheel = ({ onComplete, onClose }) => {
    const [rotation, setRotation] = useState(0);
    const [isSpinning, setIsSpinning] = useState(false);
    const [prize, setPrize] = useState(null);

    const spinWheel = () => {
        setIsSpinning(true);
        
        // Weighted random selection
        const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.probability, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize;
        
        for (const prize of PRIZES) {
            random -= prize.probability;
            if (random <= 0) {
                selectedPrize = prize;
                break;
            }
        }

        // Calculate rotation to land on selected prize
        const prizeIndex = PRIZES.indexOf(selectedPrize);
        const baseRotation = 1440 + (360 / PRIZES.length * prizeIndex);
        setRotation(baseRotation);
        setPrize(selectedPrize);

        // Trigger completion after animation
        setTimeout(() => {
            setIsSpinning(false);
            onComplete(selectedPrize);
        }, 5000);
    };

    return (
        <div className="spin-wheel-container">
            <div className="spin-wheel-overlay">
                <div className="spin-wheel">
                    <div 
                        className="wheel" 
                        style={{ 
                            transform: `rotate(${rotation}deg)`,
                            transition: isSpinning ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
                        }}
                    >
                        {PRIZES.map((prize, index) => (
                            <div 
                                key={index}
                                className="prize-segment"
                                style={{ 
                                    transform: `rotate(${index * (360 / PRIZES.length)}deg)`,
                                    backgroundColor: prize.color,
                                    borderTopColor: prize.color,
                                }}
                            >
                                <div className="segment-content">
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
                    onClick={spinWheel} 
                    disabled={isSpinning}
                >
                    {isSpinning ? 'Spinning...' : 'SPIN!'}
                </button>
                <button className="close-button" onClick={onClose}>✕</button>
            </div>
        </div>
    );
};

export default SpinWheel; 