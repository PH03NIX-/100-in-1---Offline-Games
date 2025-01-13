// src/components/Wrapper.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FaCog } from 'react-icons/fa';
import { AdMob, RewardAdOptions, AdMobRewardItem } from '@capacitor-community/admob';
import { App } from '@capacitor/app';
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
import './Wrapper.css';

import { Howl } from 'howler';
//import { ScreenOrientation } from '@capacitor/screen-orientation';
//import { StatusBar } from '@capacitor/status-bar';
//import { Screen } from '@capacitor/screen';
 
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

const wordList = [
    'abstract', 'adventure', 'airplane', 'alphabet', 'amazing', 'anchor', 'animal', 'answer',
    'apartment', 'apple', 'architect', 'artist', 'astronaut', 'athlete', 'atmosphere', 'autumn',
    'backpack', 'balloon', 'banana', 'baseball', 'basketball', 'beach', 'bicycle', 'birthday',
    'blanket', 'blossom', 'book', 'bottle', 'bridge', 'butterfly', 'cactus', 'calendar',
    'camera', 'candle', 'candy', 'captain', 'carpet', 'carrot', 'castle', 'caterpillar',
    'celebrate', 'chair', 'cheese', 'chocolate', 'circle', 'clock', 'cloud', 'coffee',
    'compass', 'computer', 'cookie', 'crayon', 'crystal', 'cupcake', 'curtain', 'dance',
    'daisy', 'diamond', 'dinosaur', 'dolphin', 'dragon', 'dream', 'drum', 'eagle',
    'earth', 'elephant', 'emerald', 'envelope', 'eraser', 'explorer', 'factory', 'feather',
    'firefly', 'flower', 'forest', 'fountain', 'freedom', 'frog', 'galaxy', 'garden',
    'giraffe', 'glasses', 'globe', 'guitar', 'hamburger', 'hammer', 'happiness', 'harbor',
    'harmony', 'hat', 'heart', 'helicopter', 'horizon', 'horse', 'hospital', 'hurricane',
    'ice cream', 'island', 'jacket', 'jellyfish', 'journey', 'kangaroo', 'keyboard', 'kite',
    'ladder', 'lamp', 'landscape', 'laughter', 'lemon', 'library', 'lighthouse', 'lion',
    'lizard', 'lollipop', 'magic', 'magnet', 'magnolia', 'map', 'marble', 'mask',
    'meadow', 'melody', 'microphone', 'mirror', 'monkey', 'moon', 'mountain', 'mouse',
    'music', 'necklace', 'needle', 'nest', 'notebook', 'ocean', 'octopus', 'orange',
    'orchestra', 'owl', 'paintbrush', 'palace', 'palm tree', 'pancake', 'paper', 'parachute',
    'parade', 'peacock', 'penguin', 'piano', 'picnic', 'pillow', 'pineapple', 'planet',
    'playground', 'popcorn', 'popsicle', 'postcard', 'potato', 'pyramid', 'queen', 'quilt',
    'rabbit', 'rainbow', 'raincoat', 'river', 'robot', 'rocket', 'rose', 'sailboat',
    'sandwich', 'satellite', 'scarf', 'school', 'scissors', 'seashell', 'shark', 'sheep',
    'ship', 'shoe', 'skateboard', 'skeleton', 'smile', 'snowflake', 'soccer', 'socks',
    'spider', 'spoon', 'squirrel', 'starfish', 'strawberry', 'submarine', 'suitcase', 'sunflower',
    'sunshine', 'superhero', 'swing', 'telescope', 'television', 'tennis', 'tent', 'tiger',
    'toothbrush', 'tornado', 'tractor', 'train', 'treasure', 'tree', 'triangle', 'trumpet',
    'turtle', 'umbrella', 'unicorn', 'vacation', 'vampire', 'vanilla', 'vegetable', 'violin',
    'volcano', 'waffle', 'waterfall', 'whale', 'wheel', 'windmill', 'wizard', 'xylophone',
    'yacht', 'yellow', 'zebra', 'zeppelin',
    'accordion', 'acrobat', 'adventure', 'airport', 'alligator', 'alphabet', 'ambulance', 'anchor',
    'antelope', 'aquarium', 'armadillo', 'avocado', 'baboon', 'backpack', 'bagpipe', 'balcony',
    'balloon', 'bamboo', 'banjo', 'barbecue', 'barber', 'barnacle', 'barrel', 'basket',
    'bathtub', 'beacon', 'beehive', 'beetle', 'bicycle', 'binoculars', 'biscuit', 'blender',
    'blossom', 'blueprint', 'blueberry', 'bobsled', 'bonfire', 'bookshelf', 'boomerang', 'bracelet',
    'broccoli', 'bubble', 'bulldozer', 'burrito', 'cactus', 'cafeteria', 'campfire', 'canary',
    'canoe', 'carousel', 'carpenter', 'cartwheel', 'catapult', 'cauliflower', 'cavern', 'centipede',
    'chameleon', 'chandelier', 'chariot', 'cheetah', 'chimpanzee', 'chipmunk', 'chocolate', 'cinnamon',
    'clarinet', 'clipboard', 'cockroach', 'coconut', 'compass', 'computer', 'coral', 'cowbell',
    'crayfish', 'crocodile', 'crossword', 'crowbar', 'cucumber', 'cupcake', 'cymbal', 'daffodil',
    'dandelion', 'dashboard', 'dinosaur', 'diploma', 'dodgeball', 'dolphin', 'domino', 'doorknob',
    'dragonfly', 'drumstick', 'dungeon', 'dynamite', 'earring', 'earthquake', 'eclipse', 'eggplant',
    'electricity', 'elevator', 'emerald', 'escalator', 'excavator', 'eyebrow', 'falcon', 'feather',
    'firecracker', 'firefly', 'fireworks', 'flamingo', 'flashlight', 'flipper', 'flute', 'footprint',
    'forklift', 'fountain', 'frisbee', 'gargoyle', 'geyser', 'gingerbread', 'giraffe', 'glacier',
    'gladiator', 'glowworm', 'gorilla', 'grasshopper', 'guillotine', 'guitar', 'hamburger', 'hamster',
    'harmonica', 'harpoon', 'hedgehog', 'helicopter', 'honeycomb', 'hummingbird', 'hurricane', 'hydrant',
    'igloo', 'jackhammer', 'jaguar', 'jukebox', 'kaleidoscope', 'kangaroo', 'kayak', 'kiwi',
    'koala', 'labyrinth', 'ladybug', 'lamppost', 'lantern', 'lawnmower', 'lemon', 'leopard',
    'lighthouse', 'lightning', 'limousine', 'lollipop', 'luggage', 'magician', 'magnifying', 'mailbox',
    'mammoth', 'manatee', 'mannequin', 'marathon', 'marshmallow', 'mascot', 'masquerade', 'matador',
    'mayonnaise', 'megaphone', 'mermaid', 'microphone', 'microscope', 'microwave', 'minivan', 'mirage',
    'monocle', 'monsoon', 'mosquito', 'motorcycle', 'mushroom', 'mustache', 'narwhal', 'necklace',
    'nectarine', 'needlefish', 'nightingale', 'nostalgia', 'oasis', 'observatory', 'octagon', 'octopus',
    'odyssey', 'omelet', 'onion', 'orangutan', 'orchestra', 'origami', 'ostrich', 'overalls',
    'oyster', 'paddleboard', 'paintbrush', 'pajamas', 'pancake', 'parachute', 'paradise', 'pastry',
    'peacock', 'pelican', 'pendulum', 'penguin', 'periscope', 'persimmon', 'photograph', 'picnic',
    'pineapple', 'pinwheel', 'pirate', 'platypus', 'playground', 'plumber', 'porcupine', 'porpoise',
    'portrait', 'pretzel', 'propeller', 'pufferfish', 'pumpkin', 'pyramid', 'quokka', 'racquet',
    'rainbow', 'raindrop', 'rhinoceros', 'ricochet', 'robot', 'rocket', 'rollercoaster', 'rowboat',
    'sailboat', 'salamander', 'sandcastle', 'sandwich', 'satellite', 'sausage', 'saxophone', 'scissors',
    'scorpion', 'scuba', 'seagull', 'seahorse', 'seashell', 'seesaw', 'shark', 'shovel',
    'shrimp', 'siren', 'skateboard', 'skeleton', 'skyscraper', 'sledgehammer', 'snorkel', 'snowflake',
    'snowman', 'sombrero', 'spaceship', 'spaghetti', 'sparrow', 'spatula', 'spider', 'squid',
    'squirrel', 'staircase', 'starfish', 'stethoscope', 'stilts', 'stingray', 'stomach', 'stopwatch',
    'stork', 'submarine', 'subway', 'suitcase', 'sunflower', 'surfboard', 'sushi', 'swingset',
    'sword', 'swordfish', 'symphony', 'tadpole', 'tarantula', 'teapot', 'telescope', 'television',
    'tennis', 'thermometer', 'thimble', 'thunderstorm', 'tightrope', 'toboggan', 'tomato', 'toothbrush',
    'tornado', 'torpedo', 'toucan', 'tractor', 'trampoline', 'treasure', 'triangle', 'tricycle',
    'tripod', 'trombone', 'tsunami', 'tulip', 'tumbleweed', 'turtle', 'typewriter', 'umbrella',
    'unicorn', 'unicycle', 'vacuum', 'vampire', 'vanilla', 'velociraptor', 'vending', 'venus',
    'violin', 'volcano', 'vortex', 'waffle', 'walrus', 'waterfall', 'watermelon', 'weasel',
    'weather', 'wheelbarrow', 'whirlpool', 'whistle', 'windmill', 'wizard', 'woodpecker', 'xylophone',
    'yacht', 'yeti', 'zebra', 'zeppelin', 'zipper', 'zombie',
    'abacus', 'acorn', 'albatross', 'alchemy', 'algebra', 'algorithm', 'alpaca', 'amulet',
    'anaconda', 'anagram', 'anchor', 'anemone', 'anteater', 'antler', 'anvil', 'apricot',
    'aquarium', 'arbor', 'arcade', 'archer', 'archipelago', 'arithmetic', 'armadillo', 'artichoke',
    'astrolabe', 'atlas', 'attic', 'aurora', 'avalanche', 'aviary', 'axolotl', 'azalea',
    'babushka', 'badminton', 'bagel', 'ballad', 'ballast', 'ballroom', 'bamboo', 'bandana',
    'banjo', 'barometer', 'bassoon', 'bayonet', 'beaker', 'beanstalk', 'beehive', 'belfry',
    'bellows', 'beret', 'bingo', 'biome', 'bison', 'blizzard', 'blowtorch', 'blueprint',
    'blunderbuss', 'bobsled', 'bonsai', 'boomerang', 'botany', 'bouquet', 'bowling', 'brocade',
    'bugle', 'bullfrog', 'bungalow', 'bunsen', 'buoy', 'burrow', 'buzzard', 'caber',
    'cabbage', 'cactus', 'cadence', 'caiman', 'calliope', 'camel', 'candelabra', 'canopy',
    'cantaloupe', 'capybara', 'carousel', 'cartography', 'catacomb', 'catapult', 'cataract', 'catfish',
    'cauldron', 'cavalier', 'cavern', 'cenotaph', 'centaur', 'cerberus', 'chameleon', 'chariot',
    'chasm', 'checkers', 'cheesecake', 'cheetah', 'chemistry', 'cherub', 'chess', 'chimera',
    'chinchilla', 'chisel', 'chord', 'chrysalis', 'cider', 'cipher', 'clairvoyance', 'clavicle',
    'clementine', 'clockwork', 'cockatoo', 'coconut', 'coliseum', 'comet', 'compass', 'concertina',
    'conch', 'confetti', 'constellation', 'coriander', 'cormorant', 'cornucopia', 'coronet', 'cosmos',
    'cotyledon', 'couplet', 'crayfish', 'crescendo', 'croquet', 'crypt', 'crystal', 'cubicle',
    'cudgel', 'culvert', 'cupola', 'curator', 'curling', 'cyclops', 'cymbal', 'cypress',
    'dachshund', 'daffodil', 'dagger', 'dahlia', 'dandelion', 'dartboard', 'decibel', 'decoy',
    'diorama', 'dirigible', 'discus', 'dodo', 'dolmen', 'doubloon', 'dowsing', 'dragonfly',
    'drawbridge', 'dreadnought', 'dulcimer', 'dungeon', 'dusk', 'dynamo', 'earwig', 'easel',
    'echidna', 'eclipse', 'edelweiss', 'effigy', 'egret', 'elixir', 'ellipsis', 'elysium',
    'embroidery', 'emerald', 'emporium', 'enchilada', 'enigma', 'entomology', 'epaulet', 'ephemera',
    'epidermis', 'equinox', 'ermine', 'escalator', 'espalier', 'esplanade', 'eucalyptus', 'euphonium',
    'eureka', 'evanescent', 'evergreen', 'excalibur', 'exoskeleton', 'fandango', 'fanfare', 'fantasia',
    'fencing', 'ferret', 'fez', 'filigree', 'fjord', 'flamenco', 'flamingo', 'flute',
    'foliage', 'fondue', 'footbridge', 'foyer', 'fractal', 'fresco', 'frijoles', 'frisbee',
    'frogman', 'futon', 'gable', 'gadget', 'galleon', 'galley', 'gargoyle', 'garland',
    'gazebo', 'gearshift', 'geode', 'geyser', 'gherkin', 'glockenspiel', 'gnome', 'goblet',
    'gondola', 'gong', 'gossamer', 'graffiti', 'gremlin', 'grenade', 'grotto', 'guacamole',
    'guillotine', 'gumbo', 'gyroscope', 'haberdashery', 'hacienda', 'halberd', 'halcyon', 'hammock',
    'harmonica', 'harpoon', 'helix', 'hemisphere', 'hieroglyph', 'hippopotamus', 'hologram', 'horoscope',
    'hydra', 'hyena', 'hyphen', 'ibex', 'iceberg', 'igloo', 'incense', 'inferno',
    'inkwell', 'iridescent', 'jackal', 'jalopy', 'javelin', 'jester', 'jigsaw', 'jinx',
    'jojoba', 'joust', 'juggernaut', 'jukebox', 'kaleidoscope', 'kayak', 'kelpie', 'kestrel',
    'kimono', 'kinetic', 'kiosk', 'kiwi', 'knapsack', 'koala', 'kookaburra', 'labyrinth',
    'lanai', 'lantern', 'lariat', 'lasso', 'lava', 'leviathan', 'lichen', 'limbo',
    'limpet', 'locket', 'lollipop', 'lotus', 'lozenge', 'lumberjack', 'lyre', 'macadamia',
    'macaw', 'machete', 'maelstrom', 'magma', 'magnolia', 'mahogany', 'manatee', 'mandala',
    'mandolin', 'mango', 'mangrove', 'mantis', 'maraschino', 'marionette', 'marquee', 'mastodon',
    'matryoshka', 'mausoleum', 'medallion', 'megaphone', 'menagerie', 'meridian', 'metronome', 'minotaur',
    'mirage', 'moat', 'mobius', 'moccasin', 'mohawk', 'molecule', 'mollusk', 'monarch',
    'mongoose', 'monocle', 'monsoon', 'montage', 'mosaic', 'mosquito', 'mothball', 'motif',
    'mozzarella', 'mukluk', 'mummy', 'mushroom', 'muskrat', 'mustang', 'narwhal', 'nautilus',
    'nebula', 'nectar', 'neon', 'nephrite', 'neutron', 'nimbus', 'nirvana', 'nocturne',
    'nova', 'nymph', 'oasis', 'obelisk', 'obsidian', 'octave', 'odyssey', 'opal',
    'origami', 'osmosis', 'ostrich', 'pagoda', 'paladin', 'palette', 'palmetto', 'panther',
    'papaya', 'papyrus', 'parabola', 'paradise', 'parasol', 'parchment', 'parquet', 'pastel',
    'pavilion', 'peach', 'peacock', 'pebble', 'pegasus', 'pendulum', 'peony', 'pergola',
    'persimmon', 'phoenix', 'pianola', 'piccolo', 'pillar', 'pinata', 'pinnacle', 'piranha',
    'pistachio', 'pixel', 'pizzeria', 'planetarium', 'plankton', 'platypus', 'plumeria', 'podium',
    'polka', 'poncho', 'poodle', 'porpoise', 'portcullis', 'prism', 'propeller', 'pterodactyl',
    'pulsar', 'pumpernickel', 'pumpkin', 'pyramid', 'quasar', 'quiche', 'quicksand', 'quill',
    'quiver', 'radish', 'ragtime', 'rainbow', 'rampart', 'raven', 'realm', 'reef',
    'relic', 'reservoir', 'rhinestone', 'rhombus', 'rhubarb', 'ricochet', 'ripple', 'rivulet',
    'rosette', 'roulette', 'rubicon', 'ruby', 'rudder', 'rune', 'saber', 'saffron',
    'samurai', 'sandal', 'sapphire', 'sarcophagus', 'satchel', 'satyr', 'savanna', 'scallop',
    'scarab', 'scimitar', 'scorpion', 'scythe', 'seance', 'sepia', 'sequin', 'serenade',
    'serendipity', 'serengeti', 'serpent', 'shaman', 'sherbet', 'silo', 'siren', 'skiff',
    'slinky', 'sloth', 'snorkel', 'solstice', 'sonata', 'sonnet', 'sorcerer', 'souvenir',
    'spangle', 'sphinx', 'spire', 'squall', 'squirrel', 'staccato', 'stalactite', 'starfish',
    'steppe', 'sterling', 'stethoscope', 'stiletto', 'stork', 'stratus', 'strudel', 'sturgeon',
    'sundial', 'sunflower', 'sushi', 'swallow', 'sylph', 'symphony', 'synapse', 'synthesis',
    'taffy', 'talon', 'tambourine', 'tandem', 'tapioca', 'tarantula', 'tartan', 'tassel',
    'tattoo', 'tectonic', 'tempest', 'tempo', 'tendril', 'tentacle', 'terrace', 'terrarium',
    'tesla', 'theorem', 'thistle', 'thorax', 'thyme', 'tiara', 'tidal', 'timbre',
    'tinsel', 'toadstool', 'totem', 'toucan', 'trapeze', 'trellis', 'trident', 'trilogy',
    'trinket', 'triptych', 'trireme', 'troubadour', 'tsunami', 'tulle', 'tundra', 'turquoise',
    'turtle', 'twilight', 'typhoon', 'udder', 'ukulele', 'umbra', 'urchin', 'utopia',
    'vacuum', 'valance', 'vanilla', 'vellum', 'velvet', 'vertigo', 'vessel', 'vestibule',
    'vial', 'vibrato', 'vineyard', 'viper', 'vista', 'vivace', 'vortex', 'walrus',
    'wanderlust', 'wattle', 'wharf', 'whirlpool', 'willow', 'windmill', 'wisp', 'wisteria',
    'wombat', 'xylophone', 'yacht', 'yak', 'yam', 'yang', 'yeti', 'yodel',
    'yoga', 'yucca', 'zephyr', 'zeppelin', 'ziggurat', 'zinc', 'zodiac', 'zucchini'
  ];

const Wrapper = () => {
    const storedPlaytime = parseInt(localStorage.getItem('playtime'), 10) || 120;
    const [playtime, setPlaytime] = useState(storedPlaytime);
    const [currentView, setCurrentView] = useState('mainMenu');
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [gamePaused, setGamePaused] = useState(false);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isGameModalOpen, setIsGameModalOpen] = useState(false);
    const [wordListFull, setWordListFull] = useState([]);
    const [showSettings, setShowSettings] = useState(false);
    const [isNoSound, setIsNoSound] = useState(() => {
        const saved = localStorage.getItem('isNoSound');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isNoMusic, setIsNoMusic] = useState(() => {
        const saved = localStorage.getItem('isNoMusic');
        return saved !== null ? JSON.parse(saved) : false;
    });
    const [isAdLoading, setIsAdLoading] = useState(false);

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
        document.addEventListener(
            'deviceready',
            function () {
            if (window.store) {
                // Register Products
                window.store.register({
                id: 'one_hour_playtime',
                type: window.store.CONSUMABLE,
                });
                window.store.register({
                id: 'five_hours_playtime',
                type: window.store.CONSUMABLE,
                });
        
                // When purchase of one hour playtime is approved
                window.store.when('one_hour_playtime').approved(function (transaction) {
                setPlaytime(function (prevTime) {
                    return prevTime + 60 * 60; // Add 1 hour in seconds
                });
                transaction.finish();
                });
        
                // When purchase of five hours playtime is approved
                window.store.when('five_hours_playtime').approved(function (transaction) {
                setPlaytime(function (prevTime) {
                    return prevTime + 5 * 60 * 60; // Add 5 hours in seconds
                });
                transaction.finish();
                });
        
                // Error Handling
                window.store.error(function (err) {
                console.error('Store Error ' + err.code + ': ' + err.message);
                });
        
                // Refresh the store to load product data
                window.store.refresh();
            } else {
                console.error('Store not available');
            }
            },
            false
        );
    }, []);

    const buyOneHour = () => {
        if (window.store) {
          window.store.order('one_hour_playtime').then(
            function () {
              console.log('Purchase process started for one_hour_playtime');
            },
            function (err) {
              console.error('Failed to initiate purchase: ' + err);
              alert('Purchase failed. Please try again.');
            }
          );
        } else {
          alert('Store not available');
        }
    };

    const buyThreeHours = () => {
        if (window.store) {
          window.store.order('three_hour_playtime').then(
            function () {
              console.log('Purchase process started for three_hour_playtime');
            },
            function (err) {
              console.error('Failed to initiate purchase: ' + err);
              alert('Purchase failed. Please try again.');
            }
          );
        } else {
          alert('Store not available');
        }
    };
      
    const buyFiveHours = () => {
        if (window.store) {
            window.store.order('five_hours_playtime').then(
            function () {
                console.log('Purchase process started for five_hours_playtime');
            },
            function (err) {
                console.error('Failed to initiate purchase: ' + err);
                alert('Purchase failed. Please try again.');
            }
            );
        } else {
            alert('Store not available');
        }
    };
      

    useEffect(() => {
        const initializeAdMob = async () => {
            await AdMob.initialize({
                requestTrackingAuthorization: true,
                testingDevices: ['EMULATOR'], // Remove this in production
                initializeForTesting: true, // Remove this in production
            });
        };
    
        initializeAdMob();
        soundEffects.play('playButton');
    }, []);    

    useEffect(() => {
        fetch('/wordListFull.txt')
            .then(response => response.text())
            .then(text => {
                const words = text.split('\n').filter(word => word.trim() !== '');
                setWordListFull(words);
            })
            .catch(error => console.error('Error loading word list:', error));
    }, []);

    useEffect(() => {
        localStorage.setItem('playtime', playtime);
    }, [playtime]);

    useEffect(() => {
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
    }, []);

    useEffect(() => {
        let timer;
        if (isTimerActive && playtime > 0 && !gamePaused) {
            timer = setInterval(() => {
                setPlaytime(prevTime => prevTime - 1);
            }, 1000);
        } else if (playtime === 0 && isTimerActive) {
            openModal();
        }
        return () => clearInterval(timer);
    }, [isTimerActive, playtime, gamePaused]);

    const handleMainMenuClick = () => {
        soundEffects.play('generalButton');
        setCurrentView('mainMenu');
        setIsTimerActive(false);
        setGamePaused(false);
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
        if (isAdLoading) return; // Prevent multiple calls while loading
        
        setIsAdLoading(true);
        soundEffects.play('playButton');

        // Remove existing listeners to prevent multiple attachments
        AdMob.removeAllListeners();
        console.log('Removed all listeners');

        // Listen for the reward event
        AdMob.addListener('onRewardedVideoAdReward', (rewardItem) => {
            console.log('User rewarded:', rewardItem);
            setPlaytime(prevTime => prevTime + 180);
            resumeGameIfNeeded();
            setIsAdLoading(false);
        });

        // Listen for ad close event
        AdMob.addListener('onRewardedVideoAdDismissed', () => {
            console.log('Rewarded video ad closed');
            setIsAdLoading(false);
        });

        try {
            await AdMob.prepareRewardVideoAd({
                adId: 'ca-app-pub-3940256099942544/5224354917',
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
        if (playtime <= 60) {
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
                <div className={`playtime-display ${getPlaytimeClass()}`}>
                    Playtime: {Math.floor(playtime / 60)}:{String(playtime % 60).padStart(2, '0')}
                </div>
            </div>

            <div className="content">
                {currentView === 'mainMenu' && (
                    <MainMenu 
                        showGameModal={showGameModal} 
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
                    <button
                        onClick={watchAdForPlaytime}
                        className="option-btn"
                        disabled={isAdLoading}
                        style={{ opacity: isAdLoading ? 0.5 : 1 }}
                    >
                        {isAdLoading ? 'Loading Ad...' : 'Watch Ad for +3 Minutes'}
                    </button>
                    <button onClick={buyOneHour} className="option-btn">
                        Buy +1 Hour ($0.99)
                    </button>
                    <button onClick={buyThreeHours} className="option-btn">
                        Buy +3 Hours ($1.99)
                    </button>
                    <button onClick={buyFiveHours} className="option-btn">
                        Buy +5 Hours ($2.49)
                    </button>
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
        </div>
    );
};

export default Wrapper;

