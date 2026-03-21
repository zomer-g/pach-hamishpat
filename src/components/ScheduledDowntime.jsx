import React, { useState } from 'react';
import { StatusReport } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock } from 'lucide-react';

export default function ScheduledDowntime({ onScheduled }) {
  const [showDialog, setShowDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    status: 'red',
    description: '',
    durationHours: '48',
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const now = new Date();
      const durationMs = parseInt(formData.durationHours) * 60 * 60 * 1000;
      const scheduledUntil = new Date(now.getTime() + durationMs);

      await StatusReport.create({
        status: formData.status,
        description: formData.description || `השבתה מתוכננת למשך ${formData.durationHours} שעות`,
        reporter_type: 'admin',
        is_scheduled: true,
        scheduled_from: now.toISOString(),
        scheduled_until: scheduledUntil.toISOString(),
        expires_at: scheduledUntil.toISOString(),
        is_hidden: false
      });

      setShowDialog(false);
      setFormData({
        status: 'red',
        description: '',
        durationHours: '48',
      });
      
      if (onScheduled) {
        onScheduled();
      }
    } catch (error) {
      console.error('Error scheduling downtime:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-purple-600 hover:bg-purple-700 text-white"
        size="sm"
      >
        <Calendar className="w-4 h-4 ml-2" />
        תזמון השבתה
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="text-right" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl text-[#4A90E2] flex items-center gap-2">
              <Clock className="w-5 h-5" />
              תזמון השבתה מתוכננת
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                סוג הסטטוס
              </label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({...formData, status: value})}
              >
                <SelectTrigger className="text-right" dir="rtl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="red">🔴 מערכת קרסה</SelectItem>
                  <SelectItem value="orange">🟠 תקלה חלקית</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                משך הזמן (שעות)
              </label>
              <Input
                type="number"
                min="1"
                value={formData.durationHours}
                onChange={(e) => setFormData({...formData, durationHours: e.target.value})}
                className="text-right"
                dir="rtl"
                placeholder="48"
              />
              <p className="text-xs text-gray-500 mt-1">
                ההשבתה תתחיל מיד ותימשך {formData.durationHours} שעות
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                תיאור (אופציונלי)
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="text-right"
                dir="rtl"
                placeholder="למשל: עבודות תחזוקה מתוכננות"
                rows={3}
              />
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 ההשבתה תתחיל מיד ותימשך עד{' '}
                {new Date(Date.now() + parseInt(formData.durationHours) * 60 * 60 * 1000).toLocaleString('he-IL', {
                  dateStyle: 'short',
                  timeStyle: 'short'
                })}
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDialog(false)}
                disabled={isSubmitting}
              >
                ביטול
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !formData.durationHours}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? 'מגדיר...' : 'תזמן השבתה'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}