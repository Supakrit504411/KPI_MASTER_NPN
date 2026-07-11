import { useState, useCallback } from 'react';
import { updateNote } from '../services/googleSheet';
import { toast } from 'sonner';

/**
 * Custom Hook สำหรับจัดการหมายเหตุ
 * Container logic
 */
export default function useNotes() {
  const [notes, setNotes] = useState(() => {
    try {
      const saved = localStorage.getItem('pea-dashboard-notes');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveNotesToStorage = useCallback((updatedNotes) => {
    setNotes(updatedNotes);
    localStorage.setItem('pea-dashboard-notes', JSON.stringify(updatedNotes));
  }, []);

  const handleNoteChange = useCallback((rowIndex, value) => {
    setNotes((prev) => {
      const updated = { ...prev, [rowIndex]: value };
      localStorage.setItem('pea-dashboard-notes', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const handleSaveNote = useCallback(
    async (rowIndex, value, meta = {}) => {
      try {
        const result = await updateNote(rowIndex, value, meta);

        if (result.local) {
          // บันทึกแค่ localStorage (ยังไม่ได้ตั้งค่า Google Apps Script)
          toast.info('บันทึกหมายเหตุแล้ว (เก็บไว้ในเครื่อง)', {
            description: 'หากต้องการบันทึกไป Google Sheet โปรดตั้งค่า Apps Script URL',
          });
        } else {
          toast.success('บันทึกหมายเหตุไปยัง Google Sheet สำเร็จ');
        }

        saveNotesToStorage({ ...notes, [rowIndex]: value });
      } catch (err) {
        console.error('Failed to save note:', err);
        toast.error('บันทึกหมายเหตุล้มเหลว', {
          description: err.message,
        });
      }
    },
    [notes, saveNotesToStorage]
  );

  return {
    notes,
    handleNoteChange,
    handleSaveNote,
  };
}
