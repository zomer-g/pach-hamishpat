
import { useState, useEffect, useRef } from 'react';
import { SystemMessage, User } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Archive, Edit2, ChevronUp, ChevronDown, Image as ImageIcon, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function SystemMessages() {
  const [messages, setMessages] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    image_url: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadMessages();
    checkAdminStatus();
  }, []);

  const loadMessages = async () => {
    const data = await SystemMessage.filter({ is_archived: false }, 'order_index');
    setMessages(data);
  };

  const checkAdminStatus = async () => {
    try {
      const user = await User.me();
      setIsAdmin(user.role === 'admin');
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const handleSave = async () => {
    if (!newMessage.title.trim() && !newMessage.content.trim()) return;

    setIsUploading(true);
    try {
      let dataToSave = { ...newMessage };

      if (imageFile) {
        const { file_url } = await UploadFile({ file: imageFile });
        dataToSave.image_url = file_url;
      }

      if (editingMessage) {
        // If editing and image was cleared or new one added, update image_url
        // The outline simplifies this logic, removing the explicit null setting here.
        // The state `newMessage.image_url` will reflect if the image was cleared by user.
        await SystemMessage.update(editingMessage.id, dataToSave);
      } else {
        // הודעות חדשות יקבלו order_index נמוך כדי להופיע למעלה
        const minOrder = messages.length > 0 ? Math.min(...messages.map(m => m.order_index || 0)) : 0;
        await SystemMessage.create({ ...dataToSave, order_index: minOrder - 1 });
      }

      closeDialog();
      loadMessages();
    } catch (error) {
      console.error("Error saving message:", error);
      // Optionally, display an error message to the user
    } finally {
      setIsUploading(false);
    }
  };

  const handleArchive = async (messageId) => {
    await SystemMessage.update(messageId, { is_archived: true });
    loadMessages();
  };

  const handleEdit = (message) => {
    setEditingMessage(message);
    setNewMessage({
      title: message.title,
      content: message.content,
      image_url: message.image_url || ''
    });
    setImageFile(null); // Clear any previously selected file
    setShowAddDialog(true);
  };

  const moveMessage = async (messageId, direction) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const targetIndex = direction === 'up' ? messageIndex - 1 : messageIndex + 1;
    if (targetIndex < 0 || targetIndex >= messages.length) return;

    const currentMessage = messages[messageIndex];
    const targetMessage = messages[targetIndex];

    // החלף סדרים
    await SystemMessage.update(currentMessage.id, { order_index: targetMessage.order_index });
    await SystemMessage.update(targetMessage.id, { order_index: currentMessage.order_index });

    loadMessages();
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setNewMessage({ ...newMessage, image_url: URL.createObjectURL(file) });
    }
  };

  const handlePaste = (event) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const blob = items[i].getAsFile();
        const file = new File([blob], `pasted-image-${Date.now()}.png`, { type: blob.type });
        setImageFile(file);
        setNewMessage({ ...newMessage, image_url: URL.createObjectURL(file) });
        break;
      }
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setNewMessage({ ...newMessage, image_url: '' });
  };

  const closeDialog = () => {
    setShowAddDialog(false);
    setEditingMessage(null);
    setNewMessage({ title: '', content: '', image_url: '' });
    setImageFile(null);
  };

  return (
    <div className="bg-white shadow-lg h-full" style={{ border: '1px solid #ccc' }}>
      {/* כותרת עם רקע כחול */}
      <div className="bg-[#4A90E2] text-white p-4 flex items-center justify-between">
        <h3 className="text-xl font-bold">הודעות מערכת</h3>
        {isAdmin && (
          <Button
            onClick={() => {
              setEditingMessage(null); // Ensure no editing state when opening for new message
              setNewMessage({ title: '', content: '', image_url: '' }); // Clear fields
              setImageFile(null); // Clear any file
              setShowAddDialog(true);
            }}
            className="bg-[#FF8C42] hover:bg-[#FF7A28] text-white"
            size="sm"
          >
            <Plus className="w-4 h-4 ml-2" />
            הודעה חדשה
          </Button>
        )}
      </div>

      <div className="p-4">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto" dir="rtl">
          {messages.map((message, index) => (
            <div key={message.id} className="border-b pb-4">
              <div className="flex justify-between items-center mb-2">
                <p className="text-sm text-gray-600 font-medium">
                  {new Date(message.created_date).toLocaleDateString('he-IL')}
                </p>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost" size="icon" onClick={() => moveMessage(message.id, 'up')} disabled={index === 0} className="p-1 h-6 w-6">
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" onClick={() => moveMessage(message.id, 'down')} disabled={index === messages.length - 1} className="p-1 h-6 w-6">
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" onClick={() => handleEdit(message)} className="p-1 h-6 w-6">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" onClick={() => handleArchive(message.id)} className="p-1 h-6 w-6">
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              <a href="#" className="text-sm text-[#4A90E2] hover:underline font-semibold block mb-1">
                {message.title}
              </a>
              <p className="text-sm text-gray-800">
                {message.content}
              </p>
              {message.image_url && (
                <div className="mt-2">
                  <img
                    src={message.image_url}
                    alt={message.title}
                    className="w-full h-auto max-h-64 object-contain"
                  />
                </div>
              )}
            </div>
          ))}

          {messages.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              אין הודעות מערכת
            </div>
          )}
        </div>
      </div>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="text-right" dir="rtl" onPaste={handlePaste}>
          <DialogHeader>
            <DialogTitle className="text-xl text-[#4A90E2]">
              {editingMessage ? 'עריכת הודעה' : 'הודעה חדשה'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium text-gray-700">כותרת</label>
              <Input
                placeholder="כותרת ההודעה"
                value={newMessage.title}
                onChange={(e) => setNewMessage({...newMessage, title: e.target.value})}
                className="text-right mt-1"
                dir="rtl"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">תוכן</label>
              <Textarea
                placeholder="תוכן ההודעה"
                value={newMessage.content}
                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                className="text-right mt-1"
                dir="rtl"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">תמונה</label>
              <div
                className="mt-1 border-2 border-dashed border-gray-300 p-4 text-center cursor-pointer hover:border-blue-400"
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                {!newMessage.image_url ? (
                  <div className="text-gray-500">
                    <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                    <p>לחץ להעלאת תמונה או הדבק כאן</p>
                  </div>
                ) : (
                  <div className="relative">
                    <img src={newMessage.image_url} alt="preview" className="w-full h-auto max-h-48 object-contain" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      style={{ borderRadius: '0' }}
                      onClick={(e) => { e.stopPropagation(); clearImage(); }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={closeDialog}
                disabled={isUploading}
              >
                ביטול
              </Button>
              <Button
                onClick={handleSave}
                disabled={isUploading || (!newMessage.title.trim() && !newMessage.content.trim() && !newMessage.image_url && !imageFile)}
                className="bg-[#FF8C42] hover:bg-[#FF7A28] text-white"
              >
                {isUploading ? 'מעלה...' : (editingMessage ? 'עדכן' : 'הוסף')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
