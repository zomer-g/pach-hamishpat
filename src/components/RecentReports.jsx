import React, { useState, useEffect } from 'react';
import { StatusReport, ReportComment, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Clock, AlertCircle, CheckCircle, Info, MessageSquare, Users, History } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function RecentReports() {
  const [reports, setReports] = useState([]);
  const [comments, setComments] = useState([]);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [newComment, setNewComment] = useState({ content: '', author_name: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [daysToShow, setDaysToShow] = useState(1);
  const [reloadCounter, setReloadCounter] = useState(0);


  useEffect(() => {
    loadReports();
    loadComments();
  }, [daysToShow, reloadCounter]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const loadReports = async () => {
    const sinceDate = new Date(Date.now() - daysToShow * 24 * 60 * 60 * 1000);
    const visibleReports = await StatusReport.filter({ is_hidden: false }, '-created_date', 500);
    const recentReports = visibleReports.filter(
      report => new Date(report.created_date) >= sinceDate
    );
    setReports(recentReports);
  };

  const loadComments = async () => {
    const sinceDate = new Date(Date.now() - daysToShow * 24 * 60 * 60 * 1000);
    const visibleComments = await ReportComment.filter({ is_hidden: false }, '-created_date', 500);
    const recentComments = visibleComments.filter(
      comment => new Date(comment.created_date) >= sinceDate
    );
    setComments(recentComments);
  };

  const checkAdminStatus = async () => {
    try {
      const user = await User.me();
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.content.trim()) return;
    
    setIsLoading(true);
    try {
      await ReportComment.create({
        content: newComment.content,
        author_name: newComment.author_name || 'אנונימי',
        is_admin: isAdmin,
        is_hidden: false // Ensure new comments are not hidden
      });
      
      setNewComment({ content: '', author_name: '' });
      setShowCommentForm(false);
      setReloadCounter(c => c + 1);
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!isAdmin) return;
    try {
      await ReportComment.update(commentId, { is_hidden: true });
      setReloadCounter(c => c + 1);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (!isAdmin) return;
    try {
      await StatusReport.update(reportId, { is_hidden: true });
      setReloadCounter(c => c + 1);
    } catch (error) {
      console.error('Error deleting report:', error);
    }
  };

  const handleLoadMore = () => {
    setDaysToShow(prev => prev + 7);
  }

  const formatIsraeliTime = (dateString) => {
    // ודא ש-dateString מפורש כ-UTC
    let date;
    if (!dateString.endsWith('Z') && !dateString.includes('+')) {
      date = new Date(dateString + 'Z');
    } else {
      date = new Date(dateString);
    }
    
    return date.toLocaleString('he-IL', {
      timeZone: 'Asia/Jerusalem',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'red':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'orange':
        return <Info className="w-5 h-5 text-orange-500" />;
      case 'green':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusMessage = (status, reporterType) => {
    switch (status) {
      case 'red':
        return 'דיווח: המערכת קרסה';
      case 'orange':
        return 'דיווח: תקלה חלקית';
      case 'green':
        return 'מנהל עדכן: המערכת חזרה לפעול תקין';
      default:
        return 'דיווח חדש';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'red':
        return 'bg-red-50 border-red-200';
      case 'orange':
        return 'bg-orange-50 border-orange-200';
      case 'green':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  // איחוד ומיון הדיווחים והתגובות לפי זמן יצירה
  const allItems = [
    ...reports.map(report => ({ ...report, type: 'report' })),
    ...comments.map(comment => ({ ...comment, type: 'comment' }))
  ].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden" style={{ border: '1px solid #ccc' }}>
      <div className="bg-[#4A90E2] text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          <h3 className="text-xl font-bold">עדכונים אחרונים</h3>
        </div>
        <Button
          onClick={() => setShowCommentForm(true)}
          className="bg-[#FF8C42] hover:bg-[#FF7A28] text-white"
          size="sm"
        >
          <Plus className="w-4 h-4 ml-2" />
          הוסף הערה
        </Button>
      </div>

      <div className="p-4">
        {showCommentForm && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
            <div className="space-y-3">
              <Input
                placeholder="השם שלך (אופציונלי)"
                value={newComment.author_name}
                onChange={(e) => setNewComment({...newComment, author_name: e.target.value})}
                className="text-right"
                dir="rtl"
              />
              <Textarea
                placeholder="שתף את החוויה שלך או הוסף מידע נוסף..."
                value={newComment.content}
                onChange={(e) => setNewComment({...newComment, content: e.target.value})}
                className="text-right min-h-[80px]"
                dir="rtl"
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentForm(false);
                    setNewComment({ content: '', author_name: '' });
                  }}
                  disabled={isLoading}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleAddComment}
                  disabled={isLoading || !newComment.content.trim()}
                  className="bg-[#FF8C42] hover:bg-[#FF7A28] text-white"
                >
                  {isLoading ? 'שולח...' : 'שלח הערה'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 max-h-[60vh] overflow-y-auto" dir="rtl">
          {allItems.map((item, index) => (
            <div key={`${item.type}-${item.id}`} className={`p-3 rounded-lg border ${item.type === 'report' ? getStatusColor(item.status) : 'bg-blue-50 border-blue-200'}`}>
              {item.type === 'report' ? (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(item.status)}
                    <span className="text-sm font-medium text-gray-800">
                      {getStatusMessage(item.status, item.reporter_type)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatIsraeliTime(item.created_date)}
                    </span>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteReport(item.id)}
                        className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium text-gray-800">
                        {item.author_name}
                        {item.is_admin && (
                          <span className="mr-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
                            מנהל
                          </span>
                        )}
                        הוסיף הערה
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatIsraeliTime(item.created_date)}
                      </span>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteComment(item.id)}
                          className="p-1 h-6 w-6 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mr-6 bg-white/70 p-2 rounded border">
                    {item.content}
                  </p>
                </div>
              )}
            </div>
          ))}

          {allItems.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">אין עדכונים ב-{daysToShow === 1 ? '24 שעות' : `${daysToShow} ימים`} האחרונים</p>
              <p className="text-sm">דיווחים והערות יופיעו כאן</p>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <Button variant="outline" onClick={handleLoadMore}>
            <History className="w-4 h-4 ml-2" />
            טען דיווחים מהשבוע האחרון
          </Button>
        </div>
      </div>
    </div>
  );
}