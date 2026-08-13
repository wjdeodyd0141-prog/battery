'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Popup } from '@/lib/types';

const STORAGE_KEY = 'popup_dismissed';
const TODAY = new Date().toLocaleDateString('ko-KR');

function getDismissed(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function isDismissedToday(id: string): boolean {
  return getDismissed()[id] === TODAY;
}

function dismissToday(id: string) {
  const d = getDismissed();
  d[id] = TODAY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

function FloatingPopup({
  popup,
  onClose,
  onDismissToday,
}: {
  popup: Popup;
  onClose: () => void;
  onDismissToday: () => void;
}) {
  const imageBlock = popup.imageUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={popup.imageUrl} alt={popup.title} className="w-full block" />
  ) : null;

  const widthClass = popup.size === 'LG' ? 'w-[500px]' : popup.size === 'MD' ? 'w-96' : 'w-64';

  return (
    <div className={`${widthClass} max-h-[85vh] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col pointer-events-auto`}>
      {/* 닫기 버튼 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800">
        <span className="text-xs text-gray-300 font-medium truncate">{popup.title}</span>
        <button onClick={onClose} className="ml-2 p-0.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors shrink-0">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 이미지 + 텍스트 (스크롤 영역) */}
      <div className="overflow-y-auto flex-1">
        {imageBlock && (
          popup.linkUrl
            ? <Link href={popup.linkUrl} target="_blank" rel="noopener noreferrer">{imageBlock}</Link>
            : imageBlock
        )}
        {popup.content && (
          <div className="px-3 py-2.5">
            <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{popup.content}</p>
          </div>
        )}
      </div>

      {/* 하단 */}
      <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2 bg-gray-50">
        <button
          onClick={onDismissToday}
          className="text-[11px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          오늘 하루 보지 않기
        </button>
        <button
          onClick={onClose}
          className="text-[11px] text-gray-500 hover:text-gray-800 font-medium transition-colors"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default function PopupManager() {
  const [popups, setPopups] = useState<Popup[]>([]);

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${base}/popups`)
      .then(r => r.json())
      .then((all: Popup[]) => {
        setPopups(all.filter(p => !isDismissedToday(p.id)));
      })
      .catch(() => {});
  }, []);

  const remove = (id: string) => setPopups(prev => prev.filter(p => p.id !== id));

  const handleClose = (id: string) => remove(id);

  const handleDismissToday = (id: string) => {
    dismissToday(id);
    remove(id);
  };

  if (popups.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center gap-3 p-4 pointer-events-none">
      {popups.map(popup => (
        <FloatingPopup
          key={popup.id}
          popup={popup}
          onClose={() => handleClose(popup.id)}
          onDismissToday={() => handleDismissToday(popup.id)}
        />
      ))}
    </div>
  );
}
