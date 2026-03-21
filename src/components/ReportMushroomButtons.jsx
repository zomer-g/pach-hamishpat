
export default function ReportMushroomButtons({ onReport, isLoading }) {
  const MushroomButton = ({ type, label, imageUrl, description }) => {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={() => onReport(type)}
          disabled={isLoading}
          className="group transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
          aria-label={`דווח על ${label}`}
        >
          <div className="relative w-20 h-20 md:w-24 md:h-24">
            <img
              src={imageUrl}
              alt={`כפתור דיווח ${type}`}
              className="w-full h-full object-contain drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300"
            />
            <div className="absolute inset-0 bg-white/10 rounded-full opacity-0 group-hover:opacity-100 group-active:opacity-30 transition-opacity duration-200"></div>
          </div>
        </button>
        <p className="mt-3 text-center font-semibold text-gray-700 text-sm md:text-base">
          {label}
        </p>
        <p className="mt-1 text-center text-xs md:text-sm text-gray-500 max-w-32 leading-tight">
          {description}
        </p>
      </div>
    );
  };

  return (
    <div className="flex items-end justify-center gap-12 md:gap-20 mt-6">
      <MushroomButton 
        type="orange" 
        label="תקלה חלקית" 
        imageUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/1c543ee76_bORANGE.png"
        description="לא ניתן לצפות בהחלטות או להגיש בקשות"
      />
      <MushroomButton 
        type="red" 
        label="המערכת קרסה" 
        imageUrl="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/5d255b9c7_bRED.png"
        description="אין בכלל אפשרות לגשת לאתר"
      />
    </div>
  );
}