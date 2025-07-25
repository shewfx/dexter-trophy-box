import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, TestTube2, Edit, Save, Trash2, PlusCircle } from 'lucide-react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query, updateDoc } from 'firebase/firestore';

// --- Firebase Configuration ---
// Reverted to your original environment variable configuration.
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};


// Initialize Firebase App ONCE globally
const isFirebaseConfigured = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.projectId;
const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
const APP_COLLECTION_ID = firebaseConfig.projectId;

// --- Dexter Quotes ---
const dexterQuotes = [
    "Tonight’s the night.", "I’m a very neat monster.", "Blood never lies.",
    "Fear is a powerful motivator.", "I did not like this feeling of having feelings.",
    "Dating is hard… especially for a serial killer.", "Darkness became my world.",
    "Every contact leaves a trace.", "Perhaps because I’ll never be one, humans are interesting to me.",
    "I kill to stay human.", "Normal people are so hostile.",
    "I would give everything to feel nothing again.", "Life doesn’t have to be perfect.",
    "Never underestimate the capacity of others to let you down.",
    "Sometimes it’s reassuring I’m not the only one pretending.",
    "There are no secrets, just hidden truths.", "Am I good doing bad… or bad doing good?",
    "Silence is my only witness.", "We create our own destiny.",
    "The ritual is intoxicating.", "Plastic sheeting solves so many problems.",
    "All you can do is play along.", "I can always see others' problems more clearly than my own.",
    "I don’t run. I make people run.",
    "We all want life to have meaning.",
    "I fake all of it.",
    "The mask is slipping."
];

// --- Component: Randomized Blood Spatter for Slides ---
const RandomBloodSample = ({ seed, className }) => {
    const [scale, setScale] = useState(0);

    useEffect(() => {
        const timer = setTimeout(() => {
            setScale(1);
        }, 50);
        return () => clearTimeout(timer);
    }, []);

    const spatterPath = useMemo(() => {
        const mulberry32 = (a) => {
            return () => {
                let t = a += 0x6D2B79F5;
                t = Math.imul(t ^ (t >>> 15), t | 1);
                t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
        };

        const hashSeed = (str) => {
            let hash = 0x811c9dc5;
            for (let i = 0; i < str.length; i++) {
                hash ^= str.charCodeAt(i);
                hash = Math.imul(hash, 0x01000193);
            }
            return hash >>> 0;
        };

        const numSeed = hashSeed(seed);
        const rand = mulberry32(numSeed);

        const isSmileyFace = rand() < (1 / 10000); // Rare easter egg

        if (isSmileyFace) {
            const faceBlob = `M50,10 C75,10 90,30 90,50 C90,70 75,90 50,90 C25,90 10,70 10,50 C10,30 25,10 50,10 Z`;
            const eye1 = `M35,35 A5,5 0 1,0 45,35 A5,5 0 1,0 35,35 Z`;
            const eye2 = `M65,35 A5,5 0 1,0 75,35 A5,5 0 1,0 65,35 Z`;
            const mouth = `M35,60 Q50,70 65,60`;
            return `${faceBlob} ${eye1} ${eye2} ${mouth}`;
        } else {
            const points = [];
            const numPoints = 8 + Math.floor(rand() * 5);
            const centerX = 50;
            const centerY = 50;
            const baseRadius = 35 + rand() * 10;

            for (let i = 0; i < numPoints; i++) {
                const angle = (i / numPoints) * 2 * Math.PI;
                const radius = baseRadius + (rand() - 0.5) * 18;
                const x = centerX + radius * Math.cos(angle);
                const y = centerY + radius * Math.sin(angle);
                points.push({ x, y });
            }

            let path = `M${points[0].x},${points[0].y}`;
            for (let i = 0; i < numPoints; i++) {
                const p1 = points[i];
                const p2 = points[(i + 1) % numPoints];
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                path += ` Q${p1.x},${p1.y} ${midX},${midY}`;
            }
            path += ' Z';
            return path;
        }
    }, [seed]);


    return (
        <svg viewBox="0 0 100 100" className={`absolute w-16 h-16 ${className}`}>
            <defs><filter id="blur-filter"><feGaussianBlur in="SourceGraphic" stdDeviation="1.5" /></filter></defs>
            <g style={{
                transform: `scale(${scale})`,
                transformOrigin: '50% 50%',
                transition: 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
            }}>
                <path d={spatterPath} fill="rgba(153, 27, 27, 0.7)" filter="url(#blur-filter)" />
                <path d={spatterPath} fill="rgba(127, 29, 29, 1)" transform="scale(0.85)" style={{transformOrigin: '50% 50%'}} />
            </g>
        </svg>
    );
};

// --- Component: Trophy Slide ---
const TrophySlide = ({ trophy, onSelect, onHoverSound }) => {
    const hoverRef = useRef(null);
    const animationFrame = useRef(null);

    const handleInteractionMove = (e) => {
        if (!hoverRef.current) return;
        cancelAnimationFrame(animationFrame.current);

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        animationFrame.current = requestAnimationFrame(() => {
            const { left, top, width, height } = hoverRef.current.getBoundingClientRect();
            const x = (clientX - left) / width;
            const y = (clientY - top) / height;

            const rotateY = (x - 0.5) * 16;
            const rotateX = -(y - 0.5) * 16;
            hoverRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

            const glint = hoverRef.current.querySelector('.glint');
            if (glint) {
                const glintXOffset = (x - 0.5) * 50;
                glint.style.transform = `translateX(calc(-50% + ${glintXOffset}px)) skewX(-12deg)`;
            }
        });
    };

    const handleInteractionEnd = () => {
        if (!hoverRef.current) return;
        hoverRef.current.style.transform = 'rotateX(0deg) rotateY(0deg)';
        const glint = hoverRef.current.querySelector('.glint');
        if (glint) {
            glint.style.transform = 'translateX(-50%) skewX(-12deg)';
        }
    };

    return (
        <div
            onClick={() => onSelect(trophy)}
            onMouseEnter={onHoverSound}
            className="group w-full h-full cursor-pointer flex items-center"
            style={{ perspective: '500px' }}
        >
            <div
                className="relative w-full h-2 group-hover:h-16 overflow-hidden 
                           bg-white/10 backdrop-blur-sm border border-white/20 rounded-md
                           flex items-center justify-center transition-all duration-300 ease-out 
                           shadow shadow-black/20 shadow-inner group-hover:shadow-lg group-hover:shadow-black/30
                           group-hover:-translate-y-2 group-hover:scale-[1.03]"
                onMouseMove={handleInteractionMove}
                onMouseLeave={handleInteractionEnd}
                onTouchMove={handleInteractionMove}
                onTouchEnd={handleInteractionEnd}
                ref={hoverRef}
                style={{ transformStyle: 'preserve-3d' }}
            >
                <div className="absolute inset-0 flex items-center justify-center">
                    <RandomBloodSample seed={trophy.id} />
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 w-full h-full relative z-10">
                    <div className="absolute bottom-1 right-2 text-xs md:text-sm text-stone-800 font-custom-trophy">
                        {trophy.createdAt ? new Date(trophy.createdAt).toLocaleDateString() : '...'}
                    </div>
                    <p className="absolute top-2 left-2 text-sm md:text-base font-regular text-stone-600 font-custom-trophy">
                        {trophy.name}
                    </p>
                </div>
                <div className="glint absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 z-20 opacity-0 group-hover:opacity-100" style={{ left: '70%', transform: 'translateX(-50%) skewX(-12deg)' }}></div>
            </div>
        </div>
    );
};


// --- Component for an Empty Slot ---
const EmptySlot = () => (
    <div className="w-full h-full flex items-center pr-1">
        <div className="w-full h-2 bg-black/20 rounded-sm shadow-inner shadow-black/50 border-t border-black/30"></div>
    </div>
);


// --- Component for the Detailed View Modal ---
const DetailView = ({ trophy, onClose, onSave, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTrophy, setEditedTrophy] = useState(trophy);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        setEditedTrophy(trophy);
        setIsEditing(false);
    }, [trophy]);

    if (!trophy) return null;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditedTrophy(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        onSave(editedTrophy);
        setIsEditing(false);
        onClose(); // Close modal on save for better UX and state synchronization
    };

    const handleCancel = () => {
        setEditedTrophy(trophy);
        setIsEditing(false);
    };

    const handleDelete = () => {
        onDelete(trophy.id);
        onClose();
    }

    const formattedDate = trophy.createdAt ? new Date(trophy.createdAt).toDateString() : 'No date';

    return (
        <>
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="relative w-full max-w-2xl bg-gray-900/80 border border-gray-600 rounded-lg shadow-2xl shadow-red-900/20 text-gray-300 animate-fade-in">
                    <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                    <div className="p-6 border-b border-gray-700/50">
                        <h2 className="text-3xl font-serif text-red-500/90">Specimen Analysis</h2>
                        <p className="text-gray-400 font-mono mt-1">Date of Collection: {formattedDate}</p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4 p-4 bg-black/20 rounded-md border border-gray-800">
                                <div className="relative w-24 h-40 bg-cyan-200/10 backdrop-blur-sm border border-cyan-300/20 rounded-lg flex items-center justify-center">
                                    <RandomBloodSample seed={trophy.id} className="w-20 h-20" />
                                </div>
                                <div className="text-center">
                                    {isEditing ? (
                                        <input type="text" name="name" value={editedTrophy.name} onChange={handleInputChange} className="bg-gray-800 text-white text-center font-bold text-lg rounded w-full p-1" />
                                    ) : (
                                        <p className="font-bold text-lg text-white">{editedTrophy.name}</p>
                                    )}
                                    <p className="text-sm text-gray-400">Subject Name</p>
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-semibold text-gray-100 mb-3 flex items-center"><TestTube2 className="mr-2 text-red-500/80" size={20} />Analyst's Notes</h3>
                                {isEditing ? (
                                    <textarea name="notes" value={editedTrophy.notes} onChange={handleInputChange} className="bg-gray-800 text-gray-300 font-mono leading-relaxed w-full h-32 p-2 rounded" />
                                ) : (
                                    <p className="text-gray-300 font-mono leading-relaxed text-justify h-32 overflow-y-auto pr-2">{editedTrophy.notes}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-black/20 border-t border-gray-700/50 rounded-b-lg flex justify-between items-center">
                        {isEditing ? (
                            <div>
                                <button onClick={handleSave} className="bg-green-700 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300 mr-2 flex items-center"><Save size={18} className="mr-2" /> Save</button>
                                <button onClick={handleCancel} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Cancel</button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => setIsEditing(true)} className="bg-blue-800/80 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"><Edit size={18} className="mr-2" /> Edit</button>
                                <button onClick={() => setShowDeleteConfirm(true)} className="bg-red-900 hover:bg-red-800 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"><Trash2 size={18} className="mr-2" /> Delete</button>
                            </div>
                        )}
                        <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300">Close File</button>
                    </div>
                </div>
            </div>
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-red-700 rounded-lg p-6 shadow-lg animate-fade-in">
                        <h3 className="text-lg font-bold text-white">Are you sure?</h3>
                        <p className="text-gray-400 my-4">This action cannot be undone. The slide will be permanently destroyed.</p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="py-2 px-4 rounded bg-gray-600 hover:bg-gray-500 text-white">Cancel</button>
                            <button onClick={handleDelete} className="py-2 px-4 rounded bg-red-700 hover:bg-red-600 text-white">Destroy</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// --- Component for Adding a New Trophy ---
const AddTrophyModal = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');

    if (!isOpen) return null;

    const handleAdd = () => {
        if (name.trim()) {
            onAdd(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-md bg-red-900/90 border-2 border-red-700/80 rounded-lg shadow-2xl text-gray-300 animate-fade-in">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-300 hover:text-white transition-colors"><X size={24} /></button>
                <div className="p-6">
                    <h2 className="text-2xl font-serif text-white mb-4">Add a New Trophy</h2>
                    <label htmlFor="trophy-name" className="block text-sm font-bold text-gray-300 mb-2">Trophy Name</label>
                    <input
                        id="trophy-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Completed a video game, Quit smoking"
                        className="w-full p-2 rounded bg-black/20 border border-red-500/50 text-white focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    <div className="mt-6 flex justify-end gap-4">
                        <button onClick={onClose} className="py-2 px-4 rounded bg-red-800 hover:bg-red-700 text-white">Cancel</button>
                        <button onClick={handleAdd} className="py-2 px-4 rounded bg-green-700 hover:bg-green-600 text-white">Add Slide</button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
    const [selectedTrophy, setSelectedTrophy] = useState(null);
    const [allTrophies, setAllTrophies] = useState([]);
    const [displayedTrophies, setDisplayedTrophies] = useState([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentQuote, setCurrentQuote] = useState(dexterQuotes[0]);
    const [db, setDb] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [synth, setSynth] = useState(null);
    const [isAudioReady, setIsAudioReady] = useState(false);

    // Vercel deployment check: Ensure all required environment variables are present.
    if (!isFirebaseConfigured) {
        return (
            <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 text-center">
                <h1 className="text-3xl text-red-500 font-bold mb-4">Configuration Error</h1>
                <p className="max-w-md">
                    The application is not configured correctly. This usually happens when environment variables are missing in the deployment environment (like Vercel).
                </p>
                <p className="mt-4 max-w-md">
                    Please ensure all <strong>VITE_FIREBASE_...</strong> variables from your local <strong>.env</strong> file are added to your Vercel project's settings under "Environment Variables" and then re-deploy the application.
                </p>
            </div>
        );
    }

    // One-time initialization
    useEffect(() => {
        // Reverted to your original audio handling
        const backgroundAudio = new Audio("/background-music.mp3");
        backgroundAudio.loop = true;
        backgroundAudio.volume = 0.1;
        const playPromise = backgroundAudio.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                console.log("Autoplay was blocked. Waiting for user interaction.");
                document.body.addEventListener('click', () => backgroundAudio.play(), { once: true });
            });
        }
        setCurrentQuote(dexterQuotes[Math.floor(Math.random() * dexterQuotes.length)]);
        const script = document.createElement('script');
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.min.js";
        script.async = true;
        script.onload = () => {
            const synthInstance = new window.Tone.Synth({
                oscillator: { type: 'sine' },
                envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.1 }
            }).toDestination();
            setSynth(synthInstance);
        };
        document.body.appendChild(script);
        
        // Reverted to your original Firebase auth logic
        const authInstance = getAuth(firebaseApp);
        const dbInstance = getFirestore(firebaseApp);
        setDb(dbInstance);
        const unsubscribeAuth = onAuthStateChanged(authInstance, async (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                try {
                    const initialToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;
                    if (initialToken) {
                        await signInWithCustomToken(authInstance, initialToken);
                    } else {
                        await signInAnonymously(authInstance);
                    }
                } catch (error) {
                    console.error("Authentication failed:", error);
                }
            }
            setIsAuthReady(true);
        });
        return () => {
            unsubscribeAuth();
            document.body.removeChild(script);
            backgroundAudio.pause();
            backgroundAudio.src = "";
        };
    }, []);

    // Effect for fetching data from Firestore
    useEffect(() => {
        if (isAuthReady && db && userId) {
            const trophiesCollectionPath = `artifacts/${APP_COLLECTION_ID}/users/${userId}/trophies`;
            const q = query(collection(db, trophiesCollectionPath));
            
            const unsubscribe = onSnapshot(q, (querySnapshot) => {
                const trophiesData = [];
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    // Vercel Fix: Only process documents that have a server-confirmed timestamp.
                    // This prevents errors when onSnapshot fires before the serverTimestamp is set.
                    if (data.serverTime) { 
                        trophiesData.push({ id: doc.id, ...data, createdAt: data.serverTime.toDate() });
                    }
                });

                // Sort the validated data by the reliable timestamp.
                trophiesData.sort((a, b) => a.createdAt - b.createdAt);
                
                setAllTrophies(trophiesData);
            }, (error) => {
                console.error("Error fetching trophies:", error);
            });

            return () => unsubscribe();
        }
    }, [isAuthReady, db, userId]);

    // Effect to visually update the displayed trophies
    useEffect(() => {
        const intervalId = setInterval(() => {
            // This interval checks if more slides need to be shown and adds one at a time.
            setDisplayedTrophies(currentDisplayed => {
                if (currentDisplayed.length < allTrophies.length) {
                    // Add the next slide from the master list
                    return allTrophies.slice(0, currentDisplayed.length + 1);
                } else {
                    // All slides are shown, stop the interval
                    clearInterval(intervalId);
                    return currentDisplayed;
                }
            });
        }, 75); // Spawning slides slightly faster for a tighter cascade effect.

        return () => clearInterval(intervalId);
    }, [allTrophies, displayedTrophies.length]); // Re-run if master list changes


    // --- CRUD Handlers ---
    const handleAddTrophy = async (name) => {
        setCurrentQuote(dexterQuotes[Math.floor(Math.random() * dexterQuotes.length)]);
        if (!db || !userId) return;
        const newTrophy = {
            name: name,
            notes: "A new beginning. Add your notes here.",
            serverTime: serverTimestamp(), // Use serverTimestamp for reliable ordering
        };
        try {
            const collectionRef = collection(db, `artifacts/${APP_COLLECTION_ID}/users/${userId}/trophies`);
            await addDoc(collectionRef, newTrophy);
        } catch (error) {
            console.error("Error adding trophy:", error);
        }
    };

    const handleUpdateTrophy = async (updatedTrophy) => {
        if (!db || !userId) return;
        const docRef = doc(db, `artifacts/${APP_COLLECTION_ID}/users/${userId}/trophies`, updatedTrophy.id);
        try {
            // Create a new object with only the fields that should be updated.
            const dataToSave = {
                name: updatedTrophy.name,
                notes: updatedTrophy.notes
            };
            await updateDoc(docRef, dataToSave);
        } catch (error) {
            console.error("Error updating trophy:", error);
        }
    };

    const handleDeleteTrophy = async (trophyId) => {
        if (!db || !userId) return;
        const docRef = doc(db, `artifacts/${APP_COLLECTION_ID}/users/${userId}/trophies`, trophyId);
        try {
            await deleteDoc(docRef);
            // The onSnapshot listener will handle the UI update automatically.
        } catch (error) {
            console.error("Error deleting trophy:", error);
        }
    };

    const playHoverSound = () => {
        if (synth && isAudioReady && window.Tone.context.state === 'running') {
            synth.triggerAttackRelease("G6", "64n");
        }
    };

    const startAudioContext = async () => {
        if (window.Tone && window.Tone.context.state !== 'running') {
            await window.Tone.start();
        }
        setIsAudioReady(true);
    }

    const handleSelectTrophy = (trophy) => setSelectedTrophy(trophy);

    const displayedSlots = Math.ceil(Math.max(50, allTrophies.length + 1) / 50) * 50;
    
    return (
        <div className="h-screen font-sans text-white relative overflow-hidden bg-gray-800" onClick={!isAudioReady ? startAudioContext : undefined}>
            <svg className="absolute w-0 h-0">
                <filter id="metal-texture">
                    <feTurbulence type='fractalNoise' baseFrequency='0.1 0.4' numOctaves='3' seed='2' />
                    <feDiffuseLighting in='noise' lightingColor='#fff' surfaceScale='2'>
                        <feDistantLight azimuth='45' elevation='60' />
                    </feDiffuseLighting>
                </filter>
                 <filter id="suede-texture">
                    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="turbulence"/>
                    <feDiffuseLighting in="turbulence" lightingColor="#d4c0a1" surfaceScale="1.5">
                        <feDistantLight azimuth="45" elevation="60"/>
                    </feDiffuseLighting>
                </filter>
            </svg>
            <div className="absolute inset-0 opacity-20" style={{ filter: 'url(#metal-texture)' }}></div>
            <div className="absolute inset-0 bg-black/60"></div>

            {!isAudioReady && synth && (
                <div className="absolute top-0 left-0 right-0 p-2 bg-black/50 text-center text-sm z-50 animate-fade-in">
                    Click anywhere to enable sound
                </div>
            )}

            <div className="relative z-10 flex flex-col items-center justify-start h-full p-4">
                <header className="text-center mb-4 px-4 pt-4">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl text-gray-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] font-handwritten tracking-wide">
                        The Collection
                    </h1>
                    <p className="text-gray-400 mt-2 font-mono">{currentQuote}</p>
                </header>
                
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="relative mb-6 flex items-center gap-2 py-2 px-4 bg-[#7b1e1e] hover:bg-[#a30000] text-white font-bold rounded-lg transition-all duration-300 border border-red-800 shadow-[inset_0_-4px_6px_rgba(0,0,0,0.6)]"
                >
                    <PlusCircle size={20} className="text-white" />
                    Add New Trophy
                </button>


                <main className="relative z-10 w-full max-w-sm p-3 bg-gradient-to-br from-[#5a3835] to-[#3b1f1e] rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] border-t-[10px] border-x-[3px] border-b-[4px] border-[#2f1a19] ring-1 ring-[#00000033] flex-grow min-h-0">
                    <div
                        className="relative py-4 px-2 rounded-md shadow-[inset_0_4px_10px_rgba(0,0,0,0.6)] h-full overflow-y-auto bg-[#c2a385]"
                    >
                        <div className="absolute inset-0 opacity-20" style={{ filter: 'url(#suede-texture)' }}></div>
                        <div className="relative z-10 space-y-1">
                            {Array.from({ length: displayedSlots }).map((_, i) => (
                                <div key={i} className="flex items-center h-10 space-x-2">
                                    <div className="w-8 text-center text-xs text-gray-600 font-mono">{i + 1}</div>
                                    <div className="flex-grow h-full">
                                        {displayedTrophies[i] ?
                                            <TrophySlide trophy={displayedTrophies[i]} onSelect={handleSelectTrophy} onHoverSound={playHoverSound} /> :
                                            <EmptySlot />
                                        }
                                    </div>
                                    <div className="w-8 flex-shrink-0"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 h-8 bg-gradient-to-b from-yellow-500 to-yellow-600 border-2 border-yellow-700/80 rounded-sm z-10 flex items-center justify-center shadow-md p-0.5">
                        <div className="w-8 h-1/2 bg-yellow-700/50 border border-yellow-800/50 rounded-sm"></div>
                    </div>
                </main>
            </div>

            {isAddModalOpen && <AddTrophyModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onAdd={handleAddTrophy} />}
            {selectedTrophy && <DetailView
                trophy={selectedTrophy}
                onClose={() => setSelectedTrophy(null)}
                onSave={handleUpdateTrophy}
                onDelete={handleDeleteTrophy}
            />}

            <style>{`
                html, body, #root {
                    height: 100%;
                    margin: 0;
                    overflow: hidden;
                }
                
                /* --- Custom Font Setup --- */
                @font-face {
                    font-family: 'Cedarville Cursive';
                    src: url('/fonts/CedarvilleCursive-Regular.ttf') format('truetype');
                }

                @font-face {
                    font-family: 'CustomTrophyFont';
                    src: url('/fonts/biro-script-plus.otf') format('opentype');
                }

                .font-handwritten { font-family: 'Cedarville Cursive', cursive; }
                .font-custom-trophy { 
                    font-family: 'CustomTrophyFont', monospace; /* Fallback to monospace */
                    font-variant-ligatures: common-ligatures;
                    -webkit-font-feature-settings: "liga" on;
                    font-feature-settings: "liga" on;
                }
                @keyframes fade-in { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
                @keyframes blood-spread {
                  from { transform: scale(0.1); opacity: 0; }
                  to { transform: scale(1); opacity: 1; }
                }
                .animate-blood-spread {
                  animation: blood-spread 0.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
                }
            `}</style>
        </div>
    );
}
