'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface Integration {
  spreadsheetId: string | null;
  sheetName: string | null;
  driveFolderId: string | null;
}

interface ShareSettings {
  shareToken: string;
  isEnabled: boolean;
  allowClaim: boolean;
  allowComment: boolean;
  allowRecommendation: boolean;
  allowReceiptUpload: boolean;
  visibleFields: string[];
}

export default function ProjectSettingsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [integration, setIntegration] = useState<Integration>({
    spreadsheetId: '',
    sheetName: '',
    driveFolderId: '',
  });
  const [share, setShare] = useState<ShareSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/integrations`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/share`).then((r) => r.json()),
    ]).then(([intRes, shareRes]) => {
      if (intRes.data) setIntegration(intRes.data);
      if (shareRes.data) setShare(shareRes.data);
    });
  }, [projectId]);

  async function saveIntegration() {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/integrations`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(integration),
      });
      if (!res.ok) throw new Error('儲存失敗');
      setMessage('Google 整合設定已儲存');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  async function saveShare(updated: ShareSettings) {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch(`/api/projects/${projectId}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('儲存失敗');
      setShare(data.data);
      setMessage('公開分享設定已儲存');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '儲存失敗');
    } finally {
      setSaving(false);
    }
  }

  const shareUrl = share?.isEnabled
    ? `${window.location.origin}/p/${share.shareToken}`
    : null;

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Google Integration */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Google 整合</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Spreadsheet ID</label>
          <input
            value={integration.spreadsheetId ?? ''}
            onChange={(e) => setIntegration((p) => ({ ...p, spreadsheetId: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            placeholder="從 Google Sheet URL 複製"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">工作表名稱</label>
          <input
            value={integration.sheetName ?? ''}
            onChange={(e) => setIntegration((p) => ({ ...p, sheetName: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder="例：工作表1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Drive 資料夾 ID（選填）</label>
          <input
            value={integration.driveFolderId ?? ''}
            onChange={(e) => setIntegration((p) => ({ ...p, driveFolderId: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
            placeholder="收據上傳目標資料夾"
          />
        </div>
        <button
          onClick={saveIntegration}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          儲存整合設定
        </button>
      </section>

      {/* Public Share Settings */}
      {share && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold">公開分享設定</h2>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={share.isEnabled}
              onChange={(e) => saveShare({ ...share, isEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm font-medium">啟用公開分享連結</span>
          </label>

          {share.isEnabled && shareUrl && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2">
              <p className="text-xs text-gray-500 mb-1">分享連結</p>
              <div className="flex items-center gap-2">
                <code className="text-xs text-gray-800 break-all">{shareUrl}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                  className="shrink-0 text-xs text-blue-600 hover:underline"
                >
                  複製
                </button>
              </div>
            </div>
          )}

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700">訪客可進行的操作</legend>
            {([
              ['allowClaim', '認領品項'],
              ['allowComment', '留言'],
              ['allowRecommendation', '推薦連結'],
              ['allowReceiptUpload', '上傳收據 / 圖片'],
            ] as const).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={share[key]}
                  onChange={(e) => saveShare({ ...share, [key]: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </fieldset>
        </section>
      )}

      {message && (
        <p className="text-sm text-green-700 bg-green-50 rounded-lg px-4 py-2">{message}</p>
      )}
    </div>
  );
}
