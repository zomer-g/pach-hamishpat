import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReportButton({ type, onReport, isAdmin }) {
  const [showDialog, setShowDialog] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getButtonConfig = () => {
    switch (type) {
      case 'red':
        return {
          color: 'bg-red-500 hover:bg-red-600',
          icon: '🗑️',
          title: 'דיווח תקלה חמורה',
          subtitle: 'המערכת לא עולה כלל',
          placeholder: 'תאר את הבעיה (אופציונלי)'
        };
      case 'orange':
        return {
          color: 'bg-orange-500 hover:bg-orange-600',
          icon: '🗑️',
          title: 'דיווח תקלה',
          subtitle: 'קשיים בקריאת מסמכים או הגשה',
          placeholder: 'תאר את הבעיה (אופציונלי)'
        };
      case 'green':
        return {
          color: 'bg-green-500 hover:bg-green-600',
          icon: '✅',
          title: 'איפוס המערכת',
          subtitle: 'המערכת חזרה לפעול תקין',
          placeholder: 'הערות נוספות (אופציונלי)'
        };
    }
  };

  const config = getButtonConfig();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await onReport(type, description);
    setDescription('');
    setShowDialog(false);
    setIsSubmitting(false);
  };

  if (type === 'green' && !isAdmin) {
    return null; // רק מנהלי מערכת יכולים לדווח ירוק
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className={`${config.color} text-white border-none shadow-xl hover:shadow-2xl 
                   transform hover:scale-105 transition-all duration-300 h-32 w-48 
                   flex flex-col items-center justify-center space-y-2 text-right`}
      >
        <div className="text-4xl mb-2">{config.icon}</div>
        <div className="text-lg font-bold leading-tight">
          {type === 'red' ? 'תקלה חמורה' : 
           type === 'orange' ? 'תקלה רגילה' : 'המערכת תקינה'}
        </div>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#4A90E2]">
              {config.title}
            </DialogTitle>
            <p className="text-gray-600 mt-2">{config.subtitle}</p>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <Textarea
              placeholder={config.placeholder}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-right"
              dir="rtl"
            />
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`${config.color} text-white`}
              >
                {isSubmitting ? 'שולח...' : 'שלח דיווח'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}