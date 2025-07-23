import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, TestTube2, Edit, Save, Trash2, PlusCircle, Sparkles } from 'lucide-react';



// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, setDoc, deleteDoc, onSnapshot, serverTimestamp, query } from 'firebase/firestore';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyAQfCfRqdjYMUjcIZ6qv6avxi5JifC094E", // Your Firebase API Key
  authDomain: "dexterbloodslides.firebaseapp.com",
  projectId: "dexterbloodslides",
  storageBucket: "dexterbloodslides.firebasestorage.app",
  messagingSenderId: "9917678416",
  appId: "1:9917678416:web:18c52db1393c5f94922255",
  measurementId: "G-HNCD5C739B"
};

// Initialize Firebase App ONCE globally
const firebaseApp = initializeApp(firebaseConfig);
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
  "I nodded with genuine synthetic sympathy.", "Sometimes it’s reassuring I’m not the only one pretending.",
  "There are no secrets, just hidden truths.", "Am I good doing bad… or bad doing good?",
  "Silence is my only witness.", "We create our own destiny.",
  "The ritual is intoxicating.", "Plastic sheeting solves so many problems.",
  "All you can do is play along.", "I can always see others' problems more clearly than my own.",
  "I don’t run. I make people run.", "Getting yelled at by a furious woman… semiformal occasion.",
  "We all want life to have meaning.", "Commitment. Sharing. Driving people to the airport.",
  "I enjoy good-looking idiots watching each other.", "I fake all of it.",
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
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    }
    const numSeed = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const rand = mulberry32(numSeed);

    const isSmileyFace = rand() < (1 / 10000); // 1 in 10000 chance

    if (isSmileyFace) {
      const faceBlob = `
        M50,10 
        C75,10 90,30 90,50 
        C90,70 75,90 50,90 
        C25,90 10,70 10,50 
        C10,30 25,10 50,10 Z
      `;
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
        <path d={spatterPath} fill="rgba(127, 29, 29, 1)" transform="scale(0.85)" transform-origin="50 50" />
      </g>
    </svg>
  );
};


const TrophySlide = ({ trophy, onSelect, onHoverSound }) => {
  const hoverRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!hoverRef.current) return;
    const { left, top, width, height } = hoverRef.current.getBoundingClientRect();
    const x = (e.clientX - left) / width;
    const y = (e.clientY - top) / height;
    const rotateY = (x - 0.5) * 16;
    const rotateX = -(y - 0.5) * 16;
    hoverRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    const glint = hoverRef.current.querySelector('.glint');
    if (glint) {
      const glintXOffset = (x - 0.5) * 50;
      glint.style.transform = `translateX(calc(-50% + ${glintXOffset}px)) skewX(-12deg)`;
    }
  };

  const handleMouseLeave = () => {
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
      style={{ perspective: '800px' }}
    >
      <div
        className="relative w-full bg-cyan-100/15 backdrop-blur-sm border border-cyan-200/25 rounded-md flex items-center justify-center transition-all duration-300 ease-out h-2 group-hover:h-16 overflow-hidden shadow-md group-hover:shadow-2xl group-hover:-translate-y-1"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        ref={hoverRef}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <RandomBloodSample seed={trophy.id} />
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-200 w-full h-full relative z-10">
          <div className="absolute bottom-1 right-2 text-xs text-stone-800 font-mono">
            {trophy.date ? new Date(trophy.date.seconds * 1000).toLocaleDateString() : '...'}
          </div>
          <p className="absolute top-2 left-2 text-sm font-bold text-stone-800">{trophy.name}</p>
        </div>
        <div className="glint absolute top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent transform -skew-x-12 z-20 opacity-0 group-hover:opacity-100" style={{ left: '70%', transform: 'translateX(-50%) skewX(-12deg)' }}></div>
      </div>
    </div>
  );
};


// --- Component for an Empty Slot ---
const EmptySlot = () => (
    <div className="w-full h-full flex items-center pr-1">
      {/* This creates the appearance of an indented groove */}
      <div className="w-full h-2 bg-[#d3c5ad] border-t border-[#f3e9d2] rounded-sm shadow-inner"></div>
    </div>
  );


// --- Component for the Detailed View Modal ---
const DetailView = ({ trophy, onClose, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTrophy, setEditedTrophy] = useState(trophy);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
  };

  const handleCancel = () => {
    setEditedTrophy(trophy);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDelete(trophy.id);
    onClose();
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const prompt = `From the perspective of a meticulous forensic analyst, provide a brief, dark, and metaphorical psychological profile of a subject whose defining characteristic is '${editedTrophy.name}'. Keep it under 50 words.`;

    try {
      const payload = { contents: [{ role: "user", parts: [{ text: prompt }] }] };
      // IMPORTANT: Replace with your actual Gemini API key, or use a secure proxy
      const apiKey = "YOUR_GEMINI_API_KEY"; // <<-- This needs to be filled in!
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      const result = await response.json();

      if (result.candidates && result.candidates.length > 0 &&
        result.candidates[0].content && result.candidates[0].content.parts &&
        result.candidates[0].content.parts.length > 0) {
        const text = result.candidates[0].content.parts[0].text;
        setEditedTrophy(prev => ({ ...prev, notes: text }));
      } else {
        setEditedTrophy(prev => ({ ...prev, notes: "Analysis could not be completed. The subject remains an enigma." }));
      }
    } catch (error) {
      console.error("Gemini API call failed:", error);
      setEditedTrophy(prev => ({ ...prev, notes: "Error during analysis. Contamination of evidence suspected." }));
    } finally {
      setIsAnalyzing(false);
      setIsEditing(true);
    }
  };

  const formattedDate = trophy.date ? new Date(trophy.date.seconds * 1000).toDateString() : 'No date';

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
              <div className="flex gap-2">
                <button onClick={() => setIsEditing(true)} className="bg-blue-800/80 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center"><Edit size={18} className="mr-2" /> Edit</button>
                <button onClick={handleAnalyze} disabled={isAnalyzing} className="bg-purple-800/80 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors duration-300 flex items-center disabled:bg-gray-500 disabled:cursor-wait">
                  {isAnalyzing ? 'Analyzing...' : <><Sparkles size={18} className="mr-2" /> Generate Profile</>}
                </button>
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
  const [trophies, setTrophies] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState(dexterQuotes[0]);

  // Firebase and Sound state
  const [db, setDb] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [synth, setSynth] = useState(null);
  const [isAudioReady, setIsAudioReady] = useState(false);

  // One-time Firebase and Tone.js initialization
  useEffect(() => {
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

    const authInstance = getAuth(firebaseApp);
    const dbInstance = getFirestore(firebaseApp);
    setDb(dbInstance);

    const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
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
      unsubscribe();
      document.body.removeChild(script);
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
          trophiesData.push({ id: doc.id, ...doc.data() });
        });
        trophiesData.sort((a, b) => {
          if (!a.date) return 1;
          if (!b.date) return -1;
          return a.date.seconds - b.date.seconds;
        });
        setTrophies(trophiesData);
      }, (error) => {
        console.error("Error fetching trophies:", error);
      });

      return () => unsubscribe();
    }
  }, [isAuthReady, db, userId]);

  // --- CRUD Handlers ---
  const handleAddTrophy = async (name) => {
    setCurrentQuote(dexterQuotes[Math.floor(Math.random() * dexterQuotes.length)]);
    if (!db || !userId) return;
    const newTrophy = {
      name: name,
      notes: "A new beginning. Add your notes here.",
      date: serverTimestamp(),
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
      const { id, ...dataToSave } = updatedTrophy;
      await setDoc(docRef, dataToSave, { merge: true });
    } catch (error) {
      console.error("Error updating trophy:", error);
    }
  };

  const handleDeleteTrophy = async (trophyId) => {
    if (!db || !userId) return;
    const docRef = doc(db, `artifacts/${APP_COLLECTION_ID}/users/${userId}/trophies`, trophyId);
    try {
      await deleteDoc(docRef);
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

  const displayedSlots = Math.ceil(Math.max(50, trophies.length + 1) / 50) * 50;

  // Style for the inner wood texture
  const innerBoxStyle = {
    backgroundColor: '#eaddc7',
    backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 19px, rgba(0,0,0,0.04) 19px, rgba(0,0,0,0.04) 20px)',
    backgroundSize: '100% 20px',
  };

  return (
    <div className="min-h-screen font-sans text-white relative overflow-hidden bg-gradient-to-br from-[#6f4e37] to-[#4a2c2a]" onClick={!isAudioReady ? startAudioContext : undefined}>
      <svg className="absolute w-0 h-0"><filter id="wood-texture"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="4" result="turbulence" /><feColorMatrix type="saturate" values="0.1" in="turbulence" result="desaturatedTurbulence" /><feDiffuseLighting in="desaturatedTurbulence" lightingColor="#8c6d52" surfaceScale="2"><feDistantLight azimuth="45" elevation="60" /></feDiffuseLighting></filter></svg>
      <div className="absolute inset-0 opacity-20" style={{ filter: 'url(#wood-texture)' }}></div>
      <div className="absolute inset-0 bg-black/30"></div>

      {!isAudioReady && synth && (
        <div className="absolute top-0 left-0 right-0 p-2 bg-black/50 text-center text-sm z-50 animate-fade-in">
          Click anywhere to enable sound
        </div>
      )}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
        <header className="text-center mb-4 px-4">
          <h1 className="text-6xl md:text-7xl text-gray-300 drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] font-handwritten tracking-wide">
            The Collection
          </h1>
          <p className="text-gray-400 mt-2 font-mono">{currentQuote}</p>
        </header>

        <button onClick={() => setIsAddModalOpen(true)} className="mb-6 flex items-center gap-2 py-2 px-4 bg-red-900/80 hover:bg-red-800 text-white font-bold rounded-lg transition-colors duration-300 border border-red-700 shadow-lg">
          <PlusCircle size={20} />
          Add New Trophy
        </button>

        <main className="relative z-10 w-full max-w-sm p-2 bg-gradient-to-br from-[#5a3835] to-[#4a2c2a] rounded-lg shadow-2xl border-t-8 border-x-2 border-b-2 border-[#382220]">
            <div
                className="py-4 px-2 rounded-md shadow-inner h-[60vh] overflow-y-auto"
                style={innerBoxStyle}
            >
              <div className="space-y-1">
                {Array.from({ length: displayedSlots }).map((_, i) => (
                  <div key={i} className="flex items-center h-10 space-x-2">
                    <div className="w-8 text-center text-xs text-gray-600 font-mono">{i + 1}</div>
                    <div className="flex-grow h-full">
                      {trophies[i] ?
                        <TrophySlide trophy={trophies[i]} onSelect={handleSelectTrophy} onHoverSound={playHoverSound} /> :
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
        @import url('https://fonts.googleapis.com/css2?family=Cedarville+Cursive&display=swap');
        .font-handwritten { font-family: 'Cedarville Cursive', cursive; }
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