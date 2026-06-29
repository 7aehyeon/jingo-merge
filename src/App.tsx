/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  BookOpen,
  Users,
  UserCheck,
  FileSpreadsheet,
  PlusCircle,
  FileDown,
  Upload,
  Calendar,
  Layers,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Info,
  Settings,
  X,
  FileText,
  Printer,
  ChevronRight,
  Database,
  ArrowRight,
  RefreshCw,
  Trash2,
  Lock,
  Edit2,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { EmployeeType, RosterItem, TrainingTopic, Submission } from './types';
import Header from './components/Header';
import AppsScriptGuide from './components/AppsScriptGuide';

// Initial Mock data for a fresh start (will sync to Google Sheets if configured)
const INITIAL_ROSTER: RosterItem[] = [
  // 교원
  { id: '1', name: '김철수', type: '교원', department: '연구기획부' },
  { id: '2', name: '이영희', type: '교원', department: '교무기획부' },
  { id: '3', name: '한진우', type: '교원', department: '과학정보부' },
  { id: '4', name: '박지민', type: '교원', department: '3학년부' },
  { id: '5', name: '최선아', type: '교원', department: '1학년부' },
  // 교육공무직
  { id: '6', name: '정도은', type: '교육공무직', department: '행정실' },
  { id: '7', name: '강동원', type: '교육공무직', department: '급식실' },
  // 일반직
  { id: '8', name: '송민호', type: '일반직', department: '행정실' },
  { id: '9', name: '임윤아', type: '일반직', department: '행정실' },
];

const INITIAL_TOPICS: TrainingTopic[] = [
  {
    id: 'topic-1',
    title: '2026학년도 교원 다문화 교육 이해 연수',
    content: '교원을 대상으로 다문화 학생 지도 역량 강화를 위해 개설된 원격 필수 연수입니다.',
    deadline: '2026-07-15',
    sheetCreated: true,
    createdAt: '2026-06-20',
  },
  {
    id: 'topic-2',
    title: '공공기관 개인정보보호 및 정보보안 연수',
    content: '전 교직원(교원, 교육공무직, 일반직 전체) 대상 법정 의무 보안 취합 연수입니다.',
    deadline: '2026-07-30',
    sheetCreated: true,
    createdAt: '2026-06-21',
  },
  {
    id: 'topic-statutory-combined',
    title: '2026학년도 법정의무연수 꾸러미 과정',
    content: '교원 대상 법정의무연수 통합 꾸러미 과정 (I 과정, II 과정 개별 또는 통합/동시 제출 지원 및 일괄 자동 연동)',
    deadline: '2026-08-31',
    sheetCreated: true,
    createdAt: '2026-06-22',
  }
];

const INITIAL_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-1',
    topicId: 'topic-1',
    name: '김철수',
    type: '교원',
    certNumber: '제 2026-다문화-012호',
    certDate: '2026-06-15',
    hours: 15,
    method: 'pdf',
    fileName: '김철수_다문화연수한마당.pdf',
    submittedAt: '2026-06-21 14:32',
    verified: true
  },
  {
    id: 'sub-2',
    topicId: 'topic-2',
    name: '김철수',
    type: '교원',
    certNumber: '제 2026-정보보안-99호',
    certDate: '2026-06-20',
    hours: 2,
    method: 'direct',
    submittedAt: '2026-06-21 14:35',
    verified: true
  },
  {
    id: 'sub-3',
    topicId: 'topic-2',
    name: '송민호',
    type: '일반직',
    certNumber: '2026-SECURE-005',
    certDate: '2026-06-19',
    hours: 3,
    method: 'pdf',
    fileName: '송민호_보안이수증.pdf',
    submittedAt: '2026-06-21 15:40',
    verified: true
  }
];

// [초중요 - 배포 설정] 깃허브(GitHub Pages)에 정적 페이지로 배포 시, 모든 사용자의 브라우저에서 자동 연동이 되도록 
// 본인의 구글 Apps Script 웹앱 URL(https://script.google.com/macros/s/.../exec) 주소를 아래 빈칸에 직접 붙여넣고 저장하세요.
// 여기에 URL을 적어두면, 사용자가 사이트에 처음 접속할 때 따로 라이브러리 설정을 누르고 연동할 필요 없이 모든 데이터가 이 구글 시트로 들어가게 됩니다!
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwt8BdJvwzYO3LXr1eMldsrlUozc1R4w6g-BH1XLLt4lpMqlStBBc7pTL41WE2H5Iuj/exec";

// 브라우저 쿠키/저장소 차단(시크릿 모드/아이프레임 제한 등) 발생 시 크래시 방지를 위한 안전한 로컬스토리지 래퍼
const inMemoryStorage: Record<string, string> = {};
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Storage getItem blocked for key "${key}":`, e);
      return inMemoryStorage[key] || null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Storage setItem blocked for key "${key}":`, e);
      inMemoryStorage[key] = value;
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Storage removeItem blocked for key "${key}":`, e);
      delete inMemoryStorage[key];
    }
  }
};

export default function App() {
  // State elements
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'topics' | 'roster' | 'my-status' | 'setup-guide'>('my-status');
  
  // Roster, Topics, Submissions management (persists locally & connects to Google Sheets)
  const [roster, setRoster] = useState<RosterItem[]>(() => {
    const saved = safeLocalStorage.getItem('jj_roster');
    return saved ? JSON.parse(saved) : INITIAL_ROSTER;
  });
  
  const [topics, setTopics] = useState<TrainingTopic[]>(() => {
    const saved = safeLocalStorage.getItem('jj_topics');
    let loaded = saved ? JSON.parse(saved) : INITIAL_TOPICS;
    if (!loaded.some((t: any) => t.id === 'topic-statutory-combined')) {
      loaded = [
        ...loaded,
        {
          id: 'topic-statutory-combined',
          title: '2026학년도 법정의무연수 꾸러미 과정',
          content: '교원 대상 법정의무연수 통합 꾸러미 과정 (I 과정, II 과정 개별 또는 통합/동시 제출 지원 및 일괄 자동 연동)',
          deadline: '2026-08-31',
          sheetCreated: true,
          createdAt: '2026-06-22',
        }
      ];
    }
    return loaded;
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    const saved = safeLocalStorage.getItem('jj_submissions');
    return saved ? JSON.parse(saved) : INITIAL_SUBMISSIONS;
  });

  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    // 만약 소스코드 내 DEFAULT_APPS_SCRIPT_URL이 변경되었다면, 이전 로컬스토리지의 구버전 주소를 덮어씌웁니다.
    const lastDefault = safeLocalStorage.getItem('jj_last_default_url');
    if (lastDefault !== DEFAULT_APPS_SCRIPT_URL) {
      safeLocalStorage.setItem('jj_apps_script_url', DEFAULT_APPS_SCRIPT_URL);
      safeLocalStorage.setItem('jj_last_default_url', DEFAULT_APPS_SCRIPT_URL);
      return DEFAULT_APPS_SCRIPT_URL;
    }

    let saved = safeLocalStorage.getItem('jj_apps_script_url');
    if (saved) {
      saved = saved.trim();
      // Fix copy-paste prefixes like "script.googlehttps://"
      if (saved.startsWith('script.googlehttps://')) {
        saved = saved.replace('script.googlehttps://', 'https://');
      }
      if (saved.includes('https://') && !saved.startsWith('https://')) {
        saved = saved.substring(saved.indexOf('https://'));
      } else if (saved.includes('http://') && !saved.startsWith('http://')) {
        saved = saved.substring(saved.indexOf('http://'));
      }
      return saved;
    }
    return DEFAULT_APPS_SCRIPT_URL;
  });

  // UI States
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(() => {
    // 앱스 스크립트 주소가 기본 설정되어 있다면 최초 구글 시트에서 데이터를 당겨오기 전까지 
    // 더미 데이터 노출을 원천 방지하기 위해 전체 화면 로딩을 활성화합니다.
    return !!DEFAULT_APPS_SCRIPT_URL;
  });
  const [isSyncFailed, setIsSyncFailed] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [isInitializingSheets, setIsInitializingSheets] = useState<boolean>(false);
  const [initializeMessage, setInitializeMessage] = useState<string>('');
  const [isPullingData, setIsPullingData] = useState<boolean>(false);
  const [pullMessage, setPullMessage] = useState<string>('');
  
  // Topic creation States
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newDeadline, setNewDeadline] = useState('2026-07-31');
  const [newCreator, setNewCreator] = useState('');
  const [creationMessage, setCreationMessage] = useState('');
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [linkStatutorySubmissions, setLinkStatutorySubmissions] = useState<boolean>(false);

  // Topic editing States
  const [editingTopic, setEditingTopic] = useState<TrainingTopic | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editDeadline, setEditDeadline] = useState('');
  const [editCreator, setEditCreator] = useState('');

  // Roster addition States
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberType, setNewMemberType] = useState<EmployeeType>('교원');
  const [newMemberDept, setNewMemberDept] = useState('');
  const [isCustomType, setIsCustomType] = useState<boolean>(false);
  const [customTypeName, setCustomTypeName] = useState<string>('');

  // CSV Preview & Upload States
  const [csvPreview, setCsvPreview] = useState<{ name: string; type: EmployeeType; department?: string }[]>([]);

  // Admin Login States
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Active view states (Admin topic monitoring)
  const [selectedTopicId, setSelectedTopicId] = useState<string>('topic-2');

  // Format deadline string to YYYY-MM-DD cleanly
  const formatDeadline = (deadlineStr: string) => {
    if (!deadlineStr) return '';
    // If it contains T, split by T
    if (deadlineStr.includes('T')) {
      return deadlineStr.split('T')[0];
    }
    // If it contains a space, split by space
    if (deadlineStr.includes(' ')) {
      return deadlineStr.split(' ')[0];
    }
    return deadlineStr;
  };

  const formatDate = formatDeadline;
  
  // Sorting states for dashboard live table
  const [sortKey, setSortKey] = useState<'name' | 'department' | 'type' | 'status' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);

  // Staff submission form states
  const [selectedStaffTopicId, setSelectedStaffTopicId] = useState<string>('topic-statutory-combined');
  const [searchStaffName, setSearchStaffName] = useState<string>('');
  const [matchedStaff, setMatchedStaff] = useState<RosterItem | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'pdf' | 'direct'>('pdf');
  
  // Submission details
  const [certNumber, setCertNumber] = useState('');
  const [certDate, setCertDate] = useState('');
  const [hours, setHours] = useState<number | string>(15);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState('');
  const [analysisSuccessMsg, setAnalysisSuccessMsg] = useState('');

  // Course I individual PDF states
  const [pdfFileI, setPdfFileI] = useState<File | null>(null);
  const [pdfBase64I, setPdfBase64I] = useState<string>('');
  const [isAnalyzingI, setIsAnalyzingI] = useState(false);
  const [analysisErrorI, setAnalysisErrorI] = useState('');
  const [analysisSuccessMsgI, setAnalysisSuccessMsgI] = useState('');

  // Course II individual PDF states
  const [pdfFileII, setPdfFileII] = useState<File | null>(null);
  const [pdfBase64II, setPdfBase64II] = useState<string>('');
  const [isAnalyzingII, setIsAnalyzingII] = useState(false);
  const [analysisErrorII, setAnalysisErrorII] = useState('');
  const [analysisSuccessMsgII, setAnalysisSuccessMsgII] = useState('');

  const [submissionCompleteMsg, setSubmissionCompleteMsg] = useState('');

  // 법정의무연수 꾸러미 전용 상태 및 개별 세부정보 필드
  const [isStatutorySync, setIsStatutorySync] = useState<boolean>(true); // 기본 연동 활성화
  const [statutoryCourseMode, setStatutoryCourseMode] = useState<'none' | 'I' | 'II' | 'both' | 'combined'>('none');
  const [certNumberI, setCertNumberI] = useState('');
  const [certDateI, setCertDateI] = useState('');
  const [certNumberII, setCertNumberII] = useState('');
  const [certDateII, setCertDateII] = useState('');

  // Popup message modal & Loading overlay state variables
  const [appPopup, setAppPopup] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>('');

  const showAlert = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    let title = '안내';
    if (type === 'success') title = '성공';
    if (type === 'error') title = '오류';
    setAppPopup({ title, message, type });
  };

  // Statutory Detail display helper
  const getStatutoryDetailText = (sub: Submission | undefined) => {
    if (!sub) return { label: '미제출', textClass: 'text-slate-400', badgeClass: 'bg-slate-150 hover:bg-slate-200 text-slate-500' };
    
    if (sub.hours === 25 && !(sub.certNumber && sub.certNumber.includes('/'))) {
      return { label: '통합 과정 제출 (25시간)', textClass: 'text-indigo-600', badgeClass: 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold' };
    }
    
    if (sub.certNumber && sub.certNumber.includes('/')) {
      const parts = sub.certNumber.split('/');
      const numI = parts[0]?.trim() || '';
      const numII = parts[1]?.trim() || '';
      
      const hasI = numI !== '' && numI !== '-';
      const hasII = numII !== '' && numII !== '-';
      
      if (hasI && hasII) {
        return { label: 'I & II 과정 모두 이수 (25시간)', textClass: 'text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold' };
      } else if (hasI) {
        return { label: 'I 과정만 제출 (12시간)', textClass: 'text-sky-600', badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200 font-bold' };
      } else if (hasII) {
        return { label: 'II 과정만 제출 (13시간)', textClass: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200 font-bold' };
      }
    } else {
      if (sub.hours === 25 || sub.hours === 30) {
        return { label: 'I & II 과정 모두 이수 (25시간)', textClass: 'text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold' };
      }
      if (sub.hours === 13) {
        return { label: 'II 과정만 제출 (13시간)', textClass: 'text-amber-600', badgeClass: 'bg-amber-100 text-amber-900 border border-amber-200 font-bold' };
      }
      return { label: 'I 과정만 제출 (12시간)', textClass: 'text-sky-600', badgeClass: 'bg-sky-100 text-sky-800 border border-sky-200 font-bold' };
    }
    return { label: '이수 완료', textClass: 'text-emerald-600', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold' };
  };

  // Synchronized / linked submissions helper
  const getSubmissionsForTopic = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    let subs = submissions.filter(s => s.topicId === topicId);
    if (topic?.linkStatutorySubmissions && topicId !== 'topic-statutory-combined') {
      const statutorySubs = submissions.filter(s => s.topicId === 'topic-statutory-combined');
      statutorySubs.forEach(statSub => {
        if (!subs.some(s => s.name === statSub.name)) {
          subs.push({
            ...statSub,
            id: `linked-${statSub.id}`,
            topicId: topicId // change topicId to the current topic ID to match correctly
          });
        }
      });
    }
    return subs;
  };

  // Load and synchronize existing submission data when topic / matched staff changes
  const [lastLoadedKey, setLastLoadedKey] = useState<string>('');

  useEffect(() => {
    const currentKey = `${matchedStaff?.id || ''}_${selectedStaffTopicId}`;
    if (currentKey === lastLoadedKey) {
      return;
    }
    setLastLoadedKey(currentKey);

    const selectedTopic = topics.find(t => t.id === selectedStaffTopicId);
    if (!selectedTopic) {
      setStatutoryCourseMode('none');
      return;
    }

    const title = selectedTopic.title;
    const isStatutory = selectedTopic.id === 'topic-statutory-combined' || (title.includes('법정의무연수') && title.includes('꾸러미'));

    if (isStatutory) {
      if (statutoryCourseMode === 'none') {
        setStatutoryCourseMode('I');
      }

      const prevSub = matchedStaff 
        ? getSubmissionsForTopic(selectedStaffTopicId).find(s => s.name === matchedStaff.name)
        : null;

      if (prevSub) {
        // Parse existing cert values
        if (prevSub.certNumber.includes('/')) {
          const partsNum = prevSub.certNumber.split('/');
          const part1 = partsNum[0]?.trim() || '';
          const part2 = partsNum[1]?.trim() || '';
          setCertNumberI(part1 === '-' ? '' : part1);
          setCertNumberII(part2 === '-' ? '' : part2);
          setCertNumber('');
        } else {
          if (prevSub.hours === 34) {
            setCertNumber(prevSub.certNumber);
            setStatutoryCourseMode('combined');
            setCertNumberI('');
            setCertNumberII('');
          } else {
            setCertNumberI(prevSub.certNumber.trim());
            setCertNumberII('');
            setCertNumber('');
          }
        }

        if (prevSub.certDate.includes('/')) {
          const partsDt = prevSub.certDate.split('/');
          const part1 = partsDt[0]?.trim() || '';
          const part2 = partsDt[1]?.trim() || '';
          setCertDateI(part1 === '-' ? '' : part1);
          setCertDateII(part2 === '-' ? '' : part2);
          setCertDate('');
        } else {
          if (prevSub.hours === 34) {
            setCertDate(prevSub.certDate);
            setStatutoryCourseMode('combined');
            setCertDateI('');
            setCertDateII('');
          } else {
            setCertDateI(prevSub.certDate);
            setCertDateII('');
            setCertDate('');
          }
        }
        setHours(prevSub.hours || 15);
        setAnalysisSuccessMsg('이전에 제출하신 이수증 정보가 연동되었습니다. 필요한 경우 수정 후 다시 등록을 완료하십시오.');
      } else {
        // No previous submission: RESET all inputs for this staff member!
        setCertNumberI('');
        setCertDateI('');
        setCertNumberII('');
        setCertDateII('');
        setCertNumber('');
        setCertDate('');
        setHours(15);
        setAnalysisSuccessMsg('');
        setPdfFile(null);
        setPdfBase64('');
      }
    } else {
      setStatutoryCourseMode('none');
      setCertNumberI('');
      setCertDateI('');
      setCertNumberII('');
      setCertDateII('');

      const prevSub = matchedStaff
        ? getSubmissionsForTopic(selectedStaffTopicId).find(s => s.name === matchedStaff.name)
        : null;

      if (prevSub) {
        setCertNumber(prevSub.certNumber);
        setCertDate(prevSub.certDate);
        setHours(prevSub.hours || 15);
        if (prevSub.id.startsWith('linked-')) {
          setAnalysisSuccessMsg('🔗 본 과정에 연계된 법정의무연수 꾸러미 이수증 정보가 자동으로 연동·적용되었습니다.');
        } else {
          setAnalysisSuccessMsg('이전에 제출하신 이수증 정보가 연동되었습니다. 필요한 경우 수정 후 다시 등록을 완료하십시오.');
        }
      } else {
        setCertNumber('');
        setCertDate('');
        setHours(15);
        setAnalysisSuccessMsg('');
        setPdfFile(null);
        setPdfBase64('');
      }
    }
  }, [selectedStaffTopicId, topics, matchedStaff, submissions, lastLoadedKey]);

  // Synchronize hours input when statutoryCourseMode changes
  useEffect(() => {
    if (statutoryCourseMode === 'I') {
      setHours(12);
    } else if (statutoryCourseMode === 'II') {
      setHours(13);
    } else if (statutoryCourseMode === 'both') {
      setHours(25);
    } else if (statutoryCourseMode === 'combined') {
      setHours(25);
    }
  }, [statutoryCourseMode]);

  // User-specific lookup state
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [verifiedUserInfo, setVerifiedUserInfo] = useState<RosterItem | null>(null);
  const [userLookedUp, setUserLookedUp] = useState(false);

  // Auto save to safeLocalStorage when updated
  useEffect(() => {
    safeLocalStorage.setItem('jj_roster', JSON.stringify(roster));
  }, [roster]);

  useEffect(() => {
    safeLocalStorage.setItem('jj_topics', JSON.stringify(topics));
  }, [topics]);

  useEffect(() => {
    safeLocalStorage.setItem('jj_submissions', JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    let cleaned = appsScriptUrl.trim();
    if (cleaned.includes('https://') && !cleaned.startsWith('https://')) {
      cleaned = cleaned.substring(cleaned.indexOf('https://'));
      setAppsScriptUrl(cleaned);
    } else if (cleaned.includes('http://') && !cleaned.startsWith('http://')) {
      cleaned = cleaned.substring(cleaned.indexOf('http://'));
      setAppsScriptUrl(cleaned);
    }
    safeLocalStorage.setItem('jj_apps_script_url', cleaned);
  }, [appsScriptUrl]);

  // 최초 접속 및 구글 시트 데이터 실시간 자동 동기화 훅
  useEffect(() => {
    const initSync = async () => {
      if (!appsScriptUrl) {
        setIsInitialLoading(false);
        return;
      }
      
      setIsInitialLoading(true);
      
      const success = await pullDataFromGoogleSheets(true);
      if (!success) {
        setIsSyncFailed(true);
      } else {
        setIsSyncFailed(false);
      }
      setIsInitialLoading(false);
    };
    
    initSync();
  }, [appsScriptUrl]);

  // Set default search staff topic once topics load
  useEffect(() => {
    if (topics.length > 0) {
      const hasStatutory = topics.some(t => t.id === 'topic-statutory-combined');
      setSelectedStaffTopicId(hasStatutory ? 'topic-statutory-combined' : topics[0].id);
    }
  }, [topics]);

  // Set default selected targets to all roster members on load/roster change
  useEffect(() => {
    if (roster.length > 0) {
      setSelectedTargetIds(roster.map(r => r.id));
    }
  }, [roster]);

  // CSV Parsing and Upload Helpers
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        
        // Split lines
        const lines = text.split(/\r?\n/);
        const parsed: { name: string; type: EmployeeType; department?: string }[] = [];
        
        if (lines.length > 0) {
          // Parse CSV header to find corresponding columns
          const headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
          let nameIdx = -1;
          let typeIdx = -1;
          let deptIdx = -1;
          
          headers.forEach((h, index) => {
            if (h.includes('성명') || h.includes('이름') || h.toLowerCase() === 'name') nameIdx = index;
            if (h.includes('직종') || h.includes('구분') || h.toLowerCase() === 'type') typeIdx = index;
            if (h.includes('부서') || h.includes('소속') || h.toLowerCase() === 'department' || h.toLowerCase() === 'dept') deptIdx = index;
          });
          
          // Fallbacks based on typical column order
          if (nameIdx === -1) nameIdx = 0;
          if (typeIdx === -1) typeIdx = 1;
          if (deptIdx === -1) deptIdx = 2;
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const cols = line.split(',').map(c => c.replace(/["']/g, '').trim());
            if (cols.length > nameIdx && cols[nameIdx]) {
              const name = cols[nameIdx];
              const rawType = cols[typeIdx] || '교원';
              let type: EmployeeType = '교원';
              
              if (rawType.includes('공무직') || rawType.includes('교육공무직')) {
                type = '교육공무직';
              } else if (rawType.includes('일반') || rawType.includes('행정') || rawType.includes('일반직')) {
                type = '일반직';
              }
              
              const department = cols[deptIdx] || '미지정';
              parsed.push({ name, type, department });
            }
          }
        }
        
        if (parsed.length > 0) {
          setCsvPreview(parsed);
          e.target.value = ''; // Reset input so same file can be uploaded again
        } else {
          showAlert('CSV 파일에서 교직원 데이터를 분석할 수 없습니다. 컬럼을 성명,직종,소속부서 순으로 맞춰 주십시오.', 'error');
        }
      };
      
      // Reading as EUC-KR by default to prevent Korean character corruption from standard Korean excel exports
      reader.readAsText(file, 'EUC-KR');
    }
  };

  const handleSaveCsvData = (overwrite: boolean) => {
    if (csvPreview.length === 0) return;
    
    const mapped: RosterItem[] = csvPreview.map((item, index) => ({
      id: 'member-' + (Date.now() + index),
      name: item.name,
      type: item.type,
      department: item.department
    }));
    
    const nextRoster = overwrite ? mapped : [...roster, ...mapped];
    setRoster(nextRoster);
    setCsvPreview([]);
    showAlert(`성공적으로 ${mapped.length}명의 교직원이 등록되었습니다.`, 'success');
    
    if (appsScriptUrl) {
      setTimeout(() => {
        syncWithGoogleSheet();
      }, 500);
    }
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginId === 'admin' && loginPassword === 'admin') {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setActiveTab('dashboard');
      setLoginError('');
      setLoginId('');
      setLoginPassword('');
    } else {
      setLoginError('아이디 또는 비밀번호가 일치하지 않습니다.');
    }
  };

  // Trigger Google Sheet synchronization if Web App URL exists
  const syncWithGoogleSheet = async () => {
    if (!appsScriptUrl) {
      setSyncStatus('구글 Apps Script URL이 설정되지 않아 로컬 기기에만 저장되었습니다.');
      return;
    }
    
    setIsSyncing(true);
    setSyncStatus('스프레드시트에 데이터를 전송 중입니다...');
    
    try {
      // 1. Post Roster
      const rosterRes = await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveRoster',
          roster: roster
        })
      });

      setSyncStatus('스프레드시트 원격 업데이트가 정상 요청되었습니다.');
      setTimeout(() => {
        setIsSyncing(false);
        setSyncStatus('');
      }, 2500);

    } catch (e: any) {
      console.error(e);
      setSyncStatus('연동 오류가 발생했습니다. 실시간 연동을 활성화하려면 CORS 허용 설정을 확인하거나 아래 브라우저를 재로그인 해보세요.');
      setIsSyncing(false);
    }
  };

  // Synchronize all local data to Google Sheet
  const handleInitAndPushAllData = async () => {
    if (!appsScriptUrl) {
      showAlert('구글 Apps Script Web App URL을 먼저 연동해 주십시오.', 'error');
      return;
    }
    
    if (!confirm('⚠️ 본 기능은 현재 브라우저에 등록된 모든 교직원 명렬(70여명), 연수 목록(3개), 그리고 기존 제출 이력까지 본인의 구글 스프레드시트에 통째로 동기화(초기 데이터 생성)합니다. 진행하시겠습니까?')) {
      return;
    }

    setIsInitializingSheets(true);
    setInitializeMessage('1/3. 교직원 명렬(70여명)을 구글 스프레드시트에 업로드 중...');
    
    try {
      // 1. Roster
      await fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveRoster',
          roster: roster
        })
      });
      
      // 2. Topics
      setInitializeMessage('2/3. 연수 정보 개설 목록 및 전용 시트들을 생성 중...');
      for (let i = 0; i < topics.length; i++) {
        const topic = topics[i];
        setInitializeMessage(`2/3. 연수 생성 중 (${i + 1}/${topics.length}) - ${topic.title}`);
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createTopic',
            topic: topic
          })
        });
      }

      // 3. Submissions
      setInitializeMessage('3/3. 기존 샘플 제출 기록들을 시트에 매칭하여 전송 중...');
      for (let i = 0; i < submissions.length; i++) {
        const sub = submissions[i];
        const topic = topics.find(t => t.id === sub.topicId);
        const topicTitle = topic ? topic.title : '기타 연수';
        setInitializeMessage(`3/3. 제출 이력 등록 중 (${i + 1}/${submissions.length}) - ${sub.name}`);
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submitCertificate',
            submission: sub,
            topicTitle: topicTitle
          })
        });
      }

      setInitializeMessage('🎉 동기화 대성공! 교직원 명단 및 연수, 제출 기록까지 구글 시트에 완벽히 복원/생성되었습니다.');
      showAlert('구글 시트 일괄 초기화 동기화에 성공했습니다!', 'success');
      setTimeout(() => {
        setIsInitializingSheets(false);
        setInitializeMessage('');
      }, 4000);
    } catch (err: any) {
      console.error(err);
      showAlert(`동기화 중 오류가 발생했습니다: ${err.message}`, 'error');
      setIsInitializingSheets(false);
      setInitializeMessage('');
    }
  };

  // Reusable helper to fetch latest data from Google Sheets
  const pullDataFromGoogleSheets = async (silent = false) => {
    if (!appsScriptUrl) {
      if (!silent) showAlert('구글 Apps Script Web App URL을 먼저 연동해 주십시오.', 'error');
      return false;
    }

    if (!silent) {
      setIsPullingData(true);
      setPullMessage('구글 시트로부터 실시간 데이터베이스를 통합 동기화하는 중...');
    }

    try {
      // 병렬 비동기 호출(Promise.all)을 통한 획기적인 로딩 속도 향상
      const [rosterRes, topicsRes, subsRes] = await Promise.all([
        fetch(`${appsScriptUrl}?action=getRoster`),
        fetch(`${appsScriptUrl}?action=getTopics`),
        fetch(`${appsScriptUrl}?action=getSubmissions`)
      ]);

      const [rosterJson, topicsJson, subsJson] = await Promise.all([
        rosterRes.json(),
        topicsRes.json(),
        subsRes.json()
      ]);

      let updated = false;

      if (rosterJson.success && rosterJson.data && rosterJson.data.length > 0) {
        setRoster(rosterJson.data);
        safeLocalStorage.setItem('jj_roster', JSON.stringify(rosterJson.data));
        updated = true;
      }
      if (topicsJson.success && topicsJson.data && topicsJson.data.length > 0) {
        setTopics(topicsJson.data);
        safeLocalStorage.setItem('jj_topics', JSON.stringify(topicsJson.data));
        updated = true;
      }
      if (subsJson.success && subsJson.data) {
        setSubmissions(subsJson.data);
        safeLocalStorage.setItem('jj_submissions', JSON.stringify(subsJson.data));
        updated = true;
      }

      if (!silent) {
        setPullMessage('🎉 다운로드 완료! 구글 시트의 최신 교직원 데이터와 100% 동기화되었습니다.');
        showAlert('구글 시트의 최신 데이터를 성공적으로 동기화했습니다!', 'success');
        setTimeout(() => {
          setIsPullingData(false);
          setPullMessage('');
        }, 3000);
      }

      return updated;
    } catch (err: any) {
      console.error('Error in pullDataFromGoogleSheets:', err);
      if (!silent) {
        showAlert(`데이터를 불러오는 중 오류가 발생했습니다. 구글 앱스 스크립트 배포 시 '액세스 권한이 있는 사용자'를 '모든 사람(Anyone)'으로 설정했는지 다시 한 번 확인해 주세요. 오류: ${err.message}`, 'error');
        setIsPullingData(false);
        setPullMessage('');
      }
      return false;
    }
  };

  // Retrieve latest database from Google Spreadsheet
  const handlePullAllData = async () => {
    if (!appsScriptUrl) {
      showAlert('구글 Apps Script Web App URL을 먼저 연동해 주십시오.', 'error');
      return;
    }
    
    if (!confirm('⚠️ 본 기능은 구글 스프레드시트의 최신 데이터를 가져와 현재 브라우저의 로컬 데이터를 완전히 덮어씁니다. (스프레드시트에서 직접 한글 이름이나 부서, 연수를 수정했을 때 유용합니다) 수정사항을 덮어쓰시겠습니까?')) {
      return;
    }

    await pullDataFromGoogleSheets(false);
  };

  // Create new Topic (Opening training item)
  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      showAlert('연수명과 연수 요약내용을 입력해주세요.', 'error');
      return;
    }

    const newTopic: TrainingTopic = {
      id: 'topic-' + Date.now(),
      title: newTitle,
      content: newContent,
      deadline: newDeadline,
      sheetCreated: true,
      createdAt: new Date().toISOString().substring(0, 10),
      targets: selectedTargetIds.length > 0 ? selectedTargetIds : roster.map(r => r.id),
      linkStatutorySubmissions: linkStatutorySubmissions,
      creator: newCreator.trim() || undefined,
    };

    // 법정의무연수 꾸러미 연동 설정이 되어 있다면, 기존에 제출된 꾸러미 이수 데이터들을 새 토픽용으로 연동(복제)한다.
    let extraSubsToCreate: Submission[] = [];
    if (linkStatutorySubmissions) {
      const statutorySubs = submissions.filter(s => s.topicId === 'topic-statutory-combined');
      statutorySubs.forEach(statSub => {
        extraSubsToCreate.push({
          ...statSub,
          id: `linked-${statSub.id}-${newTopic.id}-${Date.now()}`,
          topicId: newTopic.id
        });
      });
    }

    const updatedTopics = [...topics, newTopic];
    const updatedSubmissions = [...submissions, ...extraSubsToCreate];

    setTopics(updatedTopics);
    setSubmissions(updatedSubmissions);
    setNewTitle('');
    setNewContent('');
    setNewCreator('');
    setLinkStatutorySubmissions(false); // Reset checkbox state
    setCreationMessage(`🎉 신규 연수 '${newTopic.title}'이 성공적으로 목록에 추가되었습니다.`);
    
    // Auto sync if Sheets connected
    if (appsScriptUrl) {
      setIsSyncing(true);
      try {
        // 1. 신규 토픽 시트 생성
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'createTopic',
            topic: newTopic
          })
        });

        // 2. 만약 기존의 복제 연동할 이수 데이터가 있다면, 신규 시트에도 POST하여 저장한다.
        if (extraSubsToCreate.length > 0) {
          for (const extSub of extraSubsToCreate) {
            await fetch(appsScriptUrl, {
              method: 'POST',
              mode: 'no-cors',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'submitCertificate',
                submission: extSub,
                topicTitle: newTopic.title
              })
            });
          }
        }

        setCreationMessage(`🎉 신규 연수 개설 및 스프레드시트에 전용 시트('${newTopic.title.substring(0, 15)}')가 동시 자동 추가되었습니다!${extraSubsToCreate.length > 0 ? ` (기존 꾸러미 이수 내역 ${extraSubsToCreate.length}건 동시 자동 연동 완료)` : ''}`);
      } catch (err) {
        console.error("Failed to sync new topic online:", err);
      }
      setIsSyncing(false);
    }

    setSelectedTopicId(newTopic.id);
    // Reset selectedTargetIds to everyone
    setSelectedTargetIds(roster.map(r => r.id));
    setTimeout(() => setCreationMessage(''), 5000);
  };

  const handleEditTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopic) return;
    if (!editTitle.trim() || !editContent.trim()) {
      showAlert('연수 과정명과 내용을 입력해주세요.', 'error');
      return;
    }

    const updatedTopic: TrainingTopic = {
      ...editingTopic,
      title: editTitle.trim(),
      content: editContent.trim(),
      deadline: editDeadline,
      creator: editCreator.trim() || undefined,
    };

    // Update locally
    const updatedTopics = topics.map(t => t.id === editingTopic.id ? updatedTopic : t);
    setTopics(updatedTopics);
    setEditingTopic(null);
    showAlert(`🎉 연수 '${updatedTopic.title}' 정보가 성공적으로 수정되었습니다.`, 'success');

    // Apps Script Sync
    if (appsScriptUrl) {
      setIsSyncing(true);
      try {
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'editTopic',
            topic: updatedTopic
          })
        });
      } catch (err) {
        console.error("Failed to sync edited topic online:", err);
      }
      setIsSyncing(false);
    }
  };

  // Register New Member to Roster
  const handleAddRosterMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      showAlert('성명을 입력해 주세요.', 'error');
      return;
    }

    const finalType = isCustomType ? customTypeName.trim() : newMemberType;
    if (!finalType) {
      showAlert('직종 구분을 선택하거나 입력해 주세요.', 'error');
      return;
    }

    const newItem: RosterItem = {
      id: 'member-' + Date.now(),
      name: newMemberName.trim(),
      type: finalType,
      department: newMemberDept.trim() || undefined
    };

    setRoster([...roster, newItem]);
    setNewMemberName('');
    setNewMemberDept('');
    setIsCustomType(false);
    setCustomTypeName('');
    
    if (appsScriptUrl) {
      syncWithGoogleSheet();
    }
  };

  // Remove member from Roster
  const handleRemoveMember = (id: string) => {
    if (confirm('해당 교직원을 명렬에서 삭제하시겠습니까? 데이터 정합성을 위해 삭제 후 명렬이 최신화됩니다.')) {
      setRoster(roster.filter(m => m.id !== id));
    }
  };

  // Look up staff member inside database
  const handleStaffLookup = () => {
    const term = searchStaffName.trim();
    if (!term) {
      setMatchedStaff(null);
      setAnalysisError('⚠️ 이름을 정확히 기재해 주십시오.');
      return;
    }
    const found = roster.find(r => r.name === term);
    if (found) {
      setMatchedStaff(found);
      setAnalysisError('');
      // Pre-populate status tracking on the right immediately
      setVerifiedUserInfo(found);
      setUserSearchTerm(found.name);
      setUserLookedUp(true);
      
      // Pre-select the first valid topic for this staff member
      const targets = topics.filter(t => !t.targets || t.targets.includes(found.id));
      if (targets.length > 0) {
        setSelectedStaffTopicId(targets[0].id);
      }
    } else {
      setMatchedStaff(null);
      setAnalysisError('⚠️ 입력하신 이름이 등록된 교직원 명렬에 존재하지 않습니다. 먼저 관리자가 명렬에 추가해야 합니다.');
      setVerifiedUserInfo(null);
      setUserLookedUp(false);
    }
  };

  // Standard File Base64 Convertor
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        setAnalysisError('이수증은 반드시 PDF 파일 형식이어야 합니다.');
        return;
      }
      setPdfFile(file);
      setAnalysisError('');
      setAnalysisSuccessMsg('');

      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        setPdfBase64(base64);
        
        // Auto trigger parse
        await autoParsePdfViaGemini(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Automatic extraction using server-side Gemini 3.5 API
  const autoParsePdfViaGemini = async (base64String: string, originalName: string) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setAnalysisSuccessMsg('Gemini AI가 이수증 PDF에서 이수번호, 이수일자, 시간을 자동 판독하고 있습니다...');

    try {
      let result;
      if (appsScriptUrl) {
        // Apps Script Web App URL이 있을 경우, 스프레드시트 백엔드의 제미나이 AI 실행 (보안 안정적)
        const res = await fetch(appsScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'parsePdf',
            fileBase64: base64String,
            fileName: originalName
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          result = json;
        } else {
          throw new Error(json.error || 'Apps Script AI 실행에 실패했습니다. Apps Script [프로젝트 설정 ⚙️]에서 GEMINI_API_KEY가 올바르게 기밀 키(Script Property)로 추가되었는지 확인해 주세요.');
        }
      } else {
        // Local 개발 서버 동작 백업
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64String,
            fileName: originalName
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          result = json;
        } else {
          throw new Error(json.error || '로컬 AI 분석 처리 중 장애가 발생했습니다.');
        }
      }

      const data = result.data;
      if (data.certNumber) setCertNumber(data.certNumber);
      if (data.certDate) setCertDate(data.certDate);
      if (data.hours) setHours(Number(data.hours));
      
      let confirmText = `[판독 성공] `;
      if (data.userName && data.userName !== searchStaffName.trim()) {
        confirmText += `제출인은 [${searchStaffName}]님이나, 이수증 상 성명은 [${data.userName}]로 판독되었습니다. 문서가 일치하는지 확인해 주세요.`;
      } else {
        confirmText += `이수번호: ${data.certNumber || '미정'}, 수료일자: ${data.certDate || '미정'}가 자동 완성되었습니다.`;
      }
      setAnalysisSuccessMsg(confirmText);
    } catch (err: any) {
      console.error(err);
      setAnalysisError(`⚠️ AI 자동 분석에 실패했습니다 (${err.message}). 수동으로 이수 번호와 날짜를 기재해주세요.`);
      setAnalysisSuccessMsg('');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Process I file change handler
  const handleFileChangeI = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        showAlert('이수증은 반드시 PDF 파일 형식이어야 합니다.', 'error');
        return;
      }
      setPdfFileI(file);
      setAnalysisErrorI('');
      setAnalysisSuccessMsgI('');

      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        setPdfBase64I(base64);
        await autoParsePdfViaGeminiI(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process I automatic AI extractor
  const autoParsePdfViaGeminiI = async (base64String: string, originalName: string) => {
    setIsAnalyzingI(true);
    setAnalysisErrorI('');
    setAnalysisSuccessMsgI('Gemini AI가 과정 I 이수증 PDF에서 이수번호, 이수일자를 자동 판독하고 있습니다...');

    try {
      let result;
      if (appsScriptUrl) {
        const res = await fetch(appsScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'parsePdf',
            fileBase64: base64String,
            fileName: originalName
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          result = json;
        } else {
          throw new Error(json.error || 'Apps Script AI 실행에 실패했습니다.');
        }
      } else {
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64String,
            fileName: originalName
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          result = json;
        } else {
          throw new Error(json.error || '로컬 AI 분석 중 장애가 발생했습니다.');
        }
      }

      const data = result.data;
      if (data.certNumber) setCertNumberI(data.certNumber);
      if (data.certDate) setCertDateI(data.certDate);
      
      let confirmText = `[과정 I 판독 성공] `;
      if (data.userName && data.userName !== searchStaffName.trim()) {
        confirmText += `제출인은 [${searchStaffName}]님이나 문서상 성명은 [${data.userName}]로 판독되었습니다.`;
      } else {
        confirmText += `이수번호: ${data.certNumber || '미정'}, 수료일자: ${data.certDate || '미정'} 자동 입력 완료.`;
      }
      setAnalysisSuccessMsgI(confirmText);
    } catch (err: any) {
      console.error(err);
      setAnalysisErrorI(`⚠️ 과정 I AI 자동 분석에 실패했습니다 (${err.message}). 수동 기재를 진행해주세요.`);
      setAnalysisSuccessMsgI('');
    } finally {
      setIsAnalyzingI(false);
    }
  };

  // Process II file change handler
  const handleFileChangeII = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type !== 'application/pdf') {
        showAlert('이수증은 반드시 PDF 파일 형식이어야 합니다.', 'error');
        return;
      }
      setPdfFileII(file);
      setAnalysisErrorII('');
      setAnalysisSuccessMsgII('');

      const reader = new FileReader();
      reader.onload = async (readerEvent) => {
        const base64 = readerEvent.target?.result as string;
        setPdfBase64II(base64);
        await autoParsePdfViaGeminiII(base64, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Process II automatic AI extractor
  const autoParsePdfViaGeminiII = async (base64String: string, originalName: string) => {
    setIsAnalyzingII(true);
    setAnalysisErrorII('');
    setAnalysisSuccessMsgII('Gemini AI가 과정 II 이수증 PDF에서 이수번호, 이수일자를 자동 판독하고 있습니다...');

    try {
      let result;
      if (appsScriptUrl) {
        const res = await fetch(appsScriptUrl, {
          method: 'POST',
          body: JSON.stringify({
            action: 'parsePdf',
            fileBase64: base64String,
            fileName: originalName
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          result = json;
        } else {
          throw new Error(json.error || 'Apps Script AI 실행에 실패했습니다.');
        }
      } else {
        const res = await fetch('/api/parse-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64String,
            fileName: originalName
          })
        });
        const json = await res.json();
        if (json.success && json.data) {
          result = json;
        } else {
          throw new Error(json.error || '로컬 AI 분석 중 장애가 발생했습니다.');
        }
      }

      const data = result.data;
      if (data.certNumber) setCertNumberII(data.certNumber);
      if (data.certDate) setCertDateII(data.certDate);
      
      let confirmText = `[과정 II 판독 성공] `;
      if (data.userName && data.userName !== searchStaffName.trim()) {
        confirmText += `제출인은 [${searchStaffName}]님이나 문서상 성명은 [${data.userName}]로 판독되었습니다.`;
      } else {
        confirmText += `이수번호: ${data.certNumber || '미정'}, 수료일자: ${data.certDate || '미정'} 자동 입력 완료.`;
      }
      setAnalysisSuccessMsgII(confirmText);
    } catch (err: any) {
      console.error(err);
      setAnalysisErrorII(`⚠️ 과정 II AI 자동 분석에 실패했습니다 (${err.message}). 수동 기재를 진행해주세요.`);
      setAnalysisSuccessMsgII('');
    } finally {
      setIsAnalyzingII(false);
    }
  };

  // 법정의무연수 꾸러미 상호 실시간 자동 연동 함수 (I, II ↔ 통합)
  const syncStatutorySubmissions = (currentSubmissions: Submission[], activeSub: Submission): { updatedList: Submission[]; extraProcessed: { sub: Submission; topicTitle: string }[] } => {
    const extraProcessed: { sub: Submission; topicTitle: string }[] = [];
    let updatedList = [...currentSubmissions];

    // 만약 제출한 토픽이 '법정의무연수 꾸러미' (topic-statutory-combined)인 경우
    if (activeSub.topicId === 'topic-statutory-combined') {
      // linkStatutorySubmissions가 true이면서 꾸러미가 아닌 다른 모든 연수를 찾음
      const linkedTopics = topics.filter(t => t.linkStatutorySubmissions && t.id !== 'topic-statutory-combined');
      
      linkedTopics.forEach(topic => {
        // 이 개별 연수에 이전에 해당 교직원의 연동 또는 개별 이수 기록이 있었다면 일단 필터링하여 덮어쓰기 처리
        updatedList = updatedList.filter(s => !(s.topicId === topic.id && s.name === activeSub.name));
        
        let linkedDate = activeSub.certDate;
        let linkedCertNum = activeSub.certNumber;
        let linkedHours: string | number = activeSub.hours;

        // 대상 연수명의 타이틀을 분석하여 I과정 또는 II과정에 맞춤 연동
        const isI = topic.title.includes('I') || topic.title.includes('1') || topic.title.toLowerCase().includes('one');
        const isII = topic.title.includes('II') || topic.title.includes('2') || topic.title.toLowerCase().includes('two');

        if (activeSub.certDate.includes('/')) {
          const dates = activeSub.certDate.split('/');
          const datePart1 = dates[0]?.trim() || '';
          const datePart2 = dates[1]?.trim() || '';

          const certNums = activeSub.certNumber.includes('/') ? activeSub.certNumber.split('/') : [activeSub.certNumber];
          const numPart1 = certNums[0]?.trim() || '';
          const numPart2 = certNums[1]?.trim() || (certNums[0]?.trim() || '');

          if (isI) {
            linkedDate = datePart1;
            linkedCertNum = numPart1;
          } else if (isII) {
            linkedDate = datePart2;
            linkedCertNum = numPart2;
          }
        } else {
          // 슬래시가 없는 단일 제출 건인 경우에도 정상 바인딩
          linkedDate = activeSub.certDate.trim();
          linkedCertNum = activeSub.certNumber.trim();
        }

        // 혹시 공백이나 하이픈('-')으로 채워진 빈 값인 경우 비우기 처리
        if (linkedDate === '-') linkedDate = '';
        if (linkedCertNum === '-') linkedCertNum = '';

        // "법정연수꾸러미를 연동 시킬때 이수 시간이 연-월-일로만 표기되어서 연동되면 좋겠어"에 따라,
        // 연동되는 개별 연수의 이수시간(hours) 컬럼에 이수일자(연-월-일)를 기입해 줍니다.
        linkedHours = linkedDate;

        const linkedSub: Submission = {
          ...activeSub,
          id: `linked-${activeSub.id}-${topic.id}-${Date.now()}`,
          topicId: topic.id,
          certDate: linkedDate,
          certNumber: linkedCertNum,
          hours: linkedHours
        };
        
        updatedList.push(linkedSub);
        extraProcessed.push({
          sub: linkedSub,
          topicTitle: topic.title
        });
      });
    }

    return { updatedList, extraProcessed };
  };

  // Submit complete Training Certificate (교직원 연수 신청/이수증 업로드 완료)
  const submitCertificate = async () => {
    if (!matchedStaff) {
      showAlert('본인의 교직원 인증(이름 확인)을 먼저 수행해 주세요.', 'error');
      return;
    }
    if (!selectedStaffTopicId) {
      showAlert('이수증을 접수할 연수 과정을 선택해 주세요.', 'error');
      return;
    }

    // Validation
    if (statutoryCourseMode === 'I') {
      if (!certNumberI.trim() || !certDateI.trim()) {
        showAlert('과정 I의 이수번호 및 이수일자를 정확히 입력해 주세요.', 'error');
        return;
      }
    } else if (statutoryCourseMode === 'II') {
      if (!certNumberII.trim() || !certDateII.trim()) {
        showAlert('과정 II의 이수번호 및 이수일자를 정확히 입력해 주세요.', 'error');
        return;
      }
    } else if (statutoryCourseMode === 'both') {
      if (!certNumberI.trim() || !certDateI.trim() || !certNumberII.trim() || !certDateII.trim()) {
        showAlert('과정 I과 과정 II의 이수번호 및 이수일자를 모두 정확히 입력해 주세요.', 'error');
        return;
      }
    } else {
      if (!certNumber.trim() || !certDate.trim()) {
        showAlert('이수번호와 이수일자를 정확히 입력해 주세요.', 'error');
        return;
      }
    }

    let targetTopicId = selectedStaffTopicId;
    let finalCertNumber = certNumber.trim();
    let finalCertDate = certDate;
    let finalHours = hours;

    const selectedTopic = topics.find(t => t.id === targetTopicId);
    if (!selectedTopic) return;

    const isStatutory = selectedTopic.id === 'topic-statutory-combined' || (selectedTopic.title.includes('법정의무연수') && selectedTopic.title.includes('꾸러미'));

    if (isStatutory) {
      const prevSub = submissions.find(s => s.topicId === targetTopicId && s.name === matchedStaff.name);
      let existingI_num = '';
      let existingI_date = '';
      let existingII_num = '';
      let existingII_date = '';

      if (prevSub) {
        if (prevSub.certNumber.includes('/')) {
          const partsNum = prevSub.certNumber.split('/');
          existingI_num = partsNum[0]?.trim() || '';
          existingII_num = partsNum[1]?.trim() || '';
        } else {
          existingI_num = prevSub.certNumber;
        }

        if (prevSub.certDate.includes('/')) {
          const partsDt = prevSub.certDate.split('/');
          existingI_date = partsDt[0]?.trim() || '';
          existingII_date = partsDt[1]?.trim() || '';
        } else {
          existingI_date = prevSub.certDate;
        }
      }

      if (statutoryCourseMode === 'I') {
        const numI = certNumberI.trim();
        const dateI = certDateI;
        const numII = existingII_num && existingII_num !== '-' ? existingII_num : '-';
        const dateII = existingII_date && existingII_date !== '-' ? existingII_date : '-';
        finalCertNumber = `${numI} / ${numII}`;
        finalCertDate = `${dateI} / ${dateII}`;
        finalHours = (numII !== '-') ? 25 : 12;
      } else if (statutoryCourseMode === 'II') {
        const numI = existingI_num && existingI_num !== '-' ? existingI_num : '-';
        const dateI = existingI_date && existingI_date !== '-' ? existingI_date : '-';
        const numII = certNumberII.trim();
        const dateII = certDateII;
        finalCertNumber = `${numI} / ${numII}`;
        finalCertDate = `${dateI} / ${dateII}`;
        finalHours = (numI !== '-') ? 25 : 13;
      } else if (statutoryCourseMode === 'both') {
        finalCertNumber = `${certNumberI.trim()} / ${certNumberII.trim()}`;
        finalCertDate = `${certDateI} / ${certDateII}`;
        finalHours = 25;
      } else if (statutoryCourseMode === 'combined') {
        finalCertNumber = certNumber.trim();
        finalCertDate = certDate;
        finalHours = 25;
      }
    }

    const newSub: Submission = {
      id: 'sub-' + Date.now(),
      topicId: targetTopicId,
      name: matchedStaff.name,
      type: matchedStaff.type,
      certNumber: finalCertNumber,
      certDate: finalCertDate,
      hours: finalHours || 0,
      method: uploadMethod,
      fileName: uploadMethod === 'pdf' ? (
        statutoryCourseMode === 'both'
          ? `${pdfFileI?.name || 'I_cert.pdf'} / ${pdfFileII?.name || 'II_cert.pdf'}`
          : statutoryCourseMode === 'I'
            ? (pdfFileI?.name || 'I_cert.pdf')
            : statutoryCourseMode === 'II'
              ? (pdfFileII?.name || 'II_cert.pdf')
              : (pdfFile?.name || 'uploaded_cert.pdf')
      ) : undefined,
      submittedAt: new Date().toLocaleString('ko-KR', { hour12: false }).substring(0, 16),
      verified: true
    };

    // Remove old identical submission by student for the same topic
    const filteredSubmissions = submissions.filter(
      s => !(s.topicId === targetTopicId && s.name === matchedStaff.name)
    );

    // Apply statutory multi-update and synchronization
    const { updatedList: fullySyncedSubmissions, extraProcessed } = syncStatutorySubmissions(
      [...filteredSubmissions, newSub],
      newSub
    );

    setSubmissions(fullySyncedSubmissions);
    setSubmissionCompleteMsg(`🎉 [${matchedStaff.name}]님의 [${selectedTopic.title}] 이수증 제출이 완료되었습니다.`);
    showAlert(`🎉 [${matchedStaff.name}]님의 [${selectedTopic.title}] 이수증 제출이 성공적으로 완료되었습니다!`, 'success');

    // Clear Form inputs
    setCertNumber('');
    setCertDate('');
    setCertNumberI('');
    setCertDateI('');
    setCertNumberII('');
    setCertDateII('');
    setHours(15);
    setPdfFile(null);
    setPdfBase64('');
    setPdfFileI(null);
    setPdfBase64I('');
    setPdfFileII(null);
    setPdfBase64II('');
    setSearchStaffName('');
    setMatchedStaff(null);
    setAnalysisSuccessMsg('');
    setAnalysisError('');
    setAnalysisSuccessMsgI('');
    setAnalysisErrorI('');
    setAnalysisSuccessMsgII('');
    setAnalysisErrorII('');

    // Trigger POST payload into Google spreadsheet Apps Script API for all updated/linked records
    if (appsScriptUrl) {
      setIsSyncing(true);
      try {
        // Post main submission
        await fetch(appsScriptUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'submitCertificate',
            submission: newSub,
            topicTitle: selectedTopic.title
          })
        });

        // Post extra synchronized submissions (like individual course parts or unified)
        for (const item of extraProcessed) {
          await fetch(appsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'submitCertificate',
              submission: item.sub,
              topicTitle: item.topicTitle
            })
          });
        }
      } catch (e) {
        console.error('Remote sheets submit error:', e);
      }
      setIsSyncing(false);
    }

    setTimeout(() => {
      setSubmissionCompleteMsg('');
    }, 6000);
  };

  // User checking personal stats & status
  const lookupMySubmissions = () => {
    if (!userSearchTerm.trim()) {
      showAlert('성명을 정확하게 입력하세요.', 'error');
      return;
    }
    const validated = roster.find(r => r.name === userSearchTerm.trim());
    if (validated) {
      setVerifiedUserInfo(validated);
    } else {
      setVerifiedUserInfo(null);
    }
    setUserLookedUp(true);
  };

  // Download CSV sample template for uploading rosters
  const downloadCsvTemplate = () => {
    let csvContent = "\uFEFF"; // Unicode BOM for excel Korean language support
    csvContent += "성명,직종,소속 및 부서\r\n";
    csvContent += "홍길동,교원,1학년부\r\n";
    csvContent += "신사임당,교육공무직,교무실\r\n";
    csvContent += "이순신,일반직,행정실\r\n";

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `진주고_교직원_명렬_기본양식.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // CSV table exporter (with BOM for perfect Microsoft Excel Korean encoding support)
  const downloadCsvExport = (topic: TrainingTopic) => {
    const subsForTopic = getSubmissionsForTopic(topic.id);
    
    // Excel requires specific Korean encoding formats, matching matching table headers.
    let csvContent = "\uFEFF"; // Unicode BOM for excel
    csvContent += "순번,교직원구분,소속 및 부서,성명,이수증 제출상태,이수번호,이수일자,이수시간,제출유형,제출일시\r\n";

    roster.forEach((member, index) => {
      const sub = subsForTopic.find(s => s.name === member.name);
      const status = sub ? "이수 완료" : "미제출";
      const certNo = sub ? `"${sub.certNumber}"` : "-";
      const certD = sub ? sub.certDate : "-";
      const hourVal = sub ? (typeof sub.hours === 'string' && sub.hours.includes('-') ? sub.hours : `${sub.hours}시간`) : "-";
      const typeMethod = sub ? (sub.method === 'pdf' ? "PDF자동추출" : "직접 등록") : "-";
      const timeStr = sub ? sub.submittedAt : "-";

      csvContent += `${index + 1},${member.type},${member.department || '미지정'},${member.name},${status},${certNo},${certD},${hourVal},${typeMethod},${timeStr}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${topic.title}_이수증_취합현황_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Global aggregate stats
  const activeTopic = topics.find(t => t.id === selectedTopicId) || topics[0];
  const targetsForActiveTopic = activeTopic
    ? roster.filter(r => !activeTopic.targets || activeTopic.targets.includes(r.id))
    : roster;
  const totalRosterCount = roster.length;
  const activeTargetCount = targetsForActiveTopic.length;
  const subsForActiveTopic = activeTopic ? getSubmissionsForTopic(activeTopic.id) : [];
  const activeSubCount = subsForActiveTopic.length;
  const activeSubmissionRate = activeTargetCount > 0 ? Math.round((activeSubCount / activeTargetCount) * 100) : 0;

  // Sorted targets list for dashboard live table
  const sortedTargets = useMemo(() => {
    if (!sortKey || !sortOrder) {
      return targetsForActiveTopic;
    }
    return [...targetsForActiveTopic].sort((a, b) => {
      let valA = '';
      let valB = '';
      
      if (sortKey === 'name') {
        valA = a.name;
        valB = b.name;
      } else if (sortKey === 'department') {
        valA = a.department || '';
        valB = b.department || '';
      } else if (sortKey === 'type') {
        valA = a.type;
        valB = b.type;
      } else if (sortKey === 'status') {
        const subA = subsForActiveTopic.some(s => s.name === a.name);
        const subB = subsForActiveTopic.some(s => s.name === b.name);
        if (subA === subB) {
          // If both have same submission status, sub-sort by name
          return a.name.localeCompare(b.name, 'ko');
        }
        return sortOrder === 'asc' 
          ? (subA ? 1 : -1)
          : (subB ? 1 : -1);
      }

      // Standard string comparison for name, department, type
      return sortOrder === 'asc' 
        ? valA.localeCompare(valB, 'ko') 
        : valB.localeCompare(valA, 'ko');
    });
  }, [targetsForActiveTopic, sortKey, sortOrder, subsForActiveTopic]);

  const handleHeaderClick = (key: 'name' | 'department' | 'type' | 'status') => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else if (sortOrder === 'desc') {
        setSortKey(null);
        setSortOrder(null);
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (key: 'name' | 'department' | 'type' | 'status') => {
    if (sortKey !== key) {
      return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />;
    }
    if (sortOrder === 'asc') {
      return <ChevronUp className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
    }
    return <ChevronDown className="w-3.5 h-3.5 text-indigo-600 shrink-0" />;
  };

  // Types break down
  const teachers = roster.filter(r => r.type === '교원');
  const unionWorkers = roster.filter(r => r.type === '교육공무직');
  const generals = roster.filter(r => r.type === '일반직');
  const othersCount = roster.length - teachers.length - unionWorkers.length - generals.length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="app-root-pane">
      {/* 전역 안내 팝업 모달 */}
      {appPopup && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-55 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="flex flex-col items-center text-center space-y-4">
              {appPopup.type === 'success' ? (
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-7 h-7" />
                </div>
              ) : appPopup.type === 'error' ? (
                <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                  <Info className="w-7 h-7" />
                </div>
              )}
              
              <div className="space-y-1.5 w-full">
                <h4 className="text-sm font-bold text-slate-900">{appPopup.title}</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-semibold whitespace-pre-line break-keep px-1">{appPopup.message}</p>
              </div>
              
              <button
                onClick={() => setAppPopup(null)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 실시간 백그라운드 로딩 상태 표시 오버레이 */}
      {(isSyncing || isAnalyzing || loadingMessage) && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[9990] flex items-center justify-center p-4 transition-all animate-in fade-in duration-150">
          <div className="bg-white border border-slate-100/80 rounded-2xl p-6 shadow-2xl flex flex-col items-center justify-center text-center space-y-4 max-w-xs animate-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              <div className="absolute w-5 h-5 bg-indigo-50 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-slate-800">연수 데이터 처리 중</p>
              <p className="text-[10px] text-slate-400 font-bold leading-normal break-keep">
                {isAnalyzing ? 'Gemini AI가 이수증 이수 번호, 일자, 이수 시간을 정밀하게 자동 분석 중입니다...' : (loadingMessage || '구글 스프레드시트 실시간 동기화 및 원격 연동 작업을 수행 중입니다. 잠시만 기다려 주십시오.')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 최초 접속 시 스프레드시트 데이터 연동 오버레이 */}
      {isInitialLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 transition-all animate-in fade-in duration-150">
          <div className="bg-white border border-slate-100/80 rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center text-center space-y-5 max-w-sm animate-in zoom-in-95 duration-200">
            <div className="relative flex items-center justify-center">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
              <div className="absolute w-6 h-6 bg-indigo-50 rounded-full animate-pulse flex items-center justify-center">
                <Database className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-extrabold text-slate-800">진주고등학교 연수 시스템</h3>
              <p className="text-xs font-bold text-indigo-600">구글 스프레드시트 실시간 동기화 중</p>
              <p className="text-[11px] text-slate-500 font-semibold leading-relaxed break-keep">
                중앙 구글 시트 데이터베이스로부터 실시간 교직원 명단, 연수 개설 현황 및 제출 이력을 안전하게 불러오고 있습니다. 잠시만 기다려 주십시오...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* admin authentication login modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6.5 shadow-2xl relative border-t-4 border-indigo-600 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 mx-auto rounded-full flex items-center justify-center">
                <Lock className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">관리자 모드 접속</h3>
              <p className="text-xs text-slate-400 leading-normal">
                관리자 계정정보를 입력하십시오.
                <br />
                관리자 계정정보는 1학년부 박재현에게 문의해주세요.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">관리자 아이디</label>
                <input
                  type="text"
                  placeholder="아이디를 기재하십시오"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">비밀번호</label>
                <input
                  type="password"
                  placeholder="비밀번호를 기재하십시오"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-rose-50 text-rose-700 text-[11px] p-2.5 rounded-lg border border-rose-150 font-medium">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-605 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>인증 및 전환 완료</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Topic Edit Modal */}
      {editingTopic && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl p-6.5 shadow-2xl relative border-t-4 border-indigo-600 animate-in zoom-in duration-200">
            <button
              onClick={() => setEditingTopic(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
            <div className="text-center space-y-2 mb-6">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 mx-auto rounded-full flex items-center justify-center">
                <Edit2 className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">이수증 취합 게시물 수정</h3>
              <p className="text-xs text-slate-400 leading-normal">
                이수증 취합 게시물의 상세 내용을 수정하고 스프레드시트와 동기화합니다.
              </p>
            </div>

            <form onSubmit={handleEditTopic} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">연수 과정명</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">상세 연수 내용 및 범위</label>
                <textarea
                  rows={3}
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">제출 마감 기한 설정</label>
                <input
                  type="date"
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">담당 부서 및 담당자명</label>
                <input
                  type="text"
                  value={editCreator}
                  onChange={(e) => setEditCreator(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                  placeholder="예: 1학년부 박재현"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTopic(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-xs transition-all cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  수정 사항 저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Primary Header Component */}
      <Header
        isAdmin={isAdmin}
        setIsAdmin={(val) => {
          if (val) {
            setIsLoginModalOpen(true);
            setLoginId('');
            setLoginPassword('');
            setLoginError('');
          } else {
            setIsAdmin(false);
            setActiveTab('my-status');
          }
        }}
        appsScriptUrl={appsScriptUrl}
        setAppsScriptUrl={setAppsScriptUrl}
        isSyncing={isSyncing}
        schoolName="진주고등학교"
        defaultUrl={DEFAULT_APPS_SCRIPT_URL}
      />

      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 p-4 lg:p-6" id="primary-wrapper">
        
        {/* Dynamic Navigation Dashboard sidebar */}
        <aside className="w-full lg:w-64 bg-white border border-slate-200/80 rounded-2xl p-5 flex flex-col gap-5 shrink-0 shadow-sm">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                📚
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">어서오세요!</h3>
                <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">이수증 취합 시스템에 오신 것을 환영합니다.</p>
              </div>
            </div>

            <nav className="space-y-1" id="nav-container">
              {/* Every member can view the Dashboard */}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>이수증 취합 대시보드</span>
              </button>

              <button
                onClick={() => setActiveTab('my-status')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all ${
                  activeTab === 'my-status'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>나의 이수증 제출</span>
              </button>

              <button
                onClick={() => setActiveTab('topics')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all ${
                  activeTab === 'topics'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>이수증 취합 게시물 개설 관리</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    onClick={() => setActiveTab('roster')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all ${
                      activeTab === 'roster'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>교직원 명렬 관리</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('setup-guide')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-xs tracking-wide transition-all ${
                      activeTab === 'setup-guide'
                        ? 'bg-indigo-50 text-indigo-700 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Database className="w-4 h-4" />
                    <span>구글 시트 연동 가이드</span>
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="mt-auto border-t border-slate-100 pt-4 space-y-3.5">
            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100">
              <span className="text-[10px] text-slate-400 font-medium block">교직원 명렬 편제 현황</span>
              <div className="flex gap-2 items-center justify-between mt-2">
                <span className="text-xs text-slate-600">교원</span>
                <span className="text-xs font-bold text-slate-800">{teachers.length}명</span>
              </div>
              <div className="flex gap-2 items-center justify-between mt-1">
                <span className="text-xs text-slate-600">공무직</span>
                <span className="text-xs font-bold text-slate-800">{unionWorkers.length}명</span>
              </div>
              <div className="flex gap-2 items-center justify-between mt-1">
                <span className="text-xs text-slate-600">일반직</span>
                <span className="text-xs font-bold text-slate-800">{generals.length}명</span>
              </div>
              {othersCount > 0 && (
                <div className="flex gap-2 items-center justify-between mt-1">
                  <span className="text-xs text-slate-600">기타 직종</span>
                  <span className="text-xs font-bold text-slate-800">{othersCount}명</span>
                </div>
              )}
            </div>

            {appsScriptUrl ? (
              isSyncFailed ? (
                <div className="bg-rose-50/80 text-rose-700 p-2.5 rounded-lg border border-rose-100 text-[11px] flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0 animate-pulse"></div>
                  <div className="leading-tight">
                    <span className="font-bold block text-rose-800">🔴 스프레드시트 연동 실패</span>
                    앱스 스크립트 배포 오류 또는 인터넷 지연으로 데이터를 로드할 수 없습니다. (로컬 임시 모드로 가동 중)
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/60 text-emerald-700 p-2.5 rounded-lg border border-emerald-100 text-[11px] flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse"></div>
                  <div className="leading-tight">
                    <span className="font-bold block text-emerald-800">🟢 스프레드시트 실시간 연동</span>
                    구글 드라이브 중앙 DB와 실시간 동기화 상태가 완벽히 적용되었습니다.
                  </div>
                </div>
              )
            ) : (
              <div className="bg-amber-50/60 text-amber-700 p-2.5 rounded-lg border border-amber-100 text-[11px] flex gap-2 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></div>
                <div className="leading-tight animate-pulse">
                  <span className="font-bold block text-amber-800">⚠️ 로컬 데모 모드 (연동 안 됨)</span>
                  스프레드시트가 비활성화되어 데이터가 브라우저에만 임시 저장됩니다.
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Dynamic Tab Panels */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Dashboard Summary view */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stat card list */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">전체 소속 교직원</span>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-800">{totalRosterCount}명</h3>
                    <p className="text-[10px] text-slate-400">교원 {teachers.length} / 공무직 {unionWorkers.length} / 일반 {generals.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 text-indigo-600 rounded-xl">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">개설된 취합 연수</span>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-800">{topics.length}개</h3>
                    <p className="text-[10px] text-indigo-600 font-medium">자동 개별 시트 100% 매핑</p>
                  </div>
                  <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <BookOpen className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-slate-400">선택연수 평균 이수율</span>
                    <h3 className="text-2xl font-bold tracking-tight text-slate-800">{activeSubmissionRate}%</h3>
                    <p className="text-[10px] text-slate-400">현재선택: {activeTopic?.title.substring(0, 16)}...</p>
                  </div>
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Status control and visual table */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
                
                {/* Left control panel */}
                <div className="md:w-1/3 p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                    <span>대상 연수 선택</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    이수 여부를 확인하고 취합 현황을 엑셀(*.csv)로 다운로드할 연수를 선택하십시오.
                  </p>

                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {topics.map(topic => (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => setSelectedTopicId(topic.id)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1.5 cursor-pointer ${
                          selectedTopicId === topic.id
                            ? 'border-indigo-200 bg-indigo-50/40 text-indigo-900 font-bold'
                            : 'border-slate-100 hover:border-slate-200 bg-white text-slate-600'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1 w-full">
                          <span className="font-bold line-clamp-1 flex-1">{topic.title}</span>
                          <span className="text-[9px] bg-slate-100 px-1 py-0.5 rounded text-slate-500 shrink-0 font-medium">
                            {formatDeadline(topic.deadline)} 마감
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{topic.content}</p>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('topics')}
                      className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>신규 이수증 취합 개설하기</span>
                      <PlusCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right submission list panel */}
                <div className="flex-1 p-6 space-y-4 flex flex-col">
                  {activeTopic ? (
                    <>
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{activeTopic.title}</h4>
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-bold font-mono">
                              {activeSubCount}/{activeTargetCount}명 이수 대상
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1 leading-normal">{activeTopic.content}</p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {(sortKey || sortOrder) && (
                            <button
                              onClick={() => {
                                setSortKey(null);
                                setSortOrder(null);
                              }}
                              className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition-all cursor-pointer shadow-xs font-bold"
                            >
                              <X className="w-3.5 h-3.5 text-slate-500" />
                              <span>필터 해제</span>
                            </button>
                          )}
                          <button
                            onClick={() => downloadCsvExport(activeTopic)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm transition-all"
                            id="download-excel-btn"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>EXCEL 다운로드</span>
                          </button>
                        </div>
                      </div>

                      {/* Filter stats block */}
                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div className="p-1">
                          <span className="block text-[10px] text-slate-400 font-medium">교원</span>
                          <span className="text-sm font-bold text-slate-700">
                            {subsForActiveTopic.filter(s => s.type === '교원').length} / {targetsForActiveTopic.filter(r => r.type === '교원').length}
                          </span>
                        </div>
                        <div className="p-1 border-x border-slate-200">
                          <span className="block text-[10px] text-slate-400 font-medium">교육공무직</span>
                          <span className="text-sm font-bold text-slate-700">
                            {subsForActiveTopic.filter(s => s.type === '교육공무직').length} / {targetsForActiveTopic.filter(r => r.type === '교육공무직').length}
                          </span>
                        </div>
                        <div className="p-1">
                          <span className="block text-[10px] text-slate-400 font-medium">일반직</span>
                          <span className="text-sm font-bold text-slate-700">
                            {subsForActiveTopic.filter(s => s.type === '일반직').length} / {targetsForActiveTopic.filter(r => r.type === '일반직').length}
                          </span>
                        </div>
                      </div>

                      {/* Live Table */}
                      <div className="overflow-x-auto border border-slate-100 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100 select-none">
                            <tr>
                              <th 
                                onClick={() => handleHeaderClick('name')}
                                className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>성명</span>
                                  {getSortIcon('name')}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleHeaderClick('department')}
                                className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>소속 및 부서</span>
                                  {getSortIcon('department')}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleHeaderClick('type')}
                                className="p-3 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>직종</span>
                                  {getSortIcon('type')}
                                </div>
                              </th>
                              <th 
                                onClick={() => handleHeaderClick('status')}
                                className="p-3 col-span-2 cursor-pointer hover:bg-slate-100 transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span>제출현황</span>
                                  {getSortIcon('status')}
                                </div>
                              </th>
                              <th className="p-3">이수 기재 번호</th>
                              <th className="p-3">연수시간</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                            {sortedTargets.map(member => {
                              const sub = subsForActiveTopic.find(s => s.name === member.name);
                              return (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 text-slate-900 font-bold">{member.name}</td>
                                  <td className="p-3 text-slate-400">{member.department || '미지정'}</td>
                                  <td className="p-3">
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      member.type === '교원'
                                        ? 'bg-blue-50 text-blue-700 border border-blue-100/50'
                                        : member.type === '교육공무직'
                                        ? 'bg-purple-50 text-purple-700 border border-purple-100/50'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100/50'
                                    }`}>
                                      {member.type}
                                    </span>
                                  </td>
                                  <td className="p-3 col-span-2">
                                    {activeTopic?.id === 'topic-statutory-combined' ? (
                                      (() => {
                                        const detail = getStatutoryDetailText(sub);
                                        return (
                                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10.5px] ${detail.badgeClass}`}>
                                            {sub ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5 text-slate-400" />}
                                            <span>{detail.label}</span>
                                          </span>
                                        );
                                      })()
                                    ) : sub ? (
                                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        <span>이수완료</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-slate-400">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        <span>미제출</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-3 font-mono text-slate-500 text-[11px]">
                                    {sub ? sub.certNumber : '-'}
                                  </td>
                                  <td className="p-3">
                                    {sub ? <span className="font-bold text-slate-800">{typeof sub.hours === 'string' && sub.hours.includes('-') ? sub.hours : `${sub.hours}시간`}</span> : '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400">
                      <BookOpen className="w-12 h-12 text-slate-300 mb-2" />
                      <p className="text-xs">이수증 취합 게시물을 추가해 주십시오.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Topics management tab */}
          {activeTab === 'topics' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Creation Form */}
              <div className="lg:col-span-2 space-y-6">
                <form onSubmit={handleCreateTopic} className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                    <span>이수증 취합 게시물 추가</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    교원, 공무직, 일반직 등의 구분을 두고 신규 이수증 취합 목록을 개설합니다. 구글 시트와 연동되어 있다면 해당 연수명의 전용 취합 시트가 실시간으로 자동 추가됩니다.
                  </p>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">연수 과정명</label>
                      <input
                        type="text"
                        placeholder="예: 2026학년도 교직원 안전 교육"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">상세 연수 내용 및 범위</label>
                      <textarea
                        rows={3}
                        placeholder="교직원들이 제출 시 참고할 과정 설명, 연수 포털 기관, 연수과정 웹주소 등을 적어주세요."
                        value={newContent}
                        onChange={(e) => setNewContent(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">제출 마감 기한 설정</label>
                      <div className="relative">
                        <input
                          type="date"
                          value={newDeadline}
                          onChange={(e) => setNewDeadline(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                        />
                        <Calendar className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">담당 부서 및 담당자명</label>
                      <input
                        type="text"
                        placeholder="예: 1학년부 박재현(선택사항/입력을 권장합니다.)"
                        value={newCreator}
                        onChange={(e) => setNewCreator(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>

                    <div className="bg-indigo-50/20 border border-indigo-100/60 p-4 rounded-2xl space-y-1.5 transition-all">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          id="chk-link-statutory"
                          checked={linkStatutorySubmissions}
                          onChange={(e) => setLinkStatutorySubmissions(e.target.checked)}
                          className="mt-0.5 rounded border-slate-350 text-indigo-600 focus:ring-indigo-550 h-4 w-4 cursor-pointer"
                        />
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 select-none">
                            🛡️ 법정의무연수 꾸러미 이수 데이터 연동 여부
                          </span>
                          <p className="text-[10px] text-slate-400 leading-normal font-medium select-none">
                            이 옵션을 체크하면, 신규로 개설할 이수증 취합 게시물에 교직원들이 제출한 '법정의무연수 꾸러미 과정'의 이수 완료 여부 및 이수번호/시간/일자가 실시간 자동 연계·반영됩니다. (신규 게시글 개설 후에 꾸러미를 이수해도 연동되어 완료 처리됨, 즉 꾸러미의 이수 관련 데이터가 덮어씌워짐.)
                          </p>
                        </div>
                      </label>
                    </div>

                    <div>
                      <span className="block text-xs font-semibold text-slate-500 mb-1.5">이수증 제출 대상 교직원 지정(직종 클릭 시 해당 직종 전체선택)</span>
                      
                      {/* Job type bulk-toggles */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const ids = roster.filter(r => r.type === '교원').map(r => r.id);
                            const hasAll = ids.every(id => selectedTargetIds.includes(id));
                            if (hasAll) {
                              // Deselect all 교원
                              setSelectedTargetIds(prev => prev.filter(id => !ids.includes(id)));
                            } else {
                              // Select all 교원
                              setSelectedTargetIds(prev => Array.from(new Set([...prev, ...ids])));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            roster.filter(r => r.type === '교원').map(r => r.id).every(id => selectedTargetIds.includes(id)) && roster.some(r => r.type === '교원')
                              ? 'bg-blue-100 border-blue-200 text-blue-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          교원 전체선택
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ids = roster.filter(r => r.type === '교육공무직').map(r => r.id);
                            const hasAll = ids.every(id => selectedTargetIds.includes(id));
                            if (hasAll) {
                              setSelectedTargetIds(prev => prev.filter(id => !ids.includes(id)));
                            } else {
                              setSelectedTargetIds(prev => Array.from(new Set([...prev, ...ids])));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            roster.filter(r => r.type === '교육공무직').map(r => r.id).every(id => selectedTargetIds.includes(id)) && roster.some(r => r.type === '교육공무직')
                              ? 'bg-purple-100 border-purple-200 text-purple-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          교육공무직 전체선택
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const ids = roster.filter(r => r.type === '일반직').map(r => r.id);
                            const hasAll = ids.every(id => selectedTargetIds.includes(id));
                            if (hasAll) {
                              setSelectedTargetIds(prev => prev.filter(id => !ids.includes(id)));
                            } else {
                              setSelectedTargetIds(prev => Array.from(new Set([...prev, ...ids])));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                            roster.filter(r => r.type === '일반직').map(r => r.id).every(id => selectedTargetIds.includes(id)) && roster.some(r => r.type === '일반직')
                              ? 'bg-emerald-100 border-emerald-200 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          일반직 전체선택
                        </button>
                      </div>

                      {/* Individual scrollable search or selector */}
                      <div className="border border-slate-250 border-dashed rounded-xl max-h-[160px] overflow-y-auto index-scroll p-2 bg-slate-50/50 space-y-1">
                        {roster.map(r => (
                          <label key={r.id} className="flex items-center gap-2.5 px-2 py-1.5 hover:bg-white rounded-lg transition-colors cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={selectedTargetIds.includes(r.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTargetIds(prev => [...prev, r.id]);
                                } else {
                                  setSelectedTargetIds(prev => prev.filter(id => id !== r.id));
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                            <span className="font-bold text-slate-800 flex-1">{r.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{r.department || '미지정'}</span>
                            <span className="text-[9px] bg-white border px-1 py-0.5 rounded-md text-slate-500 shrink-0 font-medium">
                              {r.type}
                            </span>
                          </label>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-2.5 text-[10px] text-slate-400 font-medium">
                        <span>선택된 제출 대상: <strong className="text-indigo-600 font-bold">{selectedTargetIds.length}명</strong> / 전체 {roster.length}명</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedTargetIds.length === roster.length) {
                              setSelectedTargetIds([]);
                            } else {
                              setSelectedTargetIds(roster.map(r => r.id));
                            }
                          }}
                          className="hover:text-indigo-600 font-semibold cursor-pointer underline underline-offset-2"
                        >
                          {selectedTargetIds.length === roster.length ? '전체 해제' : '전체 선택'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {creationMessage && (
                    <div className="bg-emerald-50 text-emerald-700 text-xs p-3 rounded-xl border border-emerald-100 flex items-start gap-2 leading-relaxed">
                      <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{creationMessage}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>이수증 취합 게시물 등록 및 시트 생성</span>
                  </button>
                </form>
              </div>

              {/* Opened lists */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">개설 완료 목록 ({topics.length}개)</h3>
                    <span className="text-[11px] text-slate-400 font-medium">수집 중</span>
                  </div>

                  <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                    {topics.map(topic => {
                      const counts = getSubmissionsForTopic(topic.id).length;
                      return (
                        <div key={topic.id} className="border border-slate-100 hover:border-slate-200/80 p-4 rounded-xl space-y-3 transition-colors bg-slate-50/50">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-slate-800 text-sm leading-snug">{topic.title}</h4>
                              <p className="text-[11px] text-slate-400 mt-1">{topic.content}</p>
                            </div>
                            {isAdmin && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditingTopic(topic);
                                    setEditTitle(topic.title);
                                    setEditContent(topic.content);
                                    setEditDeadline(formatDeadline(topic.deadline));
                                    setEditCreator(topic.creator || '');
                                  }}
                                  className="text-slate-300 hover:text-indigo-600 transition-colors p-1 cursor-pointer"
                                  title="수정"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('해당 연수를 취합 목록에서 제거합니까? 기제출 자료들도 비활성화 됩니다.')) {
                                      setTopics(topics.filter(t => t.id !== topic.id));
                                    }
                                  }}
                                  className="text-slate-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                  title="삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 border-t border-slate-100 pt-2 text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-indigo-500" />
                              <span>기한: <strong className="text-slate-700">{formatDeadline(topic.deadline)}</strong></span>
                            </span>
                            {topic.creator && (
                              <span className="text-slate-500 font-medium">담당: <strong className="text-slate-700">{topic.creator}</strong></span>
                            )}
                            <span>등록일: {formatDate(topic.createdAt)}</span>
                            <div className="flex gap-2 items-center">
                              <span className="bg-indigo-100/80 text-indigo-700 font-bold px-2 py-0.5 rounded-full text-[10px]">
                                {counts}명 완료
                              </span>
                              {appsScriptUrl && (
                                <span className="bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded-full text-[9px]">
                                  시트 연계 완료
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Roster management tab */}
          {activeTab === 'roster' && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              
              {/* Roster form */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* CSV Bulk Uploader */}
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-emerald-500 rounded"></span>
                    <span>교직원 명렬 CSV 일괄 업로드</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    엑셀 등에서 작성한 교직원 명렬 목록 파일(.csv)을 일괄 등록할 수 있습니다. 
                    (첫 번째 행이 헤더이며 '성명', '직종(또는 구분)', '부서(또는 소속)' 컬럼을 자동 분석합니다)
                  </p>

                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-center justify-between gap-3 text-xs flex-wrap">
                    <span className="text-indigo-800 font-medium text-[11px]">📝 일관된 업로드를 위한 전용 서식을 다운로드하세요.</span>
                    <button
                      type="button"
                      onClick={downloadCsvTemplate}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10.5px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 shadow-2xs shrink-0"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>기본 양식(.csv) 다운로드</span>
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-xl p-4.5 text-center transition-all bg-slate-50/50 relative cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileDown className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <span className="block text-xs font-bold text-slate-600">CSV 파일 드래그 또는 선택</span>
                    <span className="block text-[10px] text-slate-400 mt-1">UTF-8 / EUC-KR 및 Excel 호환 형식 자동인식</span>
                  </div>

                  {csvPreview.length > 0 && (
                    <div className="border border-indigo-150 rounded-xl p-3.5 bg-indigo-50/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-900">📂 업로드 대기 ({csvPreview.length}명)</span>
                        <button
                          type="button"
                          onClick={() => setCsvPreview([])}
                          className="text-[10px] text-rose-500 font-bold hover:underline cursor-pointer"
                        >
                          취소
                        </button>
                      </div>

                      <div className="max-h-[140px] overflow-y-auto bg-white border border-indigo-100 rounded-lg p-2 space-y-1 index-scroll">
                        {csvPreview.slice(0, 15).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] border-b border-slate-100 pb-1 last:border-none">
                            <span className="font-bold text-slate-800">{item.name}</span>
                            <span className="text-slate-400">{item.department || '미지정'}</span>
                            <span className="bg-slate-100 px-1 py-0.2 rounded text-[10px] text-slate-500 font-semibold">{item.type}</span>
                          </div>
                        ))}
                        {csvPreview.length > 15 && (
                          <div className="text-center text-[10px] text-slate-400 pt-1">
                            외 {csvPreview.length - 15}명이 더 있습니다.
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveCsvData(false)}
                          className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-[11px] font-bold shadow-sm cursor-pointer"
                        >
                          기존 명렬에 추가
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('⚠️ 정말로 기존의 모든 명렬을 삭제하고 이 파일의 데이터로 완전히 대체하시겠습니까?')) {
                              handleSaveCsvData(true);
                            }
                          }}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-[11px] font-bold shadow-sm cursor-pointer"
                        >
                          비운 뒤 덮어쓰기
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Individual Roster Form */}
                <form onSubmit={handleAddRosterMember} className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                    <span>교직원 개별 직접 등록</span>
                  </h3>
                  <p className="text-xs text-slate-400 leading-normal">
                    취합에 사용될 교직원 개별 명줄을 수동 등록합니다.
                  </p>

                  <div className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">성명</label>
                      <input
                        type="text"
                        placeholder="성명을 기재해 주십시오."
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">직종 구분</label>
                      <select
                        value={isCustomType ? 'custom' : newMemberType}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'custom') {
                            setIsCustomType(true);
                          } else {
                            setIsCustomType(false);
                            setNewMemberType(val as EmployeeType);
                          }
                        }}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none bg-white font-medium"
                      >
                        <option value="교원">교원</option>
                        <option value="일반직">일반직</option>
                        <option value="교육공무직">교육공무직</option>
                        <option value="custom">직접 입력 (새 직종 추가...)</option>
                      </select>
                      {isCustomType && (
                        <input
                          type="text"
                          placeholder="새 직종명을 입력하세요. (예: 계약직, 외부강사 등)"
                          value={customTypeName}
                          onChange={(e) => setCustomTypeName(e.target.value)}
                          className="mt-2 w-full text-xs px-3.5 py-2.5 border border-indigo-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                          required
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">소속 부서</label>
                      <input
                        type="text"
                        placeholder="예: 행정실, 급식실, 1학년부 등 (선택)"
                        value={newMemberDept}
                        onChange={(e) => setNewMemberDept(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>명렬에 추가</span>
                  </button>

                  <div className="space-y-1.5 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('전체 명렬을 샘플 기초 데이터로 복원하시겠습니까? 로컬 상태가 리셋됩니다.')) {
                          setRoster(INITIAL_ROSTER);
                        }
                      }}
                      className="w-full py-1.5 text-slate-500 bg-slate-100 hover:bg-slate-200 font-semibold rounded-lg text-[11px] transition-all cursor-pointer"
                    >
                      기본 샘플 복제본으로 초기화
                    </button>
                    {appsScriptUrl && (
                      <button
                        type="button"
                        onClick={syncWithGoogleSheet}
                        className="w-full py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-semibold rounded-lg text-[11px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>전체 시트 즉시 덮어쓰기 업데이트</span>
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Roster table */}
              <div className="lg:col-span-3">
                <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">등록 교직원 수: {roster.length}명</h3>
                    <div className="flex gap-1.5 text-[10px] text-slate-400">
                      <span>교원 {teachers.length}</span>
                      <span>•</span>
                      <span>공무직 {unionWorkers.length}</span>
                      <span>•</span>
                      <span>일반직 {generals.length}</span>
                      {othersCount > 0 && (
                        <>
                          <span>•</span>
                          <span>기타 {othersCount}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="overflow-y-auto max-h-[460px] border border-slate-100 rounded-xl">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="p-3">성명</th>
                          <th className="p-3">소속 및 부서</th>
                          <th className="p-3">구분</th>
                          <th className="p-3 text-right">삭제</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        {roster.map(r => (
                          <tr key={r.id} className="hover:bg-slate-50/50">
                            <td className="p-3 text-slate-800 font-bold">{r.name}</td>
                            <td className="p-3 text-slate-400">{r.department || '미배치'}</td>
                            <td className="p-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                r.type === '교원'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100/40'
                                  : r.type === '교육공무직'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-100/40'
                                  : r.type === '일반직'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/40'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200/40'
                              }`}>
                                {r.type}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => handleRemoveMember(r.id)}
                                className="text-slate-300 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* User page and Submission system */}
          {activeTab === 'my-status' && (
            <div className="space-y-6">
              
              {/* Submission complete notice */}
              {submissionCompleteMsg && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-start gap-3 shadow-sm animate-in fade-in slide-in-from-top-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm">연수 이수 서류가 무해 제출 완료되었습니다!</h4>
                    <p className="text-xs text-emerald-600 mt-1 font-medium">{submissionCompleteMsg}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                
                {/* 1. Identification check & Certificate form */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Step 1: Employee Identify Lookup */}
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                      <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                      <span>1단계: 교직원 성명 확인</span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      정확한 제출자 확인을 위해 시스템에 등록된 본인의 성명을 입력하고 확인 버튼을 누릅니다.
                    </p>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          placeholder="본인의 성명을 입력하세요"
                          value={searchStaffName}
                          onChange={(e) => {
                            setSearchStaffName(e.target.value);
                            setMatchedStaff(null);
                          }}
                          className="w-full text-xs pl-8.5 pr-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white"
                        />
                        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                      </div>
                      <button
                        type="button"
                        onClick={handleStaffLookup}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-4 py-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer"
                      >
                        이름 확인
                      </button>
                    </div>

                    {matchedStaff ? (
                      <div className="bg-indigo-50/50 p-3 rounded-xl border border-indigo-100 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="text-slate-400 text-[10px]">인증완료</span>
                          <p className="font-bold text-indigo-900">
                            {matchedStaff.name} ({matchedStaff.type} / {matchedStaff.department || '미소속'})
                          </p>
                        </div>
                        <span className="bg-indigo-100 text-indigo-700 font-extrabold px-1.5 py-0.5 rounded text-[10px]">
                          매칭됨
                        </span>
                      </div>
                    ) : (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-[11px] text-slate-400">
                        교직원 인증을 완료해야 이수증 제출이 시작됩니다.
                      </div>
                    )}
                  </div>

                  {/* Step 2: File Upload / Direct Submission */}
                  {matchedStaff && (
                    <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                        <span>2단계: 이수 정보 입력</span>
                      </h3>
                      
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5">이수증 제출 방식 선택</label>
                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadMethod('pdf');
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              uploadMethod === 'pdf'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500'
                            }`}
                          >
                            PDF 업로드(스크래핑))
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setUploadMethod('direct');
                            }}
                            className={`py-2 text-xs font-bold rounded-lg transition-all ${
                              uploadMethod === 'direct'
                                ? 'bg-white text-indigo-600 shadow-sm'
                                : 'text-slate-500'
                            }`}
                          >
                            수동 입력(직접 입력))
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1">제출 대상 연수 선택</label>
                        <select
                          value={selectedStaffTopicId}
                          onChange={(e) => setSelectedStaffTopicId(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-600 bg-white text-slate-800 font-semibold cursor-pointer"
                        >
                          {topics.map(t => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                        {selectedStaffTopicId === 'topic-statutory-combined' ? (
                          <p className="text-[10px] text-indigo-600 mt-1 font-medium bg-indigo-50/50 p-2 rounded-lg border border-indigo-100/40 select-none">
                            🛡️ <strong>'2026학년도 법정의무연수 꾸러미 과정'</strong>은 I과정 및 II과정 개별 제출과 통합 제출이 모두 지원됩니다.
                          </p>
                        ) : topics.find(t => t.id === selectedStaffTopicId)?.linkStatutorySubmissions ? (
                          <p className="text-[10px] text-emerald-600 mt-1 font-medium bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/40 select-none animate-in fade-in">
                            🔗 본 과정은 <strong>'법정의무연수 꾸러미 과정' 이수자 자동 연동</strong>이 활성화되어 있습니다. 꾸러미를 이수하여 제출하셨다면 본 과정에도 실시간으로 해당 정보가 연계·적용됩니다.
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-200/40 select-none animate-in fade-in">
                            ℹ️ 선택하신 게시글에 이수 정보를 등록합니다.
                          </p>
                        )}
                      </div>

                      {/* 법정의무연수 꾸러미 전용 상세 설정 UI */}
                      {statutoryCourseMode !== 'none' && (
                        <div className="p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100/75 space-y-3 animate-in fade-in zoom-in-95 duration-200">
                          <span className="text-[11px] text-indigo-800 font-extrabold flex items-center gap-1">
                            🛡️ 법정의무연수 꾸러미 과정 제출 가이드
                          </span>
                          
                          <div className="space-y-1.5">
                            <label className="block text-[10px] font-bold text-indigo-700">이수 과정 구분 선택</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={() => setStatutoryCourseMode('I')}
                                className={`px-2 py-1.5 border rounded-lg text-[10.5px] font-bold transition-all cursor-pointer text-center ${
                                  statutoryCourseMode === 'I'
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                과정 I 제출 (12H)
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatutoryCourseMode('II')}
                                className={`px-2 py-1.5 border rounded-lg text-[10.5px] font-bold transition-all cursor-pointer text-center ${
                                  statutoryCourseMode === 'II'
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                과정 II 제출 (13H)
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatutoryCourseMode('both')}
                                className={`px-2 py-1.5 border rounded-lg text-[10.5px] font-bold transition-all cursor-pointer text-center ${
                                  statutoryCourseMode === 'both'
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                과정 I & II 동시 제출 (12h+13h)
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatutoryCourseMode('combined')}
                                className={`px-2 py-1.5 border rounded-lg text-[10.5px] font-bold transition-all cursor-pointer text-center ${
                                  statutoryCourseMode === 'combined'
                                    ? 'bg-indigo-600 border-indigo-700 text-white shadow-2xs'
                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                              >
                                통합 과정 제출 (25H)
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-indigo-100/60">
                            <span className="text-[10px] text-indigo-950 font-extrabold">🔄 타 꾸러미 과정 자동 상호 연동</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isStatutorySync}
                                onChange={(e) => setIsStatutorySync(e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-focus:ring-0 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                          </div>
                          <p className="text-[9px] text-indigo-500/80 leading-normal font-medium">
                            * 체크 시 하나의 꾸러미 과정(I, II 또는 통합)만 제출해도 나머지 관련 과정들의 이수 현황 및 이수번호가 실시간으로 자동 기재·완료됩니다.
                          </p>
                        </div>
                      )}

                      {uploadMethod === 'pdf' ? (
                        selectedStaffTopicId === 'topic-statutory-combined' && statutoryCourseMode === 'both' ? (
                          <div className="space-y-4">
                            <div className="space-y-2 pb-2 border-b border-dashed border-slate-150">
                              <label className="block text-xs font-semibold text-slate-700">과정 I 이수증 업로드 (.pdf)</label>
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors relative cursor-pointer group bg-slate-50/50">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={handleFileChangeI}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="space-y-1 text-slate-400">
                                  <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-indigo-500 transition-colors" />
                                  <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                    {pdfFileI ? pdfFileI.name : '과정 I 이수증 PDF 파일 올리기'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    과정 I PDF를 올리면 AI가 이수 번호와 수료일자를 자동 추출합니다.
                                  </p>
                                </div>
                              </div>
                              {isAnalyzingI && (
                                <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl text-xs space-y-1 border border-indigo-100 flex items-center gap-1.5 font-medium">
                                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                                  <span>{analysisSuccessMsgI || 'Gemini AI 과정 I 자동 분석 중...'}</span>
                                </div>
                              )}
                              {analysisErrorI && (
                                <div className="bg-amber-55 text-amber-800 p-2.5 rounded-xl text-xs font-medium border border-amber-100">
                                  {analysisErrorI}
                                </div>
                              )}
                              {!isAnalyzingI && analysisSuccessMsgI && (
                                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold border border-emerald-100 leading-normal flex items-start gap-1.5">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                  <span>{analysisSuccessMsgI}</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              <label className="block text-xs font-semibold text-slate-700">과정 II 이수증 업로드 (.pdf)</label>
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors relative cursor-pointer group bg-slate-50/50">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={handleFileChangeII}
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                                <div className="space-y-1 text-slate-400">
                                  <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-indigo-500 transition-colors" />
                                  <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                    {pdfFileII ? pdfFileII.name : '과정 II 이수증 PDF 파일 올리기'}
                                  </p>
                                  <p className="text-[10px] text-slate-400">
                                    과정 II PDF를 올리면 AI가 이수 번호와 수료일자를 자동 추출합니다.
                                  </p>
                                </div>
                              </div>
                              {isAnalyzingII && (
                                <div className="bg-indigo-50 text-indigo-700 p-2.5 rounded-xl text-xs space-y-1 border border-indigo-100 flex items-center gap-1.5 font-medium">
                                  <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                                  <span>{analysisSuccessMsgII || 'Gemini AI 과정 II 자동 분석 중...'}</span>
                                </div>
                              )}
                              {analysisErrorII && (
                                <div className="bg-amber-55 text-amber-800 p-2.5 rounded-xl text-xs font-medium border border-amber-100">
                                  {analysisErrorII}
                                </div>
                              )}
                              {!isAnalyzingII && analysisSuccessMsgII && (
                                <div className="bg-emerald-50 text-emerald-800 p-2.5 rounded-xl text-xs font-semibold border border-emerald-100 leading-normal flex items-start gap-1.5">
                                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                  <span>{analysisSuccessMsgII}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : selectedStaffTopicId === 'topic-statutory-combined' && statutoryCourseMode === 'I' ? (
                          <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-700">과정 I 이수증 업로드 (.pdf)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors relative cursor-pointer group bg-slate-50/50">
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChangeI}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="space-y-1 text-slate-400">
                                <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-indigo-500 transition-colors" />
                                <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                  {pdfFileI ? pdfFileI.name : '과정 I 이수증 PDF 파일 올리기'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  과정 I PDF를 올리면 AI가 이수 번호와 수료일자를 자동 추출합니다.
                                </p>
                              </div>
                            </div>
                            {isAnalyzingI && (
                              <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-xs space-y-1.5 border border-indigo-100 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                                <span className="font-semibold">{analysisSuccessMsgI || 'Gemini AI 과정 I 자동 분석 중...'}</span>
                              </div>
                            )}
                            {analysisErrorI && (
                              <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-medium border border-amber-100">
                                {analysisErrorI}
                              </div>
                            )}
                            {!isAnalyzingI && analysisSuccessMsgI && (
                              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-medium border border-emerald-100 leading-normal flex items-start gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{analysisSuccessMsgI}</span>
                              </div>
                            )}
                          </div>
                        ) : selectedStaffTopicId === 'topic-statutory-combined' && statutoryCourseMode === 'II' ? (
                          <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-700">과정 II 이수증 업로드 (.pdf)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors relative cursor-pointer group bg-slate-50/50">
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChangeII}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="space-y-1 text-slate-400">
                                <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-indigo-500 transition-colors" />
                                <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                  {pdfFileII ? pdfFileII.name : '과정 II 이수증 PDF 파일 올리기'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  과정 II PDF를 올리면 AI가 이수 번호와 수료일자를 자동 추출합니다.
                                </p>
                              </div>
                            </div>
                            {isAnalyzingII && (
                              <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-xs space-y-1.5 border border-indigo-100 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                                <span className="font-semibold">{analysisSuccessMsgII || 'Gemini AI 과정 II 자동 분석 중...'}</span>
                              </div>
                            )}
                            {analysisErrorII && (
                              <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-medium border border-amber-100">
                                {analysisErrorII}
                              </div>
                            )}
                            {!isAnalyzingII && analysisSuccessMsgII && (
                              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-medium border border-emerald-100 leading-normal flex items-start gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{analysisSuccessMsgII}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="block text-xs font-semibold text-slate-500 mb-0.5">이수증 업로드 (.pdf)</label>
                            <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors relative cursor-pointer group bg-slate-50/50">
                              <input
                                type="file"
                                accept="application/pdf"
                                onChange={handleFileChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                              <div className="space-y-1 text-slate-400">
                                <Upload className="w-8 h-8 text-slate-300 mx-auto group-hover:text-indigo-500 transition-colors" />
                                <p className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">
                                  {pdfFile ? pdfFile.name : '이수증 PDF 파일 올리기'}
                                </p>
                                <p className="text-[10px] text-slate-400">
                                  PDF를 업로드하면 AI가 이수 번호와 날짜를 자동 추출합니다.
                                </p>
                              </div>
                            </div>
                            {isAnalyzing && (
                              <div className="bg-indigo-50 text-indigo-700 p-3 rounded-xl text-xs space-y-1.5 border border-indigo-100 flex items-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin shrink-0 text-indigo-600" />
                                <span className="font-semibold">{analysisSuccessMsg}</span>
                              </div>
                            )}
                            {analysisError && (
                              <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-medium border border-amber-100">
                                {analysisError}
                              </div>
                            )}
                            {!isAnalyzing && analysisSuccessMsg && (
                              <div className="bg-emerald-50 text-emerald-800 p-3 rounded-xl text-xs font-medium border border-emerald-100 leading-normal flex items-start gap-1.5">
                                <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                                <span>{analysisSuccessMsg}</span>
                              </div>
                            )}
                          </div>
                        )
                      ) : null}

                      <div className="border-t border-slate-100 pt-3.5 space-y-3">
                        {statutoryCourseMode === 'both' ? (
                          <div className="space-y-3.5 bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/40 animate-in fade-in zoom-in-95">
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">과정 I 이수번호</label>
                                <input
                                  type="text"
                                  placeholder="제 2026-I-XX호"
                                  value={certNumberI}
                                  onChange={(e) => setCertNumberI(e.target.value)}
                                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">과정 I 이수일자</label>
                                <input
                                  type="date"
                                  value={certDateI}
                                  onChange={(e) => setCertDateI(e.target.value)}
                                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">과정 II 이수번호</label>
                                <input
                                  type="text"
                                  placeholder="제 2026-II-XX호"
                                  value={certNumberII}
                                  onChange={(e) => setCertNumberII(e.target.value)}
                                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1">과정 II 이수일자</label>
                                <input
                                  type="date"
                                  value={certDateII}
                                  onChange={(e) => setCertDateII(e.target.value)}
                                  className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                                />
                              </div>
                            </div>
                          </div>
                        ) : statutoryCourseMode === 'I' ? (
                          <div className="grid grid-cols-2 gap-2 bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/40 animate-in fade-in zoom-in-95">
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-700 mb-1">과정 I 이수번호</label>
                              <input
                                type="text"
                                placeholder="제 2026-I-XX호"
                                value={certNumberI}
                                onChange={(e) => setCertNumberI(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-700 mb-1">과정 I 이수일자</label>
                              <input
                                type="date"
                                value={certDateI}
                                onChange={(e) => setCertDateI(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                              />
                            </div>
                          </div>
                        ) : statutoryCourseMode === 'II' ? (
                          <div className="grid grid-cols-2 gap-2 bg-indigo-50/20 p-3 rounded-xl border border-indigo-100/40 animate-in fade-in zoom-in-95">
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-700 mb-1">과정 II 이수번호</label>
                              <input
                                type="text"
                                placeholder="제 2026-II-XX호"
                                value={certNumberII}
                                onChange={(e) => setCertNumberII(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-indigo-700 mb-1">과정 II 이수일자</label>
                              <input
                                type="date"
                                value={certDateII}
                                onChange={(e) => setCertDateII(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">
                                {statutoryCourseMode === 'combined' ? '통합 과정 이수번호' : '이수번호 기재'}
                              </label>
                              <input
                                type="text"
                                placeholder={statutoryCourseMode === 'combined' ? '제 2026-통합-XX호' : '제 2026-05호 등'}
                                value={certNumber}
                                onChange={(e) => setCertNumber(e.target.value)}
                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">
                                {statutoryCourseMode === 'combined' ? '통합 과정 이수일자' : '이수 완료 일자'}
                              </label>
                              <input
                                type="date"
                                value={certDate}
                                onChange={(e) => setCertDate(e.target.value)}
                                className="w-full text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-medium"
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-500 mb-1">이수 시간</label>
                          <input
                            type="number"
                            min="1"
                            value={hours}
                            onChange={(e) => setHours(Number(e.target.value))}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-600 bg-white font-semibold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={submitCertificate}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>확인 및 제출 등록 완료하기</span>
                      </button>
                    </div>
                  )}


                </div>

                {/* 2. My list tracking & Single print */}
                <div className="lg:col-span-3 space-y-6">
                  
                  {/* Status Checker Lookup Card */}
                  <div className="bg-white border border-slate-200/80 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="border-b border-slate-100 pb-3">
                      <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                        <span className="w-1 h-3.5 bg-indigo-600 rounded"></span>
                        <span>나의 이수증 제출 현황 상세 조회</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        시스템에 등록된 본인의 이수증 제출 목록 상세 현황판입니다.
                      </p>
                    </div>

                    {/* Pre-fill or manual query depending on whether user is verified */}
                    {matchedStaff ? (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-3 bg-indigo-50/70 text-indigo-900 border border-indigo-100 rounded-xl text-xs flex items-center justify-between">
                          <div className="space-y-0.5">
                            <span className="text-[10px] text-indigo-500 font-bold block">조회인증 교직원</span>
                            <span className="font-bold">
                              {matchedStaff.name} 님 ({matchedStaff.type} / {matchedStaff.department || '미소속'})
                            </span>
                          </div>
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full">로그인 매칭 중</span>
                        </div>

                        <div className="p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl">
                          <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                            💡 <span className="text-indigo-600">안내:</span> 아래 목록에서 제출할 연수 과정 제목을 누르시면, 왼쪽에 있는 <strong className="text-indigo-700">"2단계: 이수 정보 입력"</strong>의 대상 연수가 자동으로 지정됩니다. 해당 과정을 편리하게 즉시 접수하거나 기존 내용을 신속히 수정·제출하실 수 있습니다. (직종별 제출 제외 대상은 선택할 수 없습니다.)
                          </p>
                        </div>

                        <div className="space-y-2.5">
                          <h4 className="text-xs font-extrabold text-slate-700">
                            본인 대상 이수증 취합 게시물 현황 ({topics.filter(t => !t.targets || t.targets.includes(matchedStaff.id)).length}개 과정)
                          </h4>
                          
                          <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                            {topics.map(topic => {
                              const sub = getSubmissionsForTopic(topic.id).find(s => s.name === matchedStaff.name);
                              const isEligible = !topic.targets || topic.targets.includes(matchedStaff.id);
                              const isSelected = selectedStaffTopicId === topic.id;
                              
                              return (
                                <button
                                  key={topic.id}
                                  type="button"
                                  disabled={!isEligible}
                                  onClick={() => setSelectedStaffTopicId(topic.id)}
                                  className={`w-full text-left p-3.5 rounded-xl text-xs flex justify-between items-center transition-all border ${
                                    isEligible
                                      ? isSelected
                                        ? 'border-indigo-500 bg-indigo-50/30 ring-1 ring-indigo-500 shadow-sm font-bold cursor-pointer'
                                        : 'border-slate-100 bg-white hover:border-slate-200 cursor-pointer hover:bg-slate-50/40'
                                      : 'border-slate-100 bg-slate-50/50 opacity-60 cursor-not-allowed'
                                  }`}
                                >
                                  <div className="space-y-1.5 pr-4 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h5 className={`font-bold text-slate-800 line-clamp-1 ${isSelected ? 'text-indigo-900 font-extrabold' : ''}`}>
                                        {topic.title}
                                      </h5>
                                      {!isEligible && (
                                        <span className="text-[9px] bg-slate-200 text-slate-500 font-bold px-1.5 py-0.2 rounded shrink-0">
                                          대상 제외
                                        </span>
                                      )}
                                      {isSelected && (
                                        <span className="text-[9px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded shrink-0 animate-pulse">
                                          작성 중
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-2 text-[10px] text-slate-400">
                                      <span>이수시간: {sub ? <strong className="text-slate-700">{typeof sub.hours === 'string' && sub.hours.includes('-') ? sub.hours : `${sub.hours}시간`}</strong> : '-'}</span>
                                      <span>•</span>
                                      <span>이수번호: {sub ? <span className="font-mono text-slate-600">{sub.certNumber}</span> : '미제출'}</span>
                                      <span>•</span>
                                      <span>기한: ~ {formatDeadline(topic.deadline)}</span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 pl-1">
                                    {sub ? (
                                      <span className="text-[10.5px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-2xs">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        <span>제출 완료 (수정 가능)</span>
                                      </span>
                                    ) : (
                                      isEligible ? (
                                        <span className="text-[10.5px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-full flex items-center gap-1 shadow-2xs">
                                          <span>미제출 (등록하기)</span>
                                        </span>
                                      ) : (
                                        <span className="text-[10px] text-slate-400 font-medium">제출불가</span>
                                      )
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="p-5 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/50 space-y-3">
                          <HelpCircle className="w-8 h-8 text-indigo-400 mx-auto animate-bounce duration-1000" />
                          <h4 className="font-semibold text-xs text-slate-700">이름을 먼저 확인해 주세요</h4>
                          <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
                            본인의 연수 이수 상태 및 상세 현황을 모아보기 위해,<br />왼쪽 <strong className="text-indigo-600">"1단계: 교직원 성명 확인"</strong>에 이름을 기재하고 먼저 인증하십시오.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>

              {/* School-wide Real-time Compilation Status Dashboard Section */}
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 space-y-5 animate-in fade-in duration-300 mt-6" id="school-dashboard-section">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                      <span className="w-1.5 h-3.5 bg-indigo-600 rounded"></span>
                      <span>🏫 진주고등학교 이수증 취합 실시간 종합 현황판</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      각 연수별 전체 교직원의 제출 현황을 확인하고 서로 독려할 수 있는 실시간 현황판입니다.
                    </p>
                  </div>
                  
                  {/* Switch to detailed Tab button */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-xs text-indigo-600 bg-indigo-50 hover:bg-indigo-150 font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Layers className="w-4 h-4" />
                    <span>상세 대시보드(명렬표) 전체보기</span>
                  </button>
                </div>

                {/* Grid for small summary stats per course */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topics.map(topic => {
                    const eligibleRoster = roster.filter(r => !topic.targets || topic.targets.includes(r.id));
                    const totalCount = eligibleRoster.length;
                    const topicSubmissions = getSubmissionsForTopic(topic.id);
                    const subbedCount = topicSubmissions.length;
                    const rate = totalCount > 0 ? Math.round((subbedCount / totalCount) * 100) : 0;
                    
                    return (
                      <div key={topic.id} className="border border-slate-100 hover:border-slate-200 rounded-2xl p-4.5 bg-slate-50/40 hover:bg-white transition-all space-y-3.5 shadow-2xs flex flex-col justify-between">
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-start gap-1">
                            <h4 className="text-xs font-bold text-slate-800 line-clamp-1">{topic.title}</h4>
                            <span className="text-[9px] bg-slate-200 border border-slate-300/40 text-slate-600 px-1.5 py-0.5 rounded font-bold shrink-0">
                              ~ {formatDeadline(topic.deadline)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1 leading-normal">{topic.content}</p>
                          {topic.creator && (
                            <p className="text-[10px] text-indigo-500 font-semibold">담당: {topic.creator}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          {/* Progress bar info */}
                          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-500">
                            <span>이수율: <strong className="text-indigo-600">{rate}%</strong></span>
                            <span>({subbedCount}명 완료 / {totalCount}명 대상)</span>
                          </div>
                          <div className="w-full bg-slate-200/60 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ease-out ${
                                rate >= 100 
                                  ? 'bg-emerald-500' 
                                  : rate >= 80 
                                  ? 'bg-indigo-500' 
                                  : rate >= 40 
                                  ? 'bg-amber-500' 
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          
                          {/* Job status breakdown */}
                          <div className="flex justify-between text-[10px] text-slate-400 pt-2 font-medium border-t border-slate-100">
                            <span>교원: {topicSubmissions.filter(s => s.type === '교원').length}명</span>
                            <span>공무직: {topicSubmissions.filter(s => s.type === '교육공무직').length}명</span>
                            <span>일반직: {topicSubmissions.filter(s => s.type === '일반직').length}명</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Apps Script Guide tab */}
          {activeTab === 'setup-guide' && (
            <div className="space-y-6">
              {/* Sync Center Console */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Database className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-base leading-snug">📊 구글 스프레드시트 통합 동기화 센터</h3>
                    <p className="text-xs text-slate-400">구글 웹앱 연동 후 데이터를 업로드하거나 최신 시트의 수정사항을 내려받으세요.</p>
                  </div>
                </div>

                {!appsScriptUrl ? (
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3.5 items-start">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-amber-800 block">⚠️ 연동 전 로컬 데모 상태</span>
                      <p className="text-xs text-amber-700/95 leading-relaxed font-medium">
                        상점 헤더의 <strong className="text-amber-900">'로컬 기기 저장 모드'</strong> 버튼을 클릭하여 스프레드시트 API 주소(Web App URL)를 연동해주십시오.
                        연동된 주소가 등록되면 구글 드라이브 원격 서버로 모든 데이터를 실시간 기록하거나 기초 더미 데이터를 즉시 밀어넣을 수 있습니다!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Send to Sheet Card */}
                    <div className="border border-slate-150 rounded-xl p-4.5 bg-slate-50/40 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Upload className="w-4 h-4 text-indigo-600" />
                          <span>구글 시트로 로컬 전체 데이터 업로드</span>
                        </span>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          브라우저에 로드된 기본 교직원 명렬(70여명)과 기본 개설 연수(3개), 기존 샘플 제출 기록 전체를 본인의 새 구글 시트 데이터베이스로 자동 전송합니다. 
                          <strong>최초 연동 후 스프레드시트에 테스트 데이터를 가득 채우고 싶을 때 꼭 사용하세요!</strong>
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {isInitializingSheets && (
                          <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-lg text-[11px] text-indigo-700 flex items-center gap-2 font-medium animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 shrink-0" />
                            <span className="leading-snug">{initializeMessage}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleInitAndPushAllData}
                          disabled={isInitializingSheets}
                          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>구글 시트에 전체 데이터 생성하기 (초기 세팅용)</span>
                        </button>
                      </div>
                    </div>

                    {/* Pull from Sheet Card */}
                    <div className="border border-slate-150 rounded-xl p-4.5 bg-slate-50/40 flex flex-col justify-between gap-4">
                      <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>구글 시트에서 최신 데이터 가져오기 (내려받기)</span>
                        </span>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          구글 스프레드시트 원본을 직접 열어서 한글 이름을 수정하거나 부서/직종을 추가하셨나요? 
                          스프레드시트에 실시간 누적된 교직원 명단 및 최종 제출 현황을 내려받아 프론트엔드와 완벽 동기화합니다.
                        </p>
                      </div>

                      <div className="space-y-3 pt-2">
                        {isPullingData && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[11px] text-emerald-700 flex items-center gap-2 font-medium animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                            <span className="leading-snug">{pullMessage}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handlePullAllData}
                          disabled={isPullingData}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>구글 시트로부터 최신 정보 동기화 (다운로드)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <AppsScriptGuide />
            </div>
          )}

        </main>
      </div>

      <footer className="w-full bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400" id="footer-pane">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p>진주고등학교 연수 이수증 취합 관리 시스템 | 제작자: 박재현(@history_.p) | 개인정보가 포함된 웹페이지이니 유출에 유의해주세요.</p>
          <p className="text-[11px] font-mono text-slate-300">© 2026 Jinju High School. Copyright © 2026 All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
