import React, { useState, useEffect } from 'react';
import { StatusReport, User } from '@/api/entities';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import StatusTrashCan from '../components/StatusTrashCan';

export default function PersonalArea() {
  const [currentStatus, setCurrentStatus] = useState('green');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadCurrentStatus();
    checkAdminStatus();
    const interval = setInterval(() => {
      loadCurrentStatus();
    }, 10000);
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

      for (const report of reports) {
        if (report.is_scheduled) {
          const scheduledFrom = report.scheduled_from ? new Date(report.scheduled_from) : null;
          const scheduledUntil = report.scheduled_until ? new Date(report.scheduled_until) : null;
          
          if (scheduledFrom && scheduledUntil && now >= scheduledFrom && now <= scheduledUntil) {
            activeReport = report;
            break;
          }
          continue;
        }
        
        if (report.status === 'green') {
          activeReport = report;
          break;
        }
        
        if (report.status === 'red' || report.status === 'orange') {
          if (!report.expires_at || new Date(report.expires_at) > now) {
            activeReport = report;
            break;
          }
        }
      }

      if (activeReport) {
        setCurrentStatus(activeReport.status);
      } else {
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

  return (
    <div className="min-h-screen font-assistant" style={{ backgroundColor: '#EAF2FD' }} dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
        .font-assistant { font-family: 'Assistant', sans-serif; }
      `}</style>
      
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* כפתור חזרה */}
        <div className="mb-8">
          <Link to={createPageUrl('Home')}>
            <button className="flex items-center gap-2 text-[#4A90E2] hover:text-[#3A7AC2] font-semibold transition-colors">
              <ArrowRight className="w-5 h-5" />
              <span>חזרה לאזור האישי הישן</span>
            </button>
          </Link>
        </div>

        {/* פח הזבל */}
        <div className="flex justify-center mb-16">
          <StatusTrashCan status={currentStatus} />
        </div>

        {/* באנר לבן תחתון עם הכפתורים */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-black text-center mb-8">פעולות</h3>
          
          <div className="flex justify-center items-center gap-12">
            {/* כפתור תקלה חלקית */}
            <button
              onClick={() => handleReport('orange')}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center shadow-md hover:shadow-lg">
                <span className="text-4xl">🟠</span>
              </div>
              <span className="text-sm font-medium text-black">תקלה חלקית</span>
            </button>

            {/* כפתור המערכת קרסה */}
            <button
              onClick={() => handleReport('red')}
              disabled={isLoading}
              className="flex flex-col items-center gap-3 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
            >
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center shadow-md hover:shadow-lg">
                <span className="text-4xl">🔴</span>
              </div>
              <span className="text-sm font-medium text-black">המערכת קרסה</span>
            </button>

            {/* כפתור מטף - הכל תקין */}
            {(currentStatus === 'red' || currentStatus === 'orange') && (
              <button
                onClick={() => handleReport('green')}
                disabled={isLoading}
                className="flex flex-col items-center gap-3 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
              >
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center shadow-md hover:shadow-lg">
                  <span className="text-4xl">🧯</span>
                </div>
                <span className="text-sm font-medium text-black">הכל תקין</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}