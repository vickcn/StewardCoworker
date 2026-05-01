'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

const GOOGLE_PICKER_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PICKER_API_KEY || '';
const GOOGLE_PICKER_APP_ID = process.env.NEXT_PUBLIC_GOOGLE_PICKER_APP_ID || '';

type PickerTarget = 'spreadsheet' | 'driveFolder';

function normalizeSpreadsheetId(value: string | null | undefined) {
  if (!value) return '';
  const input = value.trim();
  if (!input) return '';
  const match = input.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? input;
}

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
  const [pickerReady, setPickerReady] = useState(false);
  const [sheetNameOptions, setSheetNameOptions] = useState<string[]>([]);
  const [sheetNameLoading, setSheetNameLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${projectId}/integrations`).then((r) => r.json()),
      fetch(`/api/projects/${projectId}/share`).then((r) => r.json()),
    ]).then(([intRes, shareRes]) => {
      if (intRes.data) setIntegration(intRes.data);
      if (shareRes.data) setShare(shareRes.data);
    });
  }, [projectId]);

  useEffect(() => {
    const w = window as Window & { gapi?: { load: (name: string, options: { callback: () => void }) => void } };
    const onPickerLoaded = () => setPickerReady(true);
    const loadPicker = () => {
      if (w.gapi?.load) {
        w.gapi.load('picker', { callback: onPickerLoaded });
      }
    };

    if (w.gapi?.load) {
      loadPicker();
      return;
    }

    const existing = document.querySelector('script[data-google-picker="1"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', loadPicker);
      return () => existing.removeEventListener('load', loadPicker);
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.dataset.googlePicker = '1';
    script.onload = loadPicker;
    script.onerror = () => setMessage('Google Picker 載入失敗，請改用手動貼上 ID。');
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const spreadsheetId = normalizeSpreadsheetId(integration.spreadsheetId);
    if (!spreadsheetId) {
      setSheetNameOptions([]);
      setSheetNameLoading(false);
      return;
    }

    const controller = new AbortController();
    setSheetNameLoading(true);

    fetch(
      `/api/projects/${projectId}/integrations/sheets?spreadsheetId=${encodeURIComponent(spreadsheetId)}`,
      { signal: controller.signal },
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || '無法載入工作表清單');
        const names = Array.isArray(data?.data?.sheetNames)
          ? data.data.sheetNames.filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0)
          : [];
        setSheetNameOptions(names);
        if (!(integration.sheetName ?? '').trim() && names.length === 1) {
          setIntegration((prev) => ({ ...prev, sheetName: names[0] }));
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSheetNameOptions([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setSheetNameLoading(false);
      });

    return () => controller.abort();
  }, [projectId, integration.spreadsheetId]);

  async function getGoogleAccessToken(): Promise<string> {
    const res = await fetch('/api/google/access-token');
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || '無法取得 Google 授權，請重新登入後再試。');
    }
    const token = data?.data?.accessToken;
    if (!token) throw new Error('找不到 Google Access Token。');
    return token as string;
  }

  async function browseGoogle(target: PickerTarget) {
    setMessage('');
    if (!pickerReady) {
      setMessage('Google Picker 尚未載入完成，請稍後再試。');
      return;
    }
    if (!GOOGLE_PICKER_API_KEY) {
      setMessage('尚未設定 NEXT_PUBLIC_GOOGLE_PICKER_API_KEY，請先手動貼上 ID。');
      return;
    }

    try {
      const accessToken = await getGoogleAccessToken();
      const w = window as Window & { google?: { picker?: any } };
      const pickerApi = w.google?.picker;
      if (!pickerApi) throw new Error('Google Picker 尚未初始化完成。');

      const view = target === 'spreadsheet'
        ? new pickerApi.DocsView(pickerApi.ViewId.SPREADSHEETS).setMimeTypes('application/vnd.google-apps.spreadsheet')
        : new pickerApi.DocsView(pickerApi.ViewId.DOCS)
          .setIncludeFolders(true)
          .setSelectFolderEnabled(true)
          .setMimeTypes('application/vnd.google-apps.folder');

      const pickerBuilder = new pickerApi.PickerBuilder()
        .setOAuthToken(accessToken)
        .setDeveloperKey(GOOGLE_PICKER_API_KEY)
        .addView(view)
        .setCallback((data: { action: string; docs: Array<{ id?: string; name?: string }> }) => {
          if (data.action !== pickerApi.Action.PICKED || !data.docs[0]?.id) return;
          const picked = data.docs[0];
          if (target === 'spreadsheet') {
            setIntegration((prev) => ({ ...prev, spreadsheetId: picked.id ?? '' }));
            setMessage('已選取 Spreadsheet，請確認「工作表名稱」後儲存。');
          } else {
            setIntegration((prev) => ({ ...prev, driveFolderId: picked.id ?? '' }));
            setMessage('已選取 Drive 資料夾，記得按「儲存整合設定」。');
          }
        });

      if (GOOGLE_PICKER_APP_ID) pickerBuilder.setAppId(GOOGLE_PICKER_APP_ID);
      pickerBuilder.build().setVisible(true);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : '開啟 Google Picker 失敗');
    }
  }

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
  const isErrorMessage = /失敗|無法|尚未|錯誤|error|unauthorized/i.test(message);

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Google Integration */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold">Google 整合</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Spreadsheet ID</label>
          <div className="mt-1 flex gap-2">
            <input
              value={integration.spreadsheetId ?? ''}
              onChange={(e) => setIntegration((p) => ({ ...p, spreadsheetId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder="從 Google Sheet URL 複製"
            />
            <button
              type="button"
              onClick={() => browseGoogle('spreadsheet')}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              瀏覽
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">工作表名稱</label>
          <input
            value={integration.sheetName ?? ''}
            onChange={(e) => setIntegration((p) => ({ ...p, sheetName: e.target.value }))}
            list="google-sheet-name-options"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            placeholder={sheetNameLoading ? '正在讀取工作表清單...' : '例：工作表1'}
          />
          <datalist id="google-sheet-name-options">
            {sheetNameOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
          {sheetNameOptions.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              已載入 {sheetNameOptions.length} 個工作表，可直接選取或手動輸入。
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Drive 資料夾 ID（選填）</label>
          <div className="mt-1 flex gap-2">
            <input
              value={integration.driveFolderId ?? ''}
              onChange={(e) => setIntegration((p) => ({ ...p, driveFolderId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none"
              placeholder="收據上傳目標資料夾"
            />
            <button
              type="button"
              onClick={() => browseGoogle('driveFolder')}
              className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              瀏覽
            </button>
          </div>
        </div>
        <button
          onClick={saveIntegration}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          儲存整合設定
        </button>
        {message && (
          <p
            className={`text-sm rounded-lg px-4 py-2 ${
              isErrorMessage
                ? 'text-red-700 bg-red-50'
                : 'text-green-700 bg-green-50'
            }`}
          >
            {message}
          </p>
        )}
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

    </div>
  );
}
