/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type EmployeeType = '교원' | '교육공무직' | '일반직';

export interface RosterItem {
  id: string;
  name: string;
  type: EmployeeType;
  department?: string; // e.g. 학년, 행정실 등
}

export interface TrainingTopic {
  id: string;
  title: string;
  content: string;
  deadline: string; // YYYY-MM-DD
  sheetCreated: boolean;
  createdAt: string;
  targets?: string[]; // list of roster IDs targeted for this training
  linkStatutorySubmissions?: boolean; // Whether to pull submissions from the statutory package
  creator?: string; // 담당자명
}

export interface Submission {
  id: string;
  topicId: string;
  name: string;
  type: EmployeeType;
  certNumber: string; // 이수번호
  certDate: string;   // 이수일자 (YYYY-MM-DD)
  hours: number;      // 이수시간
  method: 'direct' | 'pdf';
  fileName?: string;
  submittedAt: string;
  verified: boolean;
}

export interface SystemConfig {
  appsScriptUrl: string; // 구글 앱스 스크립트 웹앱 주소
  schoolName: string;
}
