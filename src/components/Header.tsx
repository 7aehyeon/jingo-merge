import React from 'react';
import { School, Database, Settings2, Sparkles, LogIn, LogOut, CheckCircle } from 'lucide-react';

interface HeaderProps {
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  appsScriptUrl: string;
  setAppsScriptUrl: (val: string) => void;
  isSyncing: boolean;
  schoolName: string;
}

export default function Header({
  isAdmin,
  setIsAdmin,
  appsScriptUrl,
  setAppsScriptUrl,
  isSyncing,
  schoolName
}: HeaderProps) {
  const [showUrlInput, setShowUrlInput] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-100 pr-4 pl-4 py-4.5" id="app-header">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Logo / School Name */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl" id="school-logo-id">
            <School className="w-5.5 h-5.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-slate-800 text-lg tracking-tight font-sans">
                {schoolName} 연수 취합 시스템
              </h1>
              <span className="text-[10px] tracking-wide font-mono bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold uppercase">
                v1.2 Live
              </span>
            </div>
            <p className="text-xs text-slate-400">교직원 연수 개설, PDF 자동 이수증 인식 및 스프레드시트 관리</p>
          </div>
        </div>

        {/* Configurations & Modes */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Apps Script Connection Badge (Only visible in Admin mode) */}
          {isAdmin && (
            <div className="relative">
              <button
                onClick={() => setShowUrlInput(!showUrlInput)}
                id="sheet-config-toggle-btn"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  appsScriptUrl
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{appsScriptUrl ? '구글 시트 연동 완료' : '로컬 기기 저장 모드'}</span>
                <Settings2 className="w-3 h-3 ml-0.5" />
              </button>

              {/* Quick Popover for URL Input */}
              {showUrlInput && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl p-4 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <h4 className="text-xs font-semibold text-slate-700 mb-1.5">구글 스프레드시트 연동 API</h4>
                  <p className="text-[11px] text-slate-400 leading-normal mb-3">
                    구글 Apps Script 새 배포에서 획득한 웹앱 URL을 붙여넣으시면, 생성되는 모든 연수 이수 완료 목록들이 실시간으로 개인 시트에 각각 연동됩니다!
                  </p>
                  <div className="space-y-2">
                    <input
                      type="url"
                      id="quick-apps-script-url-input"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={appsScriptUrl}
                      onChange={(e) => {
                        const val = e.target.value;
                        let cleaned = val.trim();
                        // Handle common copy-paste errors where users leave 'script.google' from placeholder
                        if (cleaned.includes('https://') && !cleaned.startsWith('https://')) {
                          cleaned = cleaned.substring(cleaned.indexOf('https://'));
                        } else if (cleaned.includes('http://') && !cleaned.startsWith('http://')) {
                          cleaned = cleaned.substring(cleaned.indexOf('http://'));
                        }
                        setAppsScriptUrl(cleaned);
                      }}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    {appsScriptUrl && (
                      <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium bg-emerald-50 p-1.5 rounded">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>주소 입력됨! 스프레드시트에 자동 연동됩니다.</span>
                      </div>
                    )}
                    <button
                      onClick={() => setShowUrlInput(false)}
                      id="save-quick-url-btn"
                      className="w-full text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 rounded-md transition-all"
                    >
                      설정 닫기
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {isAdmin && <div className="h-4 w-px bg-slate-250 hidden sm:block"></div>}

          {/* Mode Switcher */}
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            id="role-switch-btn"
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              isAdmin
                ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {isAdmin ? (
              <>
                <LogIn className="w-3.5 h-3.5" />
                <span>교직원 제출 페이지로 이동</span>
              </>
            ) : (
              <>
                <Settings2 className="w-3.5 h-3.5" />
                <span>관리자 모드로 전환</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
