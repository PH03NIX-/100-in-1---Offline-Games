import React, { useState, useEffect, useRef } from 'react';
import './RapidFireGame.css';

function RapidFireGame({ 
  playtime, 
  gamePaused, 
  setIsTimerActive, 
  soundEffects 
}) {
  const [questions, setQuestions] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [score, setScore] = useState(0);
  
  // Timer & game states
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState('ready'); // Changed from 'loading' to 'ready'
  const [showStartButton, setShowStartButton] = useState(true);

  // Refs for intervals
  const timerRef = useRef(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const questionsListRef = useRef(null);

  // High score states
  const [highScore, setHighScore] = useState(0);
  const [newHighScoreReached, setNewHighScoreReached] = useState(false);

  // Remove category-related useEffects and just load high score on mount
  useEffect(() => {
    const key = 'rapidFireHighScore_general';
    setHighScore(parseInt(localStorage.getItem(key)) || 0);
  }, []);

  // Timer management
  useEffect(() => {
    // Clear any existing interval when dependencies change
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Only run timer if game is active and not paused
    if (gameStatus === 'active' && !gamePaused) {
      let interval = 1000; // Default 1 second interval
      
      // Adjust interval based on time remaining
      if (timeLeft <= 2) {
        interval = 125; // 8 times per second (1000/8)
      } else if (timeLeft <= 5) {
        interval = 250; // 4 times per second (1000/4)
      } else if (timeLeft <= 10) {
        interval = 500; // 2 times per second (1000/2)
      }

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          // Play sound based on current time
          if (soundEffects) {
            soundEffects.play('generalButton');
          }
          return prev - (interval/1000); // Decrease time proportionally to interval
        });
      }, interval);
    }

    // Update external timer state
    setIsTimerActive(!gamePaused && gameStatus === 'active');

    // Cleanup on unmount or when dependencies change
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [gamePaused, gameStatus, setIsTimerActive, timeLeft, soundEffects]);

  // If time runs out => game over
  useEffect(() => {
    if (timeLeft <= 0 && gameStatus === 'active') {
      endGame();
    }
  }, [timeLeft, gameStatus]);

  // Add this useEffect to handle scrolling
  useEffect(() => {
    if (questionsListRef.current && gameStatus === 'active') {
      questionsListRef.current.scrollTo({
        top: questionsListRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [currentQuestionIndex, gameStatus]);

  // Fetch a single question from the API (we'll do "easy" difficulty).
  // Once we get it, add it to "questions" array.
  async function fetchInitialQuestions() {
    try {
      const url = `https://opentdb.com/api.php?amount=60&type=boolean&category=9`;
      const resp = await fetch(url);
      const data = await resp.json();

      if (data.response_code === 0 && data.results.length > 0) {
        const formattedQuestions = data.results.map(q => formatQuestion(q));
        setQuestions(formattedQuestions);
      } else {
        console.error('Failed to fetch questions');
      }
    } catch (err) {
      console.error('Error fetching questions:', err);
    }
  }

  function formatQuestion(q) {
    const answers = [...q.incorrect_answers];
    const randomIndex = Math.floor(Math.random() * 4);
    answers.splice(randomIndex, 0, q.correct_answer);

    return {
      question: decodeHtml(q.question),
      answers: ['True', 'False'],
      correctAnswer: decodeHtml(q.correct_answer),
    };
  }

  function decodeHtml(htmlStr) {
    const txt = document.createElement('textarea');
    txt.innerHTML = htmlStr;
    return txt.value;
  }

  // Called when user picks an answer
  function handleAnswer(questionObj, userAnswer) {
    if (gameStatus !== 'active') return;
    if (!questionObj) return;

    const isCorrect = (userAnswer === questionObj.correctAnswer);
    if (isCorrect) {
      if (soundEffects) soundEffects.play('goodMove');
      setScore(prev => {
        const newScore = prev + 1;
        // Check for new high score
        if (newScore > highScore) {
          const key = 'rapidFireHighScore_general';
          localStorage.setItem(key, newScore.toString());
          setHighScore(newScore);
          if (!newHighScoreReached) {
            setNewHighScoreReached(true);
            if (soundEffects) soundEffects.play('gameWon');
          }
        }
        return newScore;
      });
    } else {
      if (soundEffects) soundEffects.play('badMove');
      setTimeLeft(prev => Math.max(prev - 5, 0));
    }

    // Mark question as answered
    const answered = {
      questionObj,
      userAnswer,
      correct: isCorrect
    };
    setAnsweredQuestions(prev => [...prev, answered]);

    // Advance to next question
    setCurrentQuestionIndex(prev => prev + 1);
  }

  // Start the round => hide button, start timer
  function startRound() {
    setShowStartButton(false);
    setGameStatus('loading');
    setAnsweredQuestions([]);
    setQuestions([]);
    setScore(0);
    setCurrentQuestionIndex(0);
    setNewHighScoreReached(false);

    fetchInitialQuestions().then(() => {
      setGameStatus('active');
      setTimeLeft(60);
    });
  }

  function endGame() {
    setGameStatus('gameover');
    if (soundEffects) soundEffects.play('gameOver');

    // Clear interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // For progress bar
  const progressPercent = (Math.ceil(timeLeft) / 60) * 100;

  return (
    <div className="rapidfire-container">
      {/* Score container with high score */}
      <div className="score-container left">
        <div className="score-box">
          <div className="score-label">SCORE</div>
          <div className="score-value">{score}</div>
        </div>
        <div className="score-box">
          <div className="score-label">BEST</div>
          <div className="score-value">{highScore}</div>
        </div>
      </div>

      {gameStatus === 'ready' && (
        <button className="start-button" onClick={startRound}>
          Ready, Set, Go!
        </button>
      )}

      {gameStatus === 'active' && (
        <>
          {/* Timer & progress bar */}
          <div className="timer-container">
            <div className="time-remaining">
              {Math.ceil(timeLeft)}s
            </div>
            <div className="progress-bar-outer">
              <div 
                className={`progress-bar-inner 
                  ${timeLeft <= 10 ? 'danger' : timeLeft <= 30 ? 'warning' : ''}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Questions display section */}
          <div className="questions-list" ref={questionsListRef}>
            {/* Empty block always first */}
            <div className="question-block empty-block"></div>
            
            {/* Show all previous questions up to current index */}
            {questions.slice(0, currentQuestionIndex + 1).map((question, index) => (
              <div key={index} className="question-block">
                <div className="question-number">Question #{index + 1}</div>
                <p className="question-text" 
                   dangerouslySetInnerHTML={{ __html: question.question }} />
                <div className="answers-row">
                  {question.answers.map((ans, i) => {
                    const answeredQ = answeredQuestions.find(
                      aq => aq.questionObj === question
                    );
                    const isAnswered = !!answeredQ;
                    const isSelected = answeredQ && answeredQ.userAnswer === ans;
                    const isCorrect = answeredQ && answeredQ.questionObj.correctAnswer === ans;

                    return (
                      <button
                        key={i}
                        className={`answer-button 
                          ${isAnswered && isSelected && isCorrect ? 'correct' : ''}
                          ${isAnswered && isSelected && !isCorrect ? 'incorrect' : ''}
                          ${isAnswered && !isSelected && ans === question.correctAnswer ? 'highlight-correct' : ''}`}
                        onClick={() => {
                          if (!isAnswered && index === currentQuestionIndex) {
                            handleAnswer(question, ans);
                          }
                        }}
                        disabled={isAnswered || index !== currentQuestionIndex}
                        dangerouslySetInnerHTML={{ __html: ans }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {gameStatus === 'gameover' && (
        <div className="gameover-screen">
          <h2>Time's Up!</h2>
          <p>Your final score: {score}</p>
          <p>High Score: {highScore}</p>
          <button 
            className="restart-button" 
            onClick={() => {
              setGameStatus('ready');
              setShowStartButton(true);
            }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default RapidFireGame;
