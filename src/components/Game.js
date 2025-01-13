// src/components/Game.js
import React from 'react';
import { useParams } from 'react-router-dom';

const Game = () => {
    const { id } = useParams();

    return (
        <div>
            <h1>Game {id}</h1>
            <p>Placeholder for the game screen.</p>
        </div>
    );
};

export default Game;
