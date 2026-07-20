'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { useRef } from 'react';
import { Bold, Italic, List, ListOrdered, ImageIcon, Heading2, Heading3, Minus } from 'lucide-react';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';

interface Props {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] p-4 focus:outline-none',
      },
    },
  });

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || !editor) return;
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file, 'products/detail');
        editor.chain().focus().setImage({ src: url }).run();
      } catch {
        toast.error('이미지 업로드 실패');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!editor) return null;

  const btn = (active: boolean) =>
    `p-1.5 rounded transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`;

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive('heading', { level: 2 }))}>
          <Heading2 className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btn(editor.isActive('heading', { level: 3 }))}>
          <Heading3 className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive('bold'))}>
          <Bold className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive('italic'))}>
          <Italic className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive('bulletList'))}>
          <List className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive('orderedList'))}>
          <ListOrdered className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btn(false)}>
          <Minus className="w-4 h-4" />
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className={btn(false)}>
          <ImageIcon className="w-4 h-4" />
        </button>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          multiple className="hidden" onChange={e => handleImageUpload(e.target.files)} />
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} className="bg-white" />

      <style>{`
        .ProseMirror img { max-width: 100%; height: auto; border-radius: 8px; margin: 8px 0; }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.4rem; }
        .ProseMirror ul { list-style: disc; padding-left: 1.5rem; }
        .ProseMirror ol { list-style: decimal; padding-left: 1.5rem; }
        .ProseMirror hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left; color: #adb5bd; pointer-events: none; height: 0;
        }
      `}</style>
    </div>
  );
}
