import React, { useState, useEffect } from 'react';
import './TriviaGame.css';

const TriviaGame = ({ playtime, gamePaused, setIsTimerActive, soundEffects }) => {
  const [categories, setCategories] = useState([{ id: 'loading', name: 'Loading...' }]);
  const [selectedCategory, setSelectedCategory] = useState({ id: 'loading', name: 'Loading...' });
  const [selectedDifficulty, setSelectedDifficulty] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [gameStatus, setGameStatus] = useState('loading');
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [newHighScoreReached, setNewHighScoreReached] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0 && selectedCategory.id !== 'loading') {
      resetGame(selectedCategory, selectedDifficulty);
    }
  }, [categories, selectedCategory.id]);

  useEffect(() => {
    const key = `triviaHighScore_${selectedCategory.id}_${selectedDifficulty}`;
    setHighScore(parseInt(localStorage.getItem(key)) || 0);
  }, [selectedCategory, selectedDifficulty]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('https://opentdb.com/api_category.php');
      const data = await response.json();
      console.log(data);
      const firstCategory = data.trivia_categories[0];
      setCategories([{ id: 'offline', name: 'Offline Questions' }, ...data.trivia_categories]);
      setSelectedCategory(firstCategory);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setCategories([{ id: 'offline', name: 'Offline Questions' }]);
      setSelectedCategory({ id: 'offline', name: 'Offline Questions' });
    }
  };

  const fetchQuestions = async (categoryId, difficulty) => {
    if (categoryId === 'offline') {
      setQuestions(shuffleArray(fallbackQuestions));
      setGameStatus('playing');
      return;
    }

    try {
      const url = `https://opentdb.com/api.php?amount=60&type=multiple&category=${categoryId}&difficulty=${difficulty}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.response_code === 0 && data.results.length > 0) {
        const formattedQuestions = data.results.map((q) => formatQuestion(q));
        setQuestions(formattedQuestions);
        setGameStatus('playing');
      } else {
        console.warn('No questions available, using fallback questions');
        setQuestions(shuffleArray(fallbackQuestions));
        setGameStatus('playing');
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions(shuffleArray(fallbackQuestions));
      setGameStatus('playing');
    }
  };

  const formatQuestion = (q) => {
    const answers = [...q.incorrect_answers];
    const randomIndex = Math.floor(Math.random() * 4);
    answers.splice(randomIndex, 0, q.correct_answer);
    return {
      question: decodeHtml(q.question),
      answers: answers.map((ans) => decodeHtml(ans)),
      correctAnswer: decodeHtml(q.correct_answer),
    };
  };

  const decodeHtml = (html) => {
    const txt = document.createElement('textarea');
    txt.innerHTML = html;
    return txt.value;
  };

  const fallbackQuestions = [
    {
      question: 'What is the capital city of France?',
      answers: ['Berlin', 'London', 'Paris', 'Rome'],
      correctAnswer: 'Paris',
    },
    {
      question: 'Which planet is known as the Red Planet?',
      answers: ['Earth', 'Mars', 'Jupiter', 'Venus'],
      correctAnswer: 'Mars',
    },
    {
      question: 'Who wrote "Romeo and Juliet"?',
      answers: ['William Shakespeare', 'Charles Dickens', 'Mark Twain', 'Jane Austen'],
      correctAnswer: 'William Shakespeare',
    },
    {
      question: 'What is the largest ocean on Earth?',
      answers: ['Atlantic Ocean', 'Indian Ocean', 'Arctic Ocean', 'Pacific Ocean'],
      correctAnswer: 'Pacific Ocean',
    },
    {
      question: 'What is the smallest prime number?',
      answers: ['0', '1', '2', '3'],
      correctAnswer: '2',
    },
    {
      question: 'Which element has the chemical symbol "O"?',
      answers: ['Gold', 'Oxygen', 'Silver', 'Iron'],
      correctAnswer: 'Oxygen',
    },
    {
      question: 'What is the hardest natural substance on Earth?',
      answers: ['Gold', 'Iron', 'Diamond', 'Silver'],
      correctAnswer: 'Diamond',
    },
    {
      question: 'In which year did the Titanic sink?',
      answers: ['1912', '1905', '1898', '1923'],
      correctAnswer: '1912',
    },
    {
      question: 'What is the main ingredient in guacamole?',
      answers: ['Tomato', 'Avocado', 'Onion', 'Lime'],
      correctAnswer: 'Avocado',
    },
    {
      question: 'Which country is known as the Land of the Rising Sun?',
      answers: ['China', 'Japan', 'Thailand', 'India'],
      correctAnswer: 'Japan',
    },
    {
      question: 'What is the largest planet in our solar system?',
      answers: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
      correctAnswer: 'Jupiter',
    },
    {
      question: 'Who painted the Mona Lisa?',
      answers: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Claude Monet'],
      correctAnswer: 'Leonardo da Vinci',
    },
    {
      question: 'What is the capital of Italy?',
      answers: ['Venice', 'Rome', 'Milan', 'Florence'],
      correctAnswer: 'Rome',
    },
    {
      question: 'Which language is primarily spoken in Brazil?',
      answers: ['Spanish', 'Portuguese', 'French', 'English'],
      correctAnswer: 'Portuguese',
    },
    {
      question: 'What is the chemical symbol for gold?',
      answers: ['Au', 'Ag', 'Pb', 'Fe'],
      correctAnswer: 'Au',
    },
    {
      question: 'How many continents are there?',
      answers: ['5', '6', '7', '8'],
      correctAnswer: '7',
    },
    {
      question: 'What is the tallest mountain in the world?',
      answers: ['K2', 'Kangchenjunga', 'Mount Everest', 'Lhotse'],
      correctAnswer: 'Mount Everest',
    },
    {
      question: 'Which animal is known as the King of the Jungle?',
      answers: ['Tiger', 'Elephant', 'Lion', 'Giraffe'],
      correctAnswer: 'Lion',
    },
    {
      question: 'What is the smallest country in the world?',
      answers: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'],
      correctAnswer: 'Vatican City',
    },
    {
      question: 'Who discovered penicillin?',
      answers: ['Marie Curie', 'Alexander Fleming', 'Isaac Newton', 'Albert Einstein'],
      correctAnswer: 'Alexander Fleming',
    },
    // Add more questions here
  ];

  // Shuffle function
  function shuffleArray(array) {
    let currentIndex = array.length,
      randomIndex;

    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex],
      ];
    }

    return array;
  }

  const handleAnswerClick = (selectedAnswer) => {
    if (gameStatus !== 'playing' || showFeedback) return;

    const currentQuestion = questions[currentQuestionIndex];
    const correct = selectedAnswer === currentQuestion.correctAnswer;

    setSelectedAnswer(selectedAnswer);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      soundEffects.play('goodMove');
      setScore((prevScore) => {
        const newScore = prevScore + 1;
        if (newScore > highScore) {
          // Save to phone memory
          const key = `triviaHighScore_${selectedCategory.id}_${selectedDifficulty}`;
          localStorage.setItem(key, newScore.toString());
          setHighScore(newScore);
          if (!newHighScoreReached) {
            setNewHighScoreReached(true);
            soundEffects.play('gameWon');
          }
        }
        return newScore;
      });
    } else {
      soundEffects.play('badMove');
      setStrikes((prevStrikes) => prevStrikes + 1);
    }

    const timeoutDuration = correct ? 1000 : 3000;

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      setIsCorrect(null);

      if (!correct && strikes + 1 >= 3) {
        setGameStatus('gameover');
        soundEffects.play('gameOver');
      } else {
        nextQuestion();
      }
    }, timeoutDuration);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
    } else {
      // End of questions, fetch more or end game
      fetchQuestions(selectedCategory.id, selectedDifficulty);
      setCurrentQuestionIndex(0);
    }
  };

  const updateHighScore = () => {
    const key = `triviaHighScore_${selectedCategory.id}_${selectedDifficulty}`;
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem(key, score);
    }
  };

  const restartGame = () => {
    resetGame();
    setNewHighScoreReached(false);
  };

  const resetGame = (category = selectedCategory, difficulty = selectedDifficulty) => {
    setScore(0);
    setStrikes(0);
    setCurrentQuestionIndex(0);
    setGameStatus('loading');
    fetchQuestions(category.id, difficulty);
    const key = `triviaHighScore_${category.id}_${difficulty}`;
    setHighScore(parseInt(localStorage.getItem(key)) || 0);
    setNewHighScoreReached(false);
  };

  const handleCategoryChange = (categoryId) => {
    soundEffects.play('gameAction');
    const selectedCat = categories.find((cat) => cat.id.toString() === categoryId);
    if (selectedCat) {
      setSelectedCategory(selectedCat);
      setNewHighScoreReached(false); // Reset newHighScoreReached
      if (categoryId === 'offline') {
        setSelectedDifficulty('easy');
      }
      resetGame(selectedCat, categoryId === 'offline' ? 'easy' : selectedDifficulty);
    } else {
      console.error('Category not found:', categoryId);
    }
  };

  const handleDifficultyChange = (difficulty) => {
    soundEffects.play('gameAction');
    setSelectedDifficulty(difficulty);
    setNewHighScoreReached(false); // Reset newHighScoreReached
    resetGame(selectedCategory, difficulty);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="trivia-game">
      {gameStatus === 'loading' && <p>Loading questions...</p>}

      <div className="dropdowns">
        {categories.length > 0 && (
          <select
            value={selectedCategory.id}
            onChange={(e) => handleCategoryChange(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        )}

        <select
          value={selectedDifficulty}
          onChange={(e) => handleDifficultyChange(e.target.value)}
          disabled={selectedCategory.id === 'offline'}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {gameStatus === 'playing' && currentQuestion && (
        <>
          <div className="game-header">
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
            <div className="score-container right">
              <div className="score-box">
                <div className="score-label">STRIKES</div>
                <div className="score-value">{strikes} / 3</div>
              </div>
            </div>
          </div>
          <div className="question">
            <p dangerouslySetInnerHTML={{ __html: currentQuestion.question }}></p>
          </div>
          <div className="answers">
            {currentQuestion.answers.map((answer, index) => (
              <button
                key={index}
                onClick={() => handleAnswerClick(answer)}
                className={`answer-button 
                  ${showFeedback && answer === selectedAnswer && isCorrect ? 'correct' : ''}
                  ${showFeedback && answer === selectedAnswer && !isCorrect ? 'incorrect' : ''}
                  ${showFeedback && answer === currentQuestion.correctAnswer && !isCorrect ? 'highlight-correct' : ''}
                `}
                disabled={showFeedback}
              >
                {answer}
              </button>
            ))}
          </div>
        </>
      )}

      {gameStatus === 'gameover' && (
        <div className="game-over">
          <h2>Game Over!</h2>
          <p>Your final score: {score}</p>
          <p>High Score: {highScore}</p>
          <button className="restart-button" onClick={restartGame}>
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default TriviaGame;
