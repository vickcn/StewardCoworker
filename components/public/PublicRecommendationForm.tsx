'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  shareToken: string;
  itemId: string;
}

const VISITOR_NAME_KEY = 'steward_public_name';
const VISITOR_NAME_EVENT = 'steward_public_name_change';
const MAX_PREVIEW_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

async function fileToBase64(file: File) {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('讀取示意圖失敗'));
    reader.readAsDataURL(file);
  });
  const markerIndex = dataUrl.indexOf(',');
  if (markerIndex < 0) throw new Error('示意圖格式錯誤');
  return dataUrl.slice(markerIndex + 1);
}

export function PublicRecommendationForm({ shareToken, itemId }: Props) {
  const router = useRouter();
  const [visitorName, setVisitorName] = useState('');
  const [url, setUrl] = useState('');
  const [note, setNote] = useState('');
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    function syncName() {
      try {
        setVisitorName(window.localStorage.getItem(VISITOR_NAME_KEY)?.trim() ?? '');
      } catch {
        setVisitorName('');
      }
    }

    function onNameChange(event: Event) {
      const detail = (event as CustomEvent<string>).detail ?? '';
      setVisitorName(detail);
    }

    syncName();
    window.addEventListener(VISITOR_NAME_EVENT, onNameChange);
    window.addEventListener('storage', syncName);
    return () => {
      window.removeEventListener(VISITOR_NAME_EVENT, onNameChange);
      window.removeEventListener('storage', syncName);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let trimmedAuthor = '';
      try {
        trimmedAuthor = window.localStorage.getItem(VISITOR_NAME_KEY)?.trim() ?? '';
      } catch {
        trimmedAuthor = visitorName.trim();
      }
      if (!trimmedAuthor) {
        throw new Error('請先在上方填寫你的名字');
      }

      let imagePayload: {
        imageBase64: string;
        imageMimeType: string;
        imageOriginalName: string;
      } | undefined;
      if (previewImage) {
        if (!previewImage.type.startsWith('image/')) {
          throw new Error('示意圖必須是圖片檔');
        }
        if (previewImage.size > MAX_PREVIEW_IMAGE_SIZE) {
          throw new Error('示意圖大小不可超過 8MB');
        }
        imagePayload = {
          imageBase64: await fileToBase64(previewImage),
          imageMimeType: previewImage.type,
          imageOriginalName: previewImage.name || 'preview-image',
        };
      }

      const res = await fetch(`/api/public/${shareToken}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ADD_RECOMMENDATION',
          itemId,
          author: trimmedAuthor,
          url,
          note,
          ...imagePayload,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? '提交失敗');
      }
      try {
        window.localStorage.setItem(VISITOR_NAME_KEY, trimmedAuthor);
        setVisitorName(trimmedAuthor);
      } catch {
        // ignore storage errors
      }
      setPreviewImage(null);
      setUrl('');
      setNote('');
      setDone(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失敗');
    } finally {
      setLoading(false);
    }
  }

  if (done) return <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">推薦連結已提交！</p>;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold text-gray-900">推薦購買連結</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <p className="text-sm text-gray-600">
            推薦人將使用上方「你的名字」：{visitorName || '尚未填寫'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">連結網址 *</label>
          <input required type="url" value={url} onChange={(e) => setUrl(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            placeholder="https://..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">備註（選填）</label>
          <input value={note} onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">示意圖（選填）</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setPreviewImage(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg file:border file:border-gray-300 file:bg-white file:px-3 file:py-2 file:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            送出推薦後會上傳到專案雲端硬碟，檔名格式：品項_你的名字_時間戳。
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
          {loading ? '提交中...' : '提交推薦'}
        </button>
      </form>
    </div>
  );
}
