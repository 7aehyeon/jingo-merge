import React, { useState } from 'react';
import { Copy, Check, ExternalLink, HelpCircle } from 'lucide-react';

export default function AppsScriptGuide() {
  const [copied, setCopied] = useState(false);

  const appsScriptCode = `/**
 * 진주고등학교 연수 취합 시스템 - 구글 앱스 스크립트 웹앱 코드 (수정본)
 * 
 * [설치 방법]
 * 1. 구글 드라이브에서 새 "구글 스프레드시트"를 생성합니다.
 * 2. 상단 메뉴 [확장 프로그램] -> [Apps Script]를 클릭합니다.
 * 3. 기존 코드를 모두 지우고 이 코드를 그대로 붙여넣습니다.
 * 4. 상단 [배포] 버튼 -> [새 배포]를 누릅니다.
 *    - 유형 선택: 웹 앱
 *    - 설명: 진주고 연수 취합 API
 *    - 다음 사용자 권한으로 실행: 나 (본인 계정) -> ★★반드시 설정해야 구글 시트 수정 및 Gemini API 호출 권한이 정상 유지됩니다.
 *    - 액세스 권한이 있는 사용자: "모든 사람(Anyone)" -> 교직원들이 로그인 과정 없이 이수증을 올리도록 필수로 설정합니다.
 * 5. 배포 완료 후 제공되는 "웹 앱 URL"을 복사하여 우리 웹앱의 '설정' 탭에 입력하세요.
 * 
 * [보안 위협 없는 제미나이 AI 자동 추출 (선택사항)]
 * - 깃허브 페이지 등에 정적 웹사이트(HTML/CSS/JS)로 배포하면 별도 Node.js 서버가 없어 AI 파싱 기능이 막힐 수 있습니다.
 * - 하지만 구글 앱스 스크립트에 제미나이 키를 안전하게 비공개 저장하면, 구글 백엔드 서버가 대신 AI 추출 처리를 해줍니다! (API 키는 사용자에게 노출되지 않음)
 * - 설정법: Apps Script 편집기 좌측 메뉴의 [톱니바퀴 ⚙️ 아이콘 (프로젝트 설정)] 클릭 -> 아래 [스크립트 속성 추가] 클릭
 *          -> 속성명(Key)에 "GEMINI_API_KEY", 값(Value)에 AI Studio에서 발급받은 API 키를 입력하고 저장해 주시면 연동이 완료됩니다!
 */

// [!] 최초 실행 승인 전용 테스트 함수
// Apps Script 편집기 상단에서 'testAuthorize'를 선택하고 '▶ 실행'을 누르면 에러 없이 안전하게 권한 승인이 완료됩니다!
function testAuthorize() {
  // 구글 시트 및 외부 API(Gemini) 호출 권한 승인을 강제로 유도하기 위해 두 서비스를 명시합니다.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dummyFetch = UrlFetchApp.getRequest("https://generativelanguage.googleapis.com/");
  Logger.log("구글 스프레드시트 및 외부 연동 권한 승인이 성공적으로 완료되었습니다!");
}

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 기본 설정 및 시트 확인
  setupSheets(ss);
  
  var responseData = { success: true };
  
  try {
    if (action === "getRoster") {
      var sheet = ss.getSheetByName("교직원명렬");
      var data = sheet.getDataRange().getValues();
      var roster = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) {
          roster.push({
            id: data[i][0],
            name: data[i][1],
            type: data[i][2],
            department: data[i][3] || ""
          });
        }
      }
      responseData.data = roster;
    } else if (action === "getTopics") {
      var sheet = ss.getSheetByName("연수목록");
      var data = sheet.getDataRange().getValues();
      var topics = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) {
          topics.push({
            id: data[i][0],
            title: data[i][1],
            content: data[i][2],
            deadline: data[i][3],
            sheetCreated: data[i][4] === true || data[i][4] === "true",
            createdAt: data[i][5]
          });
        }
      }
      responseData.data = topics;
    } else if (action === "getSubmissions") {
      var sheet = ss.getSheetByName("전체제출현황");
      var data = sheet.getDataRange().getValues();
      var submissions = [];
      for (var i = 1; i < data.length; i++) {
        if (data[i][0]) {
          submissions.push({
            id: data[i][0],
            topicId: data[i][1],
            name: data[i][2],
            type: data[i][3],
            certNumber: data[i][4],
            certDate: data[i][5],
            hours: Number(data[i][6] || 0),
            method: data[i][7],
            fileName: data[i][8] || "",
            submittedAt: data[i][9],
            verified: data[i][10] === true || data[i][10] === "true"
          });
        }
      }
      responseData.data = submissions;
    } else {
      responseData.success = false;
      responseData.error = "알 수 없는 요청(Action)입니다.";
    }
  } catch (error) {
    responseData.success = false;
    responseData.error = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  setupSheets(ss);
  
  var responseData = { success: true };
  
  try {
    var postData;
    if (e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    } else {
      throw new Error("전송된 데이터가 비어있습니다.");
    }
    
    var action = postData.action;
    
    if (action === "saveRoster") {
      var sheet = ss.getSheetByName("교직원명렬");
      sheet.clearContents();
      sheet.appendRow(["ID", "성명", "구분", "소속/부서"]);
      
      var list = postData.roster;
      for (var i = 0; i < list.length; i++) {
        sheet.appendRow([list[i].id, list[i].name, list[i].type, list[i].department || ""]);
      }
      responseData.message = "교직원 명렬 저장 완료 (" + list.length + "명)";
      
    } else if (action === "createTopic") {
      var sheet = ss.getSheetByName("연수목록");
      var topic = postData.topic;
      
      sheet.appendRow([
        topic.id,
        topic.title,
        topic.content,
        topic.deadline,
        "true", // sheetCreated
        topic.createdAt
      ]);
      
      // 연수별 시트 자동 추가 기능 ★★
      var newSheetName = topic.title.length > 25 ? topic.title.substring(0, 25) + "..." : topic.title;
      // 특수 기호나 슬래시 등 시트 이름에 제외해야 할 문자 정제
      newSheetName = newSheetName.replace(/[:\\/?*[\\]]/g, "_");
      
      var targetSheet = ss.getSheetByName(newSheetName);
      if (targetSheet) {
        ss.deleteSheet(targetSheet); // 이미 존재하면 초기화
      }
      targetSheet = ss.insertSheet(newSheetName);
      targetSheet.appendRow(["제출일시", "연구명", "성명", "종류", "이수번호", "이수일자", "이수시간", "구분"]);
      
      // 행 스타일 추가설정
      targetSheet.getRange("A1:H1").setBackground("#f1f5f9").setFontWeight("bold");
      
      responseData.message = "신규 연수 개설 및 개별 취합 시트('" + newSheetName + "') 생성 완료!";
      
    } else if (action === "submitCertificate") {
      var submissionsSheet = ss.getSheetByName("전체제출현황");
      var sub = postData.submission;
      
      // 1. 전체 현황에 기록 (동일 연수의 본인 기록 확인 후 갱신 또는 추가)
      var rows = submissionsSheet.getDataRange().getValues();
      var updateIndex = -1;
      for (var i = 1; i < rows.length; i++) {
        if (rows[i][1] === sub.topicId && rows[i][2] === sub.name) {
          updateIndex = i + 1; // 1-based index
          break;
        }
      }
      
      var rowData = [
        sub.id,
        sub.topicId,
        sub.name,
        sub.type,
        sub.certNumber,
        sub.certDate,
        sub.hours,
        sub.method,
        sub.fileName || "",
        sub.submittedAt,
        "true" // verified
      ];
      
      if (updateIndex > -1) {
        submissionsSheet.getRange(updateIndex, 1, 1, 11).setValues([rowData]);
      } else {
        submissionsSheet.appendRow(rowData);
      }
      
      // 2. 해당 연수 연동시트에 세부내용 추가/갱신
      var topicSheet = ss.getSheetByName(postData.topicTitle);
      if (!topicSheet) {
        // 혹시나 시트가 유실되었거나 이름이 다른 경우 생성
        var newSheetName = postData.topicTitle.replace(/[:\\/?*[\\]]/g, "_");
        topicSheet = ss.getSheetByName(newSheetName) || ss.insertSheet(newSheetName);
        topicSheet.appendRow(["제출일시", "연구명", "성명", "종류", "이수번호", "이수일자", "이수시간", "구분"]);
        topicSheet.getRange("A1:H1").setBackground("#f1f5f9").setFontWeight("bold");
      }
      
      var topicRows = topicSheet.getDataRange().getValues();
      var topicUpdateIndex = -1;
      for (var j = 1; j < topicRows.length; j++) {
        if (topicRows[j][2] === sub.name) { // 성명으로 중복 판단
          topicUpdateIndex = j + 1;
          break;
        }
      }
      
      var topicRowData = [
        sub.submittedAt,
        postData.topicTitle,
        sub.name,
        sub.type,
        sub.certNumber,
        sub.certDate,
        sub.hours + "시간",
        sub.method === "pdf" ? "PDF 자동추출" : "직접 성명등록"
      ];
      
      if (topicUpdateIndex > -1) {
        topicSheet.getRange(topicUpdateIndex, 1, 1, 8).setValues([topicRowData]);
      } else {
        topicSheet.appendRow(topicRowData);
      }
      
      responseData.message = "이수증 취합 시트에 성공적으로 등록되었습니다.";
    } else if (action === "parsePdf") {
      // 구글 앱스 스크립트 실행 환경에서 보안 위반 걱정 없는 완전 서버리스 제미나이 판독 기능
      var apiKey = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
      if (!apiKey) {
        throw new Error("구글 Apps Script 프로젝트 설정(톱니바퀴) -> [스크립트 속성]에 'GEMINI_API_KEY' 항목을 이름표로 등록하고 구글에서 발급 받은 API 키를 저장해 주세요.");
      }
      
      var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey;
      var cleanBase = postData.fileBase64.replace(/^data:application\\/pdf;base64,/, "");
      
      var payloadData = {
        "contents": [{
          "parts": [
            {
              "inlineData": {
                "mimeType": "application/pdf",
                "data": cleanBase
              }
            },
            {
              "text": "이 이수증/수료증 PDF 파일의 텍스트와 레이아웃을 정밀하게 분석하여 다음 정보들을 추출해줘:\\n" +
                      "1. certNumber: 이수번호 혹은 등록번호\\n" +
                      "   - 보통 왼쪽 상단 또는 주변에 '제 경남교연-2026-443709 호'나 '제 2026-1234호'처럼 기재되어 있습니다.\\n" +
                      "   - 앞의 '제 '와 뒤의 ' 호'를 뺀 핵심 일련번호/식별자(예: \\\"경남교연-2026-443709\\\" 또는 \\\"2026-1234\\\")만 깔끔하게 추출해야 합니다. '제'나 '호'가 포함되지 않도록 알맹이만 정확히 반환해주세요.\\n" +
                      "2. certDate: 이수 완료일자 혹은 수료 날짜 (형식: \\\"YYYY-MM-DD\\\")\\n" +
                      "   - 이수증 하단 부근에 독립적으로 크게 적혀 있는 이수 완료/발급 날짜(예: \\\"2026년 5월 21일\\\")를 최우선으로 찾으세요.\\n" +
                      "   - 중간의 연수 기간(예: 2026.03.23.~2026.05.21.)이 있는 경우, 시작일이 아니라 반드시 **연수 마감일 또는 하단에 표기된 최종 수료일**이어야 합니다.\\n" +
                      "   - 날짜를 분석한 뒤 반드시 \\\"YYYY-MM-DD\\\" (예: \\\"2026-05-21\\\") 표준형식으로 변환하여 반환해주세요.\\n" +
                      "3. hours: 총 이수 시간 (정수 숫자값)\\n" +
                      "   - '이수시간 : 25시간 (1500분)'처럼 '시간'과 '분'이 모두 적혀있는 경우, 절대 괄호 안의 분(1500)을 선택하지 마세요.\\n" +
                      "   - 반드시 '시간' 단위를 의미하는 앞의 정수 숫자값(예: 25)만 추출해야 합니다. (분 단위를 반환하면 절대 안 됨!)\\n" +
                      "4. userName: 이수증에 수혜자로 표기된 교직원 성명 (예: \\\"박재현\\\")\\n" +
                      "5. trainingTitle: 연수 과정명 혹은 과정 이름"
            }
          ]
        }],
        "generationConfig": {
          "responseMimeType": "application/json",
          "responseSchema": {
            "type": "OBJECT",
            "properties": {
              "certNumber": { "type": "STRING" },
              "certDate": { "type": "STRING" },
              "hours": { "type": "INTEGER" },
              "userName": { "type": "STRING" },
              "trainingTitle": { "type": "STRING" }
            },
            "required": ["certNumber", "certDate"]
          }
        }
      };
      
      var options = {
        "method": "post",
        "contentType": "application/json",
        "payload": JSON.stringify(payloadData),
        "muteHttpExceptions": true
      };
      
      var response = UrlFetchApp.fetch(url, options);
      var responseCode = response.getResponseCode();
      var responseText = response.getContentText();
      
      if (responseCode !== 200) {
        throw new Error("Gemini API 서버 오류 (" + responseCode + "): " + responseText);
      }
      
      var resJson = JSON.parse(responseText);
      var systemText = resJson.candidates[0].content.parts[0].text;
      responseData.data = JSON.parse(systemText);
    } else {
      responseData.success = false;
      responseData.error = "알 수 없는 명령(Action)입니다.";
    }
  } catch (error) {
    responseData.success = false;
    responseData.error = error.toString();
  }
  
  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

// 필요한 기본 시트들이 누락된 경우 생성
function setupSheets(ss) {
  var sheetNames = ["교직원명렬", "연수목록", "전체제출현황"];
  var headers = [
    ["ID", "성명", "구분", "소속/부서"],
    ["ID", "연수명", "상세내용", "마감기한", "시트생성여부", "등록일시"],
    ["ID", "연수ID", "성명", "구분", "이수번호", "이수일자", "이수시간", "제출방식", "파일명", "제출일시", "검증여부"]
  ];
  
  for (var i = 0; i < sheetNames.length; i++) {
    var s = ss.getSheetByName(sheetNames[i]);
    if (!s) {
      s = ss.insertSheet(sheetNames[i]);
      s.appendRow(headers[i]);
      s.getRange("A1:" + String.fromCharCode(65 + headers[i].length - 1) + "1")
       .setBackground("#f8fafc")
       .setFontWeight("bold");
    }
  }
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1 flex-1">
            <h3 className="font-semibold text-slate-800 text-lg">구글 시트 & 앱스 스크립트(Apps Script) 연동 가이드</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              본 웹앱은 독립적인 프론트엔드로 배포될 수 있도록 설계되었습니다. 학교의 소중한 연수 정보가 안전하게 구글 스프레드시트에 저장되며, 이수증 취합 목록을 생성할 때마다 <strong>스프레드시트에 해당 연수 이름의 상세 취합 시트가 실시간 자동 생성</strong>됩니다.
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          <h4 className="font-medium text-slate-700 mb-3">연동 5단계 요약:</h4>
          <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600 ml-1">
            <li>
              구글 드라이브에서 <strong>새 구글 스프레드시트</strong>를 만듭니다.
            </li>
            <li>
              상단 메뉴에서 <strong className="text-indigo-600">확장 프로그램 &gt; Apps Script</strong>를 실행합니다.
            </li>
            <li>
              기존 코드를 모두 삭제하고 아래의 <strong className="text-indigo-600">통합 API 서비스 코드</strong>를 통째로 붙여넣습니다.
            </li>
            <li>
              우측 상단 <strong>배포 &gt; 새 배포</strong>를 누르고, <strong>유형: 웹 앱</strong>, <strong>함수 실행자: 나</strong>, <strong>액세스 권한: 모든 사람(Anyone)</strong>으로 설정하여 배포합니다.
              <span className="block text-xs text-rose-500 ml-5 mt-0.5 mt-1">※ 교사들이 인증 부담없이 이수증을 제출하기 위해 액세스 권한은 반드시 '모든 사람'이어야 합니다.</span>
            </li>
            <li>
              완료 화면에 표시되는 <strong>웹 앱 URL 주소</strong>를 복사한 뒤, 이 웹앱 최상단 혹은 설정의 <strong className="bg-slate-100 px-1 border rounded text-xs">구글 앱스 스크립트 Web App URL</strong> 입력란에 붙여 넣으시면 실시간 동기화 데이터베이스로 즉시 전환됩니다!
            </li>
          </ol>
        </div>

        {/* 중요 문제 해결 가이드 */}
        <div className="mt-6 border-t border-rose-100 bg-rose-50/50 rounded-lg p-4 pt-4">
          <h4 className="font-bold text-rose-800 text-sm flex items-center gap-1.5 mb-2">
            ⚠️ "TypeError: Cannot read properties of undefined (reading 'parameter')" 에러 해결법
          </h4>
          <p className="text-xs text-rose-700 leading-relaxed mb-3">
            구글 Apps Script 편집기에서 <strong>doGet</strong> 또는 <strong>doPost</strong> 함수를 선택하고 실행하면, 실제 브라우저가 보낸 정보(parameter)가 없어 이 에러가 발생하는 것이 <strong>정상</strong>입니다. <br />
            하지만 에러와 상관없이 중간에 <strong>"권한 검토"</strong>를 거쳐 <strong className="font-bold">허용(Allow)</strong>을 완료하셨다면 <strong>권한 승인은 이미 완벽하게 완료된 상태</strong>입니다!
          </p>
          <div className="bg-white/80 rounded border border-rose-100 p-3 space-y-2 text-xs text-rose-950 leading-relaxed">
            <p className="font-bold text-rose-900"><strong>💡 에러 없이 깔끔하게 권한 승인 완료하기 (추천)</strong></p>
            <ol className="list-decimal list-inside space-y-1.5 ml-1">
              <li>코드를 복사하여 새로 붙여넣으셨다면, 상단 함수 선택 드롭다운에서 <strong className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded">testAuthorize</strong> 함수를 선택합니다.</li>
              <li>바로 왼쪽의 <strong className="text-indigo-600 font-bold">▶ 실행 (Run)</strong> 버튼을 클릭합니다.</li>
              <li>중간에 <strong>"권한 검토"</strong> 팝업이 뜨면 클릭한 뒤, 본인의 구글 계정을 선택합니다.</li>
              <li>"Google에서 이 앱을 검증하지 않았습니다" 경고창이 나타나면 좌측 하단의 <strong className="underline font-bold cursor-pointer">고급 (Advanced)</strong>을 클릭합니다.</li>
              <li>아래에 작게 표시되는 <strong className="underline text-indigo-600 font-bold cursor-pointer">진주고 연수 취합 API(으)로 이동(안전하지 않음)</strong>을 클릭한 후, <strong className="font-bold">허용 (Allow)</strong>을 클릭합니다.</li>
              <li>실행 로그에 "성공적으로 완료되었습니다!"가 뜨면 승인 완료입니다.</li>
              <li><strong>[마지막 필수 단계]</strong> 승인 후에는 항상 상단 메뉴의 <strong className="font-bold">배포 &gt; 배포 관리</strong>로 들어가 연필 아이콘(편집)을 누르고, 버전을 <strong className="text-indigo-600 font-bold">새 버전(New Version)</strong>으로 바꾼 뒤 <strong className="font-bold bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[10px]">배포</strong> 버튼을 눌러 업데이트 해주어야 적용됩니다!</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-xl overflow-hidden shadow-md border border-slate-800">
        <div className="flex justify-between items-center bg-slate-800 px-5 py-3 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-mono text-slate-400 ml-2">Google Apps Script API (Code.gs)</span>
          </div>
          <button
            onClick={handleCopy}
            id="gas-copy-btn"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-indigo-600 text-white rounded text-xs font-medium transition-all"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>복사 완료!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>전체 코드 복사</span>
              </>
            )}
          </button>
        </div>
        <div className="p-4 max-h-[400px] overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700">
          <pre>{appsScriptCode}</pre>
        </div>
      </div>
    </div>
  );
}
