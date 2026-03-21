import React, { useState, useEffect } from 'react';
import { StatusReport, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import StatusTrashCan from '../components/StatusTrashCan';
import ReportMushroomButtons from '../components/ReportMushroomButtons';
import { MessageCircle } from 'lucide-react';
import RecentReports from '../components/RecentReports';
import SystemMessages from '../components/SystemMessages';
import ScheduledDowntime from '../components/ScheduledDowntime';

export default function Home() {
  const [currentStatus, setCurrentStatus] = useState('green');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentStatus();
    checkAdminStatus();
    const interval = setInterval(() => {
      loadCurrentStatus();
    }, 10000); // בדיקה כל 10 שניות
    return () => clearInterval(interval);
  }, []);

  const loadCurrentStatus = async () => {
    try {
      const reports = await StatusReport.filter({ is_hidden: false }, '-created_date', 50);
      
      if (reports.length === 0) {
        setCurrentStatus('green');
        return;
      }

      const now = new Date();
      let activeReport = null;

      // עובר על הדיווחים מהחדש לישן ולוקח את הראשון שתקף
      for (const report of reports) {
        // בדיקה מיוחדת לדיווחים מתוכננים
        if (report.is_scheduled) {
          const scheduledFrom = report.scheduled_from ? new Date(report.scheduled_from) : null;
          const scheduledUntil = report.scheduled_until ? new Date(report.scheduled_until) : null;
          
          // אם הדיווח המתוכנן כבר התחיל ועדיין לא הסתיים
          if (scheduledFrom && scheduledUntil && now >= scheduledFrom && now <= scheduledUntil) {
            activeReport = report;
            break;
          }
          // אם הדיווח המתוכנן עדיין לא התחיל, נמשיך לבדוק דיווחים אחרים
          continue;
        }
        
        if (report.status === 'green') {
          activeReport = report;
          break;
        }
        
        if (report.status === 'red' || report.status === 'orange') {
          // בודק אם הדיווח עדיין תקף (לא פג תוקפו)
          if (!report.expires_at || new Date(report.expires_at) > now) {
            activeReport = report;
            break;
          }
        }
      }

      if (activeReport) {
        setCurrentStatus(activeReport.status);
      } else {
        // אם לא נמצא דיווח תקף, המערכת תקינה
        setCurrentStatus('green');
      }

    } catch (error) {
      console.error('Error loading status:', error);
      setCurrentStatus('green');  
    }
  };

  const checkAdminStatus = async () => {
    try {
      const user = await User.me();
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleReport = async (type) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const now = new Date();
      
      let expiresAt = null;
      if (type === 'red' || type === 'orange') {
        const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60000);
        const recentReports = await StatusReport.filter({
          status: type,
          is_hidden: false
        }, '-created_date', 20);
        
        const recentSimilarReports = recentReports.filter(r => 
          new Date(r.created_date) >= thirtyMinutesAgo
        );
        
        const durationMinutes = recentSimilarReports.length >= 5 ? 60 : 30;
        expiresAt = new Date(now.getTime() + durationMinutes * 60000);
      }
      
      await StatusReport.create({
        status: type,
        description: type === 'green' ? 'איפוס מערכת' : `דיווח ${type}`,
        reporter_type: isAdmin ? 'admin' : 'user',
        expires_at: expiresAt ? expiresAt.toISOString() : null,
        is_hidden: false
      });
      
      await loadCurrentStatus();
      
    } catch (error) {
      console.error('Error creating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGreenReport = async () => {
    await handleReport('green');
  };

  const handleWhatsAppClick = () => {
    alert('אנא המתן');
  };

  const statusConfig = {
    green: { text: 'המערכת תקינה' },
    orange: { text: 'תקלה חלקית במערכת' },
    red: { text: 'המערכת קרסה' },
  };
  
  const { text: statusText } = statusConfig[currentStatus] || statusConfig.green;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-assistant" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
        .font-assistant { font-family: 'Assistant', sans-serif; }
        .header-gradient-border { position: relative; overflow: hidden; }
        .header-gradient-border::after {
          content: ''; position: absolute; bottom: 0; left: -5%; right: -5%;
          height: 30px; background: linear-gradient(to top, rgba(74, 144, 226, 0.4) 0%, transparent 80%);
          transform: skewY(-1deg); transform-origin: center; z-index: 1;
        }
      `}</style>
      
      <header className="bg-white shadow-sm header-gradient-border pb-2">
        <div className="max-w-7xl mx-auto px-4 py-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="w-12 h-12 bg-[#4A90E2] rounded-lg flex items-center justify-center">
                <span className="text-2xl">🗑️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#4A90E2]">פח המשפט</h1>
              </div>
            </div>
            <Link to={createPageUrl('PersonalArea')}>
              <Button 
                style={{ backgroundColor: '#D53343' }}
                className="hover:opacity-90 text-white font-semibold"
              >
                אזור אישי חדש
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <div className="text-center mb-2">
              <h2 className="text-3xl font-bold text-[#4A90E2] mb-1">
                {statusText}
              </h2>
              {currentStatus === 'red' && (
                <p className="text-lg text-red-600 mt-1 font-bold animate-pulse">מת המשפט</p>
              )}
            </div>

            <div className="flex justify-center mb-4">
              <StatusTrashCan status={currentStatus} />
            </div>

            <div className="bg-[#E6EFF9] p-6 max-w-lg mx-auto mb-10 shadow-sm">
              <p className="text-gray-800 font-medium text-lg leading-relaxed text-center">
                במקום לשאול "תגידי, נט המשפט עובד לך?"
                <br/>
                מהיום, נכנסים, מדווחים, וכולם רואים.
              </p>
            </div>

            {isAdmin && (
              <div className="flex justify-center mb-6">
                <ScheduledDowntime onScheduled={loadCurrentStatus} />
              </div>
            )}

            <div className="flex flex-col items-center justify-center gap-4 mb-12">
              <p className="text-lg font-medium text-gray-800">לדיווח על תקלה</p>
              <ReportMushroomButtons onReport={handleReport} isLoading={isLoading} />
            </div>

            {(currentStatus === 'red' || currentStatus === 'orange') && (
              <div className="flex justify-center mb-8">
                <button
                  onClick={handleGreenReport}
                  disabled={isLoading}
                  className="flex flex-col items-center gap-3 text-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
                >
                  <img 
                    src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/e3a39eb95_ChatGPTImageJul30202504_22_23PM.png" 
                    alt="מטף" 
                    className="w-32 h-32 object-contain drop-shadow-lg hover:drop-shadow-xl"
                  />
                  <span className="text-green-600 font-bold">
                    {isLoading ? 'מאפס...' : 'הכל תקין'}
                  </span>
                </button>
              </div>
            )}

            {/* דיווחים אחרונים */}
            <div className="mt-12 max-w-2xl mx-auto">
              <RecentReports />
            </div>
          </div>
          <div className="lg:col-span-1">
            <SystemMessages />
          </div>
        </div>
      </div>

      <button
        onClick={handleWhatsAppClick}
        className="fixed bottom-8 left-8 bg-green-500 hover:bg-green-600 text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transform hover:scale-110 transition-transform z-50 focus:outline-none focus:ring-4 focus:ring-green-300"
        aria-label="צור קשר בווטסאפ"
      >
        <MessageCircle size={32} strokeWidth={2.5} />
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full border-2 border-white">
          חדש
        </span>
      </button>
    </div>
  );
}