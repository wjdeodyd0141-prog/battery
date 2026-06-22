'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, GripVertical, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
  isActive: boolean;
}

export default function AdminFaqPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [fetching, setFetching] = useState(true);

  // 새 FAQ 작성 폼
  const [showForm, setShowForm] = useState(false);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [saving, setSaving] = useState(false);

  // 편집 중인 항목
  const [editId, setEditId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState('');
  const [editA, setEditA] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ADMIN')) router.push('/');
  }, [user, loading]);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.get<Faq[]>('/faqs/all')
        .then(setFaqs)
        .catch(() => {})
        .finally(() => setFetching(false));
    }
  }, [user]);

  if (loading || !user || user.role !== 'ADMIN') return null;

  const handleCreate = async () => {
    if (!newQ.trim() || !newA.trim()) { toast.error('질문과 답변을 모두 입력해주세요.'); return; }
    setSaving(true);
    try {
      const created = await api.post<Faq>('/faqs', {
        question: newQ.trim(),
        answer: newA.trim(),
        order: faqs.length,
      });
      setFaqs(prev => [...prev, created]);
      setNewQ(''); setNewA(''); setShowForm(false);
      toast.success('FAQ를 등록했습니다.');
    } catch { toast.error('등록에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  const startEdit = (faq: Faq) => {
    setEditId(faq.id);
    setEditQ(faq.question);
    setEditA(faq.answer);
  };

  const handleUpdate = async (id: string) => {
    if (!editQ.trim() || !editA.trim()) { toast.error('질문과 답변을 모두 입력해주세요.'); return; }
    setEditSaving(true);
    try {
      const updated = await api.patch<Faq>(`/faqs/${id}`, { question: editQ.trim(), answer: editA.trim() });
      setFaqs(prev => prev.map(f => f.id === id ? { ...f, ...updated } : f));
      setEditId(null);
      toast.success('수정했습니다.');
    } catch { toast.error('수정에 실패했습니다.'); }
    finally { setEditSaving(false); }
  };

  const handleToggle = async (faq: Faq) => {
    try {
      await api.patch(`/faqs/${faq.id}`, { isActive: !faq.isActive });
      setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f));
    } catch { toast.error('변경에 실패했습니다.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 FAQ를 삭제하시겠습니까?')) return;
    try {
      await api.delete(`/faqs/${id}`);
      setFaqs(prev => prev.filter(f => f.id !== id));
      toast.success('삭제했습니다.');
    } catch { toast.error('삭제에 실패했습니다.'); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center gap-4">
          <button onClick={() => router.push('/admin')} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">FAQ 관리</h1>
            <p className="text-sm text-gray-400 mt-0.5">자주 묻는 질문을 등록하고 관리하세요</p>
          </div>
          <button
            onClick={() => { setShowForm(true); setEditId(null); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" /> FAQ 추가
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-3">
        {/* 새 FAQ 작성 폼 */}
        {showForm && (
          <div className="bg-white rounded-2xl border-2 border-blue-200 p-5 space-y-3">
            <p className="text-sm font-semibold text-blue-700">새 FAQ 작성</p>
            <input
              type="text"
              placeholder="질문을 입력하세요"
              value={newQ}
              onChange={e => setNewQ(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
            />
            <textarea
              rows={4}
              placeholder="답변을 입력하세요"
              value={newA}
              onChange={e => setNewA(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setShowForm(false); setNewQ(''); setNewA(''); }}
                className="px-4 py-2 border border-gray-200 text-gray-500 text-sm font-semibold rounded-xl hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50"
              >
                {saving ? '저장 중...' : '등록'}
              </button>
            </div>
          </div>
        )}

        {/* FAQ 목록 */}
        {fetching ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 flex flex-col items-center justify-center py-20 text-gray-400">
            <p className="font-semibold text-gray-500">등록된 FAQ가 없습니다</p>
            <p className="text-sm mt-1">상단 FAQ 추가 버튼으로 등록하세요.</p>
          </div>
        ) : (
          faqs.map((faq, idx) => (
            <div key={faq.id} className={`bg-white rounded-2xl border ${faq.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'} p-5`}>
              {editId === faq.id ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editQ}
                    onChange={e => setEditQ(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400"
                  />
                  <textarea
                    rows={4}
                    value={editA}
                    onChange={e => setEditA(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-blue-400 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditId(null)} className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs font-semibold rounded-lg hover:bg-gray-50">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleUpdate(faq.id)} disabled={editSaving} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg disabled:opacity-50">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <div className="flex items-start pt-0.5 text-gray-300">
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Q{idx + 1}</span>
                      {!faq.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">비활성</span>}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">{faq.question}</p>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">{faq.answer}</p>
                  </div>
                  <div className="flex items-start gap-1 shrink-0">
                    <button
                      onClick={() => handleToggle(faq)}
                      title={faq.isActive ? '비활성화' : '활성화'}
                      className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    >
                      {faq.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button onClick={() => startEdit(faq)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(faq.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
