'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3,
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    List, ListOrdered, Image as ImageIcon, Link as LinkIcon,
    Undo, Redo, Smile, Code
} from 'lucide-react';
import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    onImageUpload?: (file: File) => Promise<string>;
    placeholder?: string;
}

export default function RichTextEditor({
    value,
    onChange,
    onImageUpload,
    placeholder = 'Nhập nội dung...'
}: RichTextEditorProps) {
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            TextStyle,
            Color,
            Image,
            Link.configure({
                openOnClick: false,
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
            },
        },
    });

    const addImage = useCallback(async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file && editor) {
                if (onImageUpload) {
                    try {
                        const url = await onImageUpload(file);
                        editor.chain().focus().setImage({ src: url }).run();
                    } catch (error) {
                        console.error('Upload failed:', error);
                        alert('Upload hình ảnh thất bại');
                    }
                } else {
                    // Fallback: use base64
                    const reader = new FileReader();
                    reader.onload = () => {
                        if (reader.result && editor) {
                            editor.chain().focus().setImage({ src: reader.result as string }).run();
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
        };
        input.click();
    }, [editor, onImageUpload]);

    const setLink = useCallback(() => {
        if (!editor) return;

        if (linkUrl) {
            editor.chain().focus().setLink({ href: linkUrl }).run();
            setLinkUrl('');
            setShowLinkInput(false);
        } else {
            editor.chain().focus().unsetLink().run();
        }
    }, [editor, linkUrl]);

    const addEmoji = useCallback((emojiObject: any) => {
        if (editor) {
            editor.chain().focus().insertContent(emojiObject.emoji).run();
            setShowEmojiPicker(false);
        }
    }, [editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border border-dark-200 rounded-lg overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="border-b border-dark-200 bg-dark-50 p-2 flex flex-wrap gap-1">
                {/* Text Format */}
                <button
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('bold') ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('italic') ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('strike') ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Strikethrough"
                >
                    <Strikethrough className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('code') ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Code"
                >
                    <Code className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-dark-200 mx-1"></div>

                {/* Headings */}
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('heading', { level: 1 }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Heading 1"
                >
                    <Heading1 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('heading', { level: 2 }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Heading 2"
                >
                    <Heading2 className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('heading', { level: 3 }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Heading 3"
                >
                    <Heading3 className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-dark-200 mx-1"></div>

                {/* Alignment */}
                <button
                    onClick={() => editor.chain().focus().setTextAlign('left').run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('center').run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('right').run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Justify"
                >
                    <AlignJustify className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-dark-200 mx-1"></div>

                {/* Lists */}
                <button
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('bulletList') ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('orderedList') ? 'bg-primary-100 text-primary-600' : ''}`}
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>

                <div className="w-px h-6 bg-dark-200 mx-1"></div>

                {/* Insert */}
                <button
                    onClick={addImage}
                    className="p-2 rounded hover:bg-dark-100"
                    title="Insert Image"
                >
                    <ImageIcon className="w-4 h-4" />
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowLinkInput(!showLinkInput)}
                        className={`p-2 rounded hover:bg-dark-100 ${editor.isActive('link') ? 'bg-primary-100 text-primary-600' : ''}`}
                        title="Insert Link"
                    >
                        <LinkIcon className="w-4 h-4" />
                    </button>
                    {showLinkInput && (
                        <div className="absolute top-full left-0 mt-1 z-10 bg-white border border-dark-200 rounded-lg shadow-lg p-2 flex gap-2">
                            <input
                                type="url"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="px-2 py-1 border border-dark-200 rounded text-sm w-48"
                            />
                            <button
                                onClick={setLink}
                                className="px-3 py-1 bg-primary-500 text-white rounded text-sm hover:bg-primary-600"
                            >
                                OK
                            </button>
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-2 rounded hover:bg-dark-100"
                        title="Insert Emoji"
                    >
                        <Smile className="w-4 h-4" />
                    </button>
                    {showEmojiPicker && (
                        <div className="absolute top-full left-0 mt-1 z-10">
                            <EmojiPicker onEmojiClick={addEmoji} />
                        </div>
                    )}
                </div>

                <div className="w-px h-6 bg-dark-200 mx-1"></div>

                {/* Undo/Redo */}
                <button
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-2 rounded hover:bg-dark-100 disabled:opacity-50"
                    title="Undo"
                >
                    <Undo className="w-4 h-4" />
                </button>
                <button
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-2 rounded hover:bg-dark-100 disabled:opacity-50"
                    title="Redo"
                >
                    <Redo className="w-4 h-4" />
                </button>

                {/* Color Picker */}
                <div className="ml-auto flex gap-2 items-center">
                    <label className="text-xs text-dark-600">Text Color:</label>
                    <input
                        type="color"
                        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
                        value={editor.getAttributes('textStyle').color || '#000000'}
                        className="w-8 h-6 rounded cursor-pointer"
                    />
                </div>
            </div>

            {/* Editor Content */}
            <EditorContent editor={editor} className="min-h-[300px]" />

            {/* Character Count */}
            <div className="border-t border-dark-200 bg-dark-50 px-4 py-2 text-xs text-dark-600">
                {editor.storage.characterCount?.characters() || 0} ký tự
            </div>
        </div>
    );
}
