// src/components/Wrapper.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCog } from 'react-icons/fa';
import { AdMob, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { AppTrackingTransparency } from 'capacitor-plugin-app-tracking-transparency';
import 'cordova-plugin-purchase';
import MainMenu from './MainMenu';
import Solitaire from './Solitaire';
import SnakeGame from './SnakeGame';
import SudokuGame from './SudokuGame';
import _2048Game from './2048Game';
import TicTacToe from './TicTacToe';
import AsteroidsGame from './AsteroidsGame';
import PongGame from './PongGame';
import CheckersGame from './CheckersGame';
import ChessGame from './ChessGame';
import FlappyBird from './FlappyBird';
import BreakoutGame from './BreakoutGame';
import MemoryGame from './MemoryGame';
import HangmanGame from './HangmanGame';
import SimonGame from './SimonGame';
import TriviaGame from './TriviaGame';
import SpiderSolitaire from './SpiderSolitaire';
import Freecell from './Freecell';
import Bejeweled from './Bejeweled';
import BubbleShooter from './BubbleShooter';
import PlatformRunnerGame from './PlatformRunnerGame';
import WordScrambleGame from './WordScrambleGame';
import WordBuilderGame from './WordBuilderGame';
import WordGridGame from './WordGridGame';
import WordLadderGame from './WordLadderGame';
import FallingBlocksGame from './FallingBlocksGame';
import WordleGame from './WordleGame';
import PatternMatchGame from './PatternMatchGame';
import BlockPuzzleGame from './BlockPuzzleGame';
import MinesweeperGame from './MinesweeperGame';
import CarGridGame from './CarGridGame';
import LetterScramble from './LetterScramble';
import RapidFireGame from './RapidFireGame';
import SoundTestGame from './SoundTestGame';
import CannonLaunchGame from './CannonLaunchGame';
import './Wrapper.css';

import { Howl } from 'howler';
import SpinWheel from './SpinWheel';
//import { ScreenOrientation } from '@capacitor/screen-orientation';
//import { StatusBar } from '@capacitor/status-bar';
//import { Screen } from '@capacitor/screen';
//import { StatusBar } from '@capacitor/status-bar';
 
// Import sound effects
import playButtonSound from '../soundfx/play_button.mp3';
import generalButtonSound from '../soundfx/general_button.mp3';
import gameActionSound from '../soundfx/game_action.mp3';
import gameActionSound5 from '../soundfx/game_action-5.mp3';
import gameActionSound8 from '../soundfx/game_action-8.mp3';
import gameActionSound12 from '../soundfx/game_action-12.mp3';
import woodenClickSound from '../soundfx/wooden_click.mp3';
import woodenClickSound2 from '../soundfx/wooden_click2.mp3';
import gameOverSound from '../soundfx/game_over.mp3';
import gameWonSound from '../soundfx/game_won.mp3';
import lazerSound from '../soundfx/lazer.mp3';
import boomSound from '../soundfx/boom.mp3';
import shortBoomSound from '../soundfx/short_boom.mp3';
import cardSound from '../soundfx/card.mp3';
import casualLoop from '../soundfx/casual-loop.ogg';


const Wrapper = () => {
    const [playtime, setPlaytime] = useState(() => {
        const savedPlaytime = localStorage.getItem('playtime');
        return savedPlaytime !== null ? parseInt(savedPlaytime) : 300; // 300 seconds = 5 minutes
    });
    const [currentView, setCurrentView] = useState('mainMenu');
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gamePaused, setGamePaused] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isGameModalOpen, setIsGameModalOpen] = useState(false);
    const [wordList, setWordList] = useState([]);
    const [wordListFull, setWordListFull] = useState([]);
    const [inappropriateWords, setInappropriateWords] = useState(new Set());
    const [showSettings, setShowSettings] = useState(false);
    const [isNoSound, setIsNoSound] = useState(() => {
        const saved = localStorage.getItem('isNoSound');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isNoMusic, setIsNoMusic] = useState(() => {
        const saved = localStorage.getItem('isNoMusic');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [isAdLoading, setIsAdLoading] = useState(false);
    const [showAdInfoBanner, setShowAdInfoBanner] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [lastSpinDate, setLastSpinDate] = useState(() => {
        return localStorage.getItem('lastSpinDate') || null;
    });
    const [isSpinning, setIsSpinning] = useState(false);
    const [showSpinWheel, setShowSpinWheel] = useState(false);
    const [freePlayDay, setFreePlayDay] = useState(() => {
        return localStorage.getItem('freePlayDay') || null;
    });
    const [mainMenuClickCount, setMainMenuClickCount] = useState(() => {
        return parseInt(localStorage.getItem('mainMenuClickCount') || '0');
    });
    const [feedbackLastShown, setFeedbackLastShown] = useState(() => {
        return localStorage.getItem('feedbackLastShown') || null;
    });
    const [isDoneFeedback, setIsDoneFeedback] = useState(() => {
        return localStorage.getItem('isDoneFeedback') === 'true';
    });

    // Create a sound effect object
    const soundEffects = useMemo(() => ({
        playButton: new Howl({ src: [playButtonSound] }),
        generalButton: new Howl({ src: [generalButtonSound] }),
        gameAction: new Howl({ src: [gameActionSound] }),
        gameAction5: new Howl({ src: [gameActionSound5] }),
        gameAction8: new Howl({ src: [gameActionSound8] }),
        gameAction12: new Howl({ src: [gameActionSound12] }),
        goodMove: new Howl({ src: [woodenClickSound] }),
        badMove: new Howl({ src: [woodenClickSound2] }),
        gameOver: new Howl({ src: [gameOverSound] }),
        gameWon: new Howl({ src: [gameWonSound] }),
        lazer: new Howl({ src: [lazerSound] }),
        boom: new Howl({ src: [boomSound] }),
        shortBoom: new Howl({ src: [shortBoomSound] }),
        card: new Howl({ src: [cardSound] }),

        play: function (soundName) {
            if (!isNoSound && this[soundName]) {
                this[soundName].play();
            } else {
                console.warn(`Sound effect "${soundName}" not found.`);
            }
        },

        stop: function (soundName) {
            if (this[soundName]) {
                this[soundName].stop();
            } else {
                console.warn(`Sound effect "${soundName}" not found.`);
            }
        },

        isPlaying: function (soundName) {
            if (this[soundName]) {
                return this[soundName].playing();
            } else {
                console.warn(`Sound effect "${soundName}" not found.`);
                return false;
            }
        }
    }), [isNoSound]);
    

    const incrementTimesPlayed = useCallback((gameId) => {
        const timesPlayed = parseInt(localStorage.getItem(`${gameId}_timesPlayed`) || '0', 10);
        const newTimesPlayed = timesPlayed + 1;
        localStorage.setItem(`${gameId}_timesPlayed`, newTimesPlayed.toString());
    }, []);

    /*const enableFullScreen = async () => {
        await StatusBar.hide();
    };    
    enableFullScreen();    */

    useEffect(() => {
        const handleAppState = () => {
            if (currentView !== 'mainMenu') {
                openModal();
            }
        };
    
        // Add listeners for when app goes to background
        App.addListener('appStateChange', ({ isActive }) => {
            if (!isActive) {
                handleAppState();
            }
        });
    
        // Cleanup listeners when component unmounts
        return () => {
            App.removeAllListeners();
        };
    }, [currentView]);

    useEffect(() => {
        const initializeStore = async () => {
            if (!window.CdvPurchase) {
                console.error('CdvPurchase not available');
                return;
            }

            const store = window.CdvPurchase.store;
            console.log('Starting store initialization...');

            try {
                // Define platform-specific product IDs
                const androidProductId = 'one_hour_playtime';  // Your Google Play product ID
                const iosProductId = 'one_hour_playtime';      // Your App Store product ID

                console.log('Registering products...');
                // In initializeStore, register multiple products
                await store.register([
                    {
                    id: 'one_hour_playtime', // same as before
                    type: store.CONSUMABLE,
                    platform: [
                        {
                        id: 'one_hour_playtime', 
                        type: store.CONSUMABLE,
                        platform: store.GOOGLE_PLAY
                        },
                        {
                        id: 'one_hour_playtime', 
                        type: store.CONSUMABLE,
                        platform: store.APPLE_APPSTORE
                        }
                    ]
                    },
                    {
                    id: 'three_hours_playtime',
                    type: store.CONSUMABLE,
                    platform: [
                        {
                        id: 'three_hours_playtime',  // or your actual product ID in Play Console
                        type: store.CONSUMABLE,
                        platform: store.GOOGLE_PLAY
                        },
                        {
                        id: 'three_hours_playtime',  // same for iOS if you want
                        type: store.CONSUMABLE,
                        platform: store.APPLE_APPSTORE
                        }
                    ]
                    },
                    {
                    id: 'five_hours_playtime',
                    type: store.CONSUMABLE,
                    platform: [
                        {
                        id: 'five_hours_playtime',
                        type: store.CONSUMABLE,
                        platform: store.GOOGLE_PLAY
                        },
                        {
                        id: 'five_hours_playtime',
                        type: store.CONSUMABLE,
                        platform: store.APPLE_APPSTORE
                        }
                    ]
                    }
                ]);
  

                // Wait for store to be ready
                console.log('Waiting for store to be ready...');
                await new Promise((resolve) => {
                    store.ready(() => {
                        console.log('Store is ready');
                        resolve();
                    });
                });

                // Initialize the store
                console.log('Initializing store...');
                await store.initialize([store.GOOGLE_PLAY, store.APPLE_APPSTORE]);

                // after store.initialize()
                store.on("product-updated", (product) => {
                    console.log("Product updated:", product.id, product.state, product.owned);
                    
                    // If the user just purchased, do your "consumption" logic.
                    if (product.id === "one_hour_playtime" && product.owned) {
                    // Add +1 hour to your state
                    setPlaytime(prev => prev + 60 * 60);
                    // For a consumable, finish/consume it:
                    product.finish();
                    }
                
                    if (product.id === "three_hours_playtime" && product.owned) {
                    setPlaytime(prev => prev + 3 * 60 * 60);
                    product.finish();
                    }
                
                    if (product.id === "five_hours_playtime" && product.owned) {
                    setPlaytime(prev => prev + 5 * 60 * 60);
                    product.finish();
                    }
                });
  

                // Update the store
                console.log('Updating store...');
                await store.update();

                // Verify the products are loaded
                const products = await store.products;
                console.log('Products after initialization:', products);

                if (products.length === 0) {
                    console.error('No products were loaded');
                } else {
                    products.forEach(p => {
                        console.log('Loaded product:', {
                            id: p.id,
                            title: p.title,
                            platform: p.platform
                        });
                    });
                }

            } catch (error) {
                console.error('Store initialization failed:', error);
                alert('Failed to initialize store: ' + error.message);
            }
        };

        document.addEventListener('deviceready', initializeStore);
        return () => document.removeEventListener('deviceready', initializeStore);
    }, []);

    const buyOneHour = async () => {
        try {
            if (!window.CdvPurchase?.store) {
                throw new Error('Store not available');
            }

            const store = window.CdvPurchase.store;
            
            // Wait for store to be ready if it isn't already
            if (!store.ready) {
                await new Promise((resolve) => {
                    store.ready(resolve);
                });
            }

            // Get all products
            const products = await store.products;
            console.log('Available products:', products);

            // Find the product
            const product = products.find(p => p.id === 'one_hour_playtime');
            console.log('Found product:', product);

            if (!product) {
                // Log all available product IDs to help debug
                console.log('Available product IDs:', products.map(p => p.id));
                throw new Error('Product one_hour_playtime not found');
            }

            // Get the offer
            const offer = product.getOffer();
            console.log('Product offer:', offer);

            if (!offer) {
                throw new Error('No offer available for one_hour_playtime');
            }

            // Place the order
            console.log('Placing order...');
            await store.order(offer);
            console.log('Purchase started for one_hour_playtime');

        } catch (error) {
            console.error('Purchase error:', error);
            alert('Purchase failed: ' + error.message);
        }
    };

    const buyThreeHours = async () => {
        try {
            const store = window.CdvPurchase.store;
            // Wait for store to be ready
            if (!store.ready) await new Promise(resolve => store.ready(resolve));
        
            const product = store.products.find(p => p.id === 'three_hours_playtime');
            if (!product) throw new Error('three_hours_playtime not found');
        
            const offer = product.getOffer();
            if (!offer) throw new Error('No offer available for three_hours_playtime');
        
            await store.order(offer);
            console.log('Purchase started for three_hours_playtime');
        } catch (err) {
            console.error('Purchase error:', err);
        }
    };

    const buyFiveHours = async () => {
        try {
            const store = window.CdvPurchase.store;
            // Wait for store to be ready
            if (!store.ready) await new Promise(resolve => store.ready(resolve));
        
            const product = store.products.find(p => p.id === 'five_hours_playtime');
            if (!product) throw new Error('five_hours_playtime not found');
        
            const offer = product.getOffer();
            if (!offer) throw new Error('No offer available for five_hours_playtime');
        
            await store.order(offer);
            console.log('Purchase started for five_hours_playtime');
        } catch (err) {
            console.error('Purchase error:', err);
        }
    };
      

    /*const buyThreeHours = () => {
        if (window.CdvPurchase && window.CdvPurchase.store) {
            const store = window.CdvPurchase.store;
            store.get()
            store.order('three_hours_playtime')
                .then(() => {
                    console.log('Purchase started for three_hours_playtime');
                })
                .catch((error) => {
                    console.error('Purchase failed:', error);
                    alert('Purchase failed: ' + error.message);
                });
        } else {
            alert('In-app purchases not available');
        }
    };

    const buyFiveHours = () => {
        if (window.CdvPurchase && window.CdvPurchase.store) {
            const store = window.CdvPurchase.store;
            store.order('five_hours_playtime')
                .then(() => {
                    console.log('Purchase started for five_hours_playtime');
                })
                .catch((error) => {
                    console.error('Purchase failed:', error);
                    alert('Purchase failed: ' + error.message);
                });
        } else {
            alert('In-app purchases not available');
        }
    };*/

    useEffect(() => {
        const initializeAdMob = async () => {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                //testingDevices: ['EMULATOR'], // Remove this in production
                initializeForTesting: false, // Remove this in production
            });
        };
    
        initializeAdMob();
        soundEffects.play('playButton');
    }, []);
    
    useEffect(() => {
      const requestTracking = async () => {
        if (Capacitor.getPlatform() === 'ios') {
          const status = await AppTrackingTransparency.getStatus();

          if (status === 'notDetermined') {
            await AppTrackingTransparency.requestPermission();
          }
        }
      };

      requestTracking();
    }, []);

    useEffect(() => {
        // First load inappropriate words
        fetch('/inappropriateWordList.txt')
          .then(response => response.text())
          .then(text => {
            const inappropriate = new Set(
              text.split('\n')
                .map(word => word.trim().toLowerCase().replace(/\r/g, ''))
                .filter(word => word !== '')
            );
            setInappropriateWords(inappropriate);

            // Then load and filter the other word lists
            Promise.all([
              fetch('/wordList.txt'),
              fetch('/wordListFull.txt')
            ])
              .then(([wordListResponse, wordListFullResponse]) => 
                Promise.all([wordListResponse.text(), wordListFullResponse.text()])
              )
              .then(([wordListText, wordListFullText]) => {
                // Filter wordList
                const filteredWordList = wordListText
                  .split('\n')
                  .map(word => word.trim().toLowerCase().replace(/\r/g, ''))
                  .filter(word => 
                    word !== '' && 
                    !inappropriate.has(word) &&
                    /^[a-z]+$/.test(word)  // Only allow a-z letters
                  );
                setWordList(filteredWordList);

                // Filter wordListFull
                const filteredWordListFull = wordListFullText
                  .split('\n')
                  .map(word => word.trim().toLowerCase().replace(/\r/g, ''))
                  .filter(word => 
                    word !== '' && 
                    !inappropriate.has(word) &&
                    /^[a-z]+$/.test(word)  // Only allow a-z letters
                  );
                setWordListFull(filteredWordListFull);
              });
          })
          .catch(error => console.error('Error loading word lists:', error));
    }, []);

    useEffect(() => {
        localStorage.setItem('playtime', playtime.toString());
    }, [playtime]);

    /*useEffect(() => {
        // This effect runs once when the component mounts (app opens)
        const handleDeviceReady = () => {
            if (window.StatusBar) {
                window.StatusBar.hide();  // Hide status bar
            }
            // Enable immersive mode
            ScreenOrientation.lock({ orientation: 'portrait' });
        };

        // Add the event listener
        document.addEventListener('deviceready', handleDeviceReady, false);

        // Cleanup function to remove the event listener when component unmounts
        return () => {
            document.removeEventListener('deviceready', handleDeviceReady, false);
        };
    }, []);*/

    useEffect(() => {
        let timer;
        if (isTimerActive && !gamePaused && playtime > 0 && !isFreePlayDay()) {
            timer = setInterval(() => {
                setPlaytime(prev => {
                    const newTime = prev - 1;
                    if (newTime <= 0) {
                        // Stop timer and open modal when time runs out
                        clearInterval(timer);
                        setIsTimerActive(false);
                        openModal();
                        return 0; // Ensure we don't go negative
                    }
                    return newTime;
                });
            }, 1000);
        }

        return () => clearInterval(timer);
    }, [isTimerActive, gamePaused, playtime]);

    useEffect(() => {
        const checkDate = () => {
            if (freePlayDay) {
                const savedDate = new Date(freePlayDay).setHours(0, 0, 0, 0);
                const today = new Date().setHours(0, 0, 0, 0);
                if (savedDate < today) {
                    setFreePlayDay(null);
                    localStorage.removeItem('freePlayDay');
                }
            }
        };

        // Check immediately
        checkDate();

        // Check every minute
        const interval = setInterval(checkDate, 60000);
        return () => clearInterval(interval);
    }, [freePlayDay]);

    const handleMainMenuClick = () => {
        soundEffects.play('generalButton');
        setCurrentView('mainMenu');
        setIsTimerActive(false);
        setGamePaused(false);

        // Increment click counter
        const newCount = mainMenuClickCount + 1;
        setMainMenuClickCount(newCount);
        localStorage.setItem('mainMenuClickCount', newCount);

        // Show feedback if conditions are met
        if (shouldShowFeedback()) {
            setTimeout(() => {
                setShowFeedback(true);
                const today = new Date().toISOString();
                setFeedbackLastShown(today);
                localStorage.setItem('feedbackLastShown', today);
            }, 500);
        }
    };

    const startGame = (gameId) => {
        console.log('Starting game:', gameId);  // Add this line
        if (playtime > 0) {
            soundEffects.play('playButton');
            setCurrentView(gameId);
            setIsTimerActive(true);
            setGamePaused(false);
        } else {
            soundEffects.play('generalButton');
            openModal();
        }
    };

    // Wrap resumeGameIfNeeded with useCallback
    const closeModal = useCallback(() => {
        soundEffects.play('generalButton');
        setIsModalOpen(false);
        setShowAdInfoBanner(false);
        if (currentView !== 'mainMenu' && playtime > 0) {
            setGamePaused(false);
            setIsTimerActive(true);
        }
    }, [soundEffects, currentView, playtime]);

    const resumeGameIfNeeded = useCallback(() => {
        if (currentView !== 'mainMenu') {
            setGamePaused(false);
            setIsTimerActive(true);
        }
        closeModal();
    }, [currentView, closeModal]);

    const watchAdForPlaytime = async () => {
        if (isAdLoading === 'loading') return;
        
        setIsAdLoading('loading');
        soundEffects.play('playButton');

        // Check if running in browser
        if (Capacitor.getPlatform() === 'web') {
            alert('Ad watching testing placeholder');
            setShowSpinWheel(true);
            setIsAdLoading('completed');
            setShowAdInfoBanner(true);
            
            // Reset only the completion state after 5 seconds
            setTimeout(() => {
                setIsAdLoading(false);
            }, 5000);
            return;
        }

        // Mobile platform code continues here
        AdMob.removeAllListeners();
        console.log('Removed all listeners');

        // Flag to track if reward was given
        let wasRewarded = false;

        AdMob.addListener('onRewardedVideoAdReward', (rewardItem) => {
            console.log('User rewarded:', rewardItem);
            //setPlaytime(prevTime => prevTime + 300);
            setShowSpinWheel(true);
            setIsAdLoading('completed');
            setShowAdInfoBanner(true);
            wasRewarded = true;
            
            // Reset only the completion state after 5 seconds
            setTimeout(() => {
                setIsAdLoading(false);
            }, 5000);
        });

        AdMob.addListener('onRewardedVideoAdDismissed', () => {
            console.log('Rewarded video ad closed');
            // If ad was closed without getting reward, reset the button
            if (!wasRewarded) {
                setIsAdLoading(false);
            }
        });

        try {
            const platformAdId = Capacitor.getPlatform() === 'ios'
                ? 'ca-app-pub-4245111308957363/2991530467' // iOS Ad Unit ID
                : 'ca-app-pub-4245111308957363/4925944147'; // Android Ad Unit ID

            await AdMob.prepareRewardVideoAd({
                adId: platformAdId,
                isTesting: false,
            });

            console.log('Showing rewarded ad');
            await AdMob.showRewardVideoAd();

        } catch (error) {
            console.error('Error loading/showing rewarded ad:', error);
            alert('Failed to load ad. Please try again later.');
            setIsAdLoading(false);
        }
    };

    const openModal = () => {
        soundEffects.play('generalButton');
        setIsModalOpen(true);
        setGamePaused(true);
        setIsTimerActive(false);
    };    

    const purchaseTime = (minutes) => {
        soundEffects.play('playButton');
        setPlaytime(prevTime => prevTime + minutes * 60);
        resumeGameIfNeeded();
    };

    const getPlaytimeClass = () => {
        if (isFreePlayDay()) {
            return 'playtime-blue-light';
        } else if (playtime <= 60) {
            return isTimerActive ? 'playtime-red-dark' : 'playtime-red-light';
        } else if (playtime <= 300) {
            return isTimerActive ? 'playtime-yellow-dark' : 'playtime-yellow-light';
        } else {
            return isTimerActive ? 'playtime-blue-dark' : 'playtime-blue-light';
        }
    };

    const showGameModal = (game) => {
        soundEffects.play('generalButton');
        setSelectedGame(game);
        setIsGameModalOpen(true);
    };

    const closeGameModal = (playSound = true) => {
        if (playSound) {
            soundEffects.play('generalButton');
        }
        setIsGameModalOpen(false);
        setSelectedGame(null);
    };

    const startSelectedGame = () => {
        if (selectedGame) {
            incrementTimesPlayed(selectedGame.id);
            startGame(selectedGame.id);
            closeGameModal(false); // Close modal without playing sound
        }
    };

    useEffect(() => {
        const handleClickOutside = () => {
            if (showSettings) {
                setShowSettings(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showSettings]);

    // Add these effects to save changes
    useEffect(() => {
        localStorage.setItem('isNoSound', JSON.stringify(isNoSound));
    }, [isNoSound]);

    useEffect(() => {
        localStorage.setItem('isNoMusic', JSON.stringify(isNoMusic));
    }, [isNoMusic]);

    // Inside your component, create the background music object with useMemo
    const backgroundMusic = useMemo(() => new Howl({
        src: [casualLoop],
        loop: true,
        volume: 0.5  // Adjust volume as needed
    }), []);

    // Add an effect to handle music playback based on isNoMusic
    useEffect(() => {
        if (isNoMusic) {
            backgroundMusic.stop();
        } else {
            backgroundMusic.play();
        }

        // Cleanup when component unmounts
        return () => {
            backgroundMusic.stop();
        };
    }, [isNoMusic, backgroundMusic]);

    // Add this helper function near the top of your component
    const formatPlaytime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };

    // Add this debug function to your component
    const logStoreStatus = () => {
        if (window.CdvPurchase?.store) {
            const store = window.CdvPurchase.store;
            console.log({
                storeReady: store.ready,
                productsAvailable: store.products.length,
                products: store.products.map(p => ({
                    id: p.id,
                    platform: p.platform,
                    type: p.type
                }))
            });
        } else {
            console.log('Store not available');
        }
    };

    // Add this useEffect to periodically check store status
    useEffect(() => {
        const interval = setInterval(logStoreStatus, 5000);
        return () => clearInterval(interval);
    }, []);

    const handlePurchaseClick = () => {
        soundEffects.play('generalButton');
        alert('In-app purchases coming soon! For now, please enjoy free playtime by watching ads.');
    };

    // Update the screen tap handler
    useEffect(() => {
        const handleScreenTap = (e) => {
            // Handle taps when playtime is 0 and not on main menu
            if (playtime <= 0 && currentView !== 'mainMenu' && !isModalOpen) {
                // Flash the playtime display
                const playtimeDisplay = document.querySelector('.playtime-display');
                if (playtimeDisplay) {
                    playtimeDisplay.classList.add('flash');
                    setTimeout(() => {
                        playtimeDisplay.classList.remove('flash');
                    }, 500);
                }
                
                // Open the modal and pause the game
                openModal();
                setGamePaused(true);
                setIsTimerActive(false);
                
                // Prevent default behavior and stop propagation
                e.preventDefault();
                e.stopPropagation();
            }
        };

        // Add the event listener to the document
        document.addEventListener('click', handleScreenTap, true);
        document.addEventListener('touchstart', handleScreenTap, true);

        return () => {
            document.removeEventListener('click', handleScreenTap, true);
            document.removeEventListener('touchstart', handleScreenTap, true);
        };
    }, [playtime, currentView, isModalOpen, openModal]);

    // Add this useEffect to load saved playtime when app starts
    useEffect(() => {
        const savedPlaytime = localStorage.getItem('playtime');
        if (savedPlaytime !== null) {
            setPlaytime(parseInt(savedPlaytime));
        }
    }, []); // Empty dependency array means this runs once on mount

    // Function to check if free spin is available
    const isFreeSpinAvailable = () => {
        //return true;
        if (!lastSpinDate) return true;
        const lastDate = new Date(lastSpinDate).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        return lastDate < today;
    };

    // Modify the button text/display
    const getSpinButtonText = () => {
        if (isFreeSpinAvailable()) {
            return '🎉 Daily Spin Freebie! 🎡';
        }
        return '📺 Watch to Spin! 🎡';
    };

    const handleSpinClick = async () => {
        if (isFreeSpinAvailable()) {
            setShowSpinWheel(true);
        } else {
            // Show ad first
            try {
                await watchAdForPlaytime();
                //setShowSpinWheel(true);
            } catch (error) {
                console.error('Ad failed to show:', error);
            }
        }
    };

    const handleSpinComplete = (prize) => {
        if (prize.type === 'day') {
            // Save free play day
            //alert('Free play day!');
            const today = new Date().toISOString();
            setFreePlayDay(today);
            localStorage.setItem('freePlayDay', today);
        } else {
            // Handle normal time prizes
            let additionalTime = prize.value;
            if (prize.type === 'minutes') {
                additionalTime *= 60; // Convert to seconds
            }
            setPlaytime(prev => prev + additionalTime);
            //setPlaytime(15);
        }
        
        // Update last spin date
        const today = new Date().toISOString();
        setLastSpinDate(today);
        localStorage.setItem('lastSpinDate', today);
    };

    // Add function to check if today is a free play day
    const isFreePlayDay = () => {
        if (!freePlayDay) return false;
        const savedDate = new Date(freePlayDay).setHours(0, 0, 0, 0);
        const today = new Date().setHours(0, 0, 0, 0);
        return savedDate === today;
    };

    // Add function to check if feedback should be shown
    const shouldShowFeedback = () => {
        if (isDoneFeedback) return false;
        
        if (feedbackLastShown) {
            const lastShownDate = new Date(feedbackLastShown).setHours(0, 0, 0, 0);
            const today = new Date().setHours(0, 0, 0, 0);
            if (lastShownDate === today) return false;
        }

        return mainMenuClickCount >= 3;
    };

    // Pass these functions to MainMenu
    const handleFeedbackComplete = () => {
        setIsDoneFeedback(true);
        localStorage.setItem('isDoneFeedback', 'true');
        setShowFeedback(false);
    };

    return (
        <div className="wrapper">
            <div className="header">
                {currentView !== 'mainMenu' ? (
                    <button className="main-menu-btn" onClick={handleMainMenuClick}>
                        Main Menu
                    </button>
                ) : (
                    <div className="settings-container">
                        <button 
                            className="settings-btn" 
                            onClick={(e) => {
                                e.stopPropagation();
                                soundEffects.play('generalButton');
                                setShowSettings(!showSettings);
                            }}
                        >
                            <FaCog />
                        </button>
                        {showSettings && (
                            <div className="settings-dropdown" onClick={e => e.stopPropagation()}>
                                <button onClick={() => {
                                    setIsNoSound(!isNoSound);
                                    soundEffects.play('generalButton');
                                }}>
                                    Sound: <span className={isNoSound ? 'status-off' : 'status-on'}>
                                        {isNoSound ? 'OFF' : 'ON'}
                                    </span>
                                </button>
                                <button onClick={() => {
                                    if (isNoMusic) {
                                        setIsNoMusic(false);
                                        setTimeout(() => {
                                            soundEffects.play('generalButton');
                                        }, 0);
                                    } else {
                                        setIsNoMusic(true);
                                    }
                                }}>
                                    Music: <span className={isNoMusic ? 'status-off' : 'status-on'}>
                                        {isNoMusic ? 'OFF' : 'ON'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
                <div className={`playtime-display ${getPlaytimeClass()} ${isFreePlayDay() ? 'lineThru' : ''}`} >
                    {`${isFreePlayDay() ? 'FREE PLAY! ' : 'Playtime: '}`} {formatPlaytime(playtime)}
                </div>
            </div>

            <div className="content">
                {currentView === 'mainMenu' && (
                    <MainMenu 
                        showGameModal={showGameModal}
                        showFeedback={showFeedback}
                        setShowFeedback={setShowFeedback}
                        onFeedbackComplete={handleFeedbackComplete}
                    />
                )}
                {currentView === 'solitaire' && 
                    <Solitaire 
                        playtime={playtime} 
                        gamePaused={gamePaused}  
                        setIsTimerActive={setIsTimerActive}
                        soundEffects={soundEffects}
                    />
                }
                {currentView === 'snake' && 
                    <SnakeGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'sudoku' && 
                    <SudokuGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === '2048' && 
                    <_2048Game 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'ticTacToe' && 
                    <TicTacToe 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'asteroids' && 
                    <AsteroidsGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'pong' && 
                    <PongGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'checkers' && 
                    <CheckersGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'chess' && 
                    <ChessGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'flappyBird' && 
                    <FlappyBird 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive}
                        soundEffects={soundEffects}
                    />
                }
                {currentView === 'breakout' && 
                    <BreakoutGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'memory' && 
                    <MemoryGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'hangman' && 
                    <HangmanGame 
                        wordList={wordList} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'simon' && 
                    <SimonGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'trivia' && 
                    <TriviaGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'spiderSolitaire' && 
                    <SpiderSolitaire 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'freecell' && 
                    <Freecell 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'bejeweled' && 
                    <Bejeweled 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'bubbleShooter' && 
                    <BubbleShooter 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'platformRunner' && 
                    <PlatformRunnerGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'wordScramble' && 
                    <WordScrambleGame 
                        wordList={wordList} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'wordBuilder' && 
                    <WordBuilderGame 
                        wordListFull={wordListFull} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'wordGrid' && 
                    <WordGridGame 
                        wordListFull={wordListFull} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'wordLadder' && 
                    <WordLadderGame 
                        wordListFull={wordListFull} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'fallingBlocks' && 
                    <FallingBlocksGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'wordle' && 
                    <WordleGame 
                        wordList={wordListFull} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'patternMatch' && 
                    <PatternMatchGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'blockPuzzle' && 
                    <BlockPuzzleGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'minesweeperGame' && 
                    <MinesweeperGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'carGridGame' && 
                    <CarGridGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'letterScramble' && 
                    <LetterScramble 
                        wordList={wordListFull} 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'rapidFire' && 
                    <RapidFireGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
                {currentView === 'soundTest' && 
                    <SoundTestGame 
                        soundEffects={soundEffects}
                    />
                }
                {currentView === 'cannonLaunch' && 
                    <CannonLaunchGame 
                        playtime={playtime} 
                        gamePaused={gamePaused} 
                        setIsTimerActive={setIsTimerActive} 
                        soundEffects={soundEffects} 
                    />
                }
            </div>

            <div className="footer">
                <button className="get-more-minutes-btn" onClick={openModal}>
                    {currentView !== 'mainMenu' ? 'More Minutes / Pause Game':'Get More Minutes!'}
                </button>
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h2>Get More Minutes</h2>
                        
                        {/* Ad Section */}
                        <div className="modal-section ad-section">
                            <h3>Spin the Playtime Wheel</h3>
                            {/* Show ad info banner based on separate state */}
                            {showAdInfoBanner && (
                                <div className="ad-info-banner">
                                    <i className="fas fa-info-circle"></i>
                                    Spin the wheel more now to bank playtime for offline play!
                                </div>
                            )}
                            <button
                                onClick={handleSpinClick}
                                className="option-btn ad-btn"
                                disabled={isAdLoading === 'loading'}
                                style={{ opacity: isAdLoading === 'loading' ? 0.5 : 1 }}
                            >
                                {getSpinButtonText()}
                            </button>
                            <div className="ad-banking-info">
                                <i className="fas fa-clock"></i>
                                Current Playtime: {formatPlaytime(playtime)}
                            </div>
                        </div>

                        {/* Purchase Section */}
                        <div className="modal-section purchase-section">
                            <h3>Premium Options</h3>
                            <button onClick={handlePurchaseClick} className="option-btn purchase-btn">
                                <i className="fas fa-shopping-cart"></i>
                                Buy +1 Hour ($0.99)
                            </button>
                            <button onClick={handlePurchaseClick} className="option-btn purchase-btn">
                                <i className="fas fa-shopping-cart"></i>
                                Buy +3 Hours ($1.99)
                            </button>
                            <button onClick={handlePurchaseClick} className="option-btn purchase-btn">
                                <i className="fas fa-shopping-cart"></i>
                                Buy +5 Hours ($2.49)
                            </button>
                        </div>

                        <button onClick={closeModal} className="close-btn">
                            Close
                        </button>
                    </div>
                </div>
            )}


            {isGameModalOpen && selectedGame && (
                <div className="modal-overlay" onClick={closeGameModal}>
                    <div className="modal-content game-modal" onClick={e => e.stopPropagation()}>
                        <h2>{selectedGame.name}</h2>
                        <p><strong>Description:</strong> {selectedGame.description}</p>
                        <p><strong>How to Play:</strong> {selectedGame.instructions}</p>
                        <div className="modal-buttons">
                            <button onClick={closeGameModal} className="back-btn">Back</button>
                            <button onClick={startSelectedGame} className="play-btn">Play</button>
                        </div>
                    </div>
                </div>
            )}

            {showSpinWheel && (
                <SpinWheel 
                    onComplete={handleSpinComplete}
                    onClose={() => setShowSpinWheel(false)}
                    soundEffects={soundEffects}
                />
            )}
        </div>
    );
};

export default Wrapper;

