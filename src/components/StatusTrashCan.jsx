import { useState } from 'react';

const trashCanConfig = {
  green: {
    imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/d4101aa8b_GREEN.png',
    text: 'המערכת תקינה',
    animationClass: 'animate-gentle-sway',
  },
  orange: {
    imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/ec3d73726_ORANGE.png',
    text: 'תקלה חלקית במערכת',
    animationClass: 'animate-smoke-rise',
  },
  red: {
    imageUrl: 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6ea5658d9_red.png',
    text: 'המערכת קרסה',
    animationClass: 'animate-fire-flicker',
  },
};

export default function StatusTrashCan({ status }) {
  const config = trashCanConfig[status] || trashCanConfig.green;
  const [clickStyle, setClickStyle] = useState({});

  const createSound = () => {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const now = audioContext.currentTime;

        const soundLibrary = [
            // 1. Sharp metallic "tink"
            () => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(2200, now);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

                const osc2 = audioContext.createOscillator();
                const gain2 = audioContext.createGain();
                osc2.connect(gain2);
                gain2.connect(audioContext.destination);
                osc2.type = 'square';
                osc2.frequency.setValueAtTime(3300, now);
                gain2.gain.setValueAtTime(0.08, now);
                gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

                osc.start(now);
                osc.stop(now + 0.2);
                osc2.start(now);
                osc2.stop(now + 0.1);
            },
            // 2. Deeper metallic "clank"
            () => {
                [1, 1.6, 2.9, 4.2].forEach(ratio => {
                    const osc = audioContext.createOscillator();
                    const gain = audioContext.createGain();
                    osc.connect(gain);
                    gain.connect(audioContext.destination);
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(180 * ratio, now);
                    gain.gain.setValueAtTime(0.1, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
                    osc.start(now);
                    osc.stop(now + 0.5);
                });
            },
            // 3. Short, dull "thud"
            () => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialrampToValueAtTime(80, now + 0.1);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            },
            // 4. Hollow "bonk"
            () => {
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gain.gain.setValueAtTime(0.6, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            },
        ];

        const randomSoundFn = soundLibrary[Math.floor(Math.random() * soundLibrary.length)];
        randomSoundFn();

    } catch (err) {
        console.log("Audio not supported or failed:", err);
    }
  };

  const handleClick = (e) => {
    createSound();

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // חלוקה לחמישה אזורים
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    let translateX = 0;
    let translateY = 0;
    let rotation = 0;
    
    // אזור שמאלי עליון
    if (clickX < rect.width * 0.4 && clickY < rect.height * 0.4) {
      translateX = -8;
      translateY = -6;
      rotation = -4;
    }
    // אזור ימני עליון
    else if (clickX > rect.width * 0.6 && clickY < rect.height * 0.4) {
      translateX = 8;
      translateY = -6;
      rotation = 4;
    }
    // אזור שמאלי תחתון
    else if (clickX < rect.width * 0.4 && clickY > rect.height * 0.6) {
      translateX = -8;
      translateY = 6;
      rotation = -3;
    }
    // אזור ימני תחתון
    else if (clickX > rect.width * 0.6 && clickY > rect.height * 0.6) {
      translateX = 8;
      translateY = 6;
      rotation = 3;
    }
    // אזור מרכזי
    else {
      translateX = clickX < centerX ? -5 : 5;
      translateY = -8;
      rotation = clickX < centerX ? -2 : 2;
    }
    
    setClickStyle({
      transform: `translate(${translateX}px, ${translateY}px) rotate(${rotation}deg)`,
      transition: 'transform 120ms ease-out',
    });

    setTimeout(() => {
      setClickStyle({
        transform: 'translate(0px, 0px) rotate(0deg)',
        transition: 'transform 250ms ease-in-out'
      });
    }, 120);
  };

  return (
    <div className="flex flex-col items-center">
      <style>{`
        /* ... keep existing code (CSS animations) ... */
      `}</style>
      <div 
        className="relative w-72 h-72 md:w-96 md:h-96 drop-shadow-2xl cursor-pointer select-none"
        onClick={handleClick}
      >
        <img
          src={config.imageUrl}
          alt={`פח זבל במצב ${status}`}
          className={`w-full h-full object-contain ${config.animationClass}`}
          style={{...clickStyle, willChange: 'transform'}}
          draggable={false}
        />
        {status === 'orange' && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="smoke-particle p1"></div>
            <div className="smoke-particle p2"></div>
            <div className="smoke-particle p3"></div>
          </div>
        )}
      </div>
    </div>
  );
}