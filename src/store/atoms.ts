import { atom } from 'jotai';
import { DocInfo, DocumentSummary } from '../types'; // Import the DocInfo and DocumentSummary types

/**
 * Atom to store the ID of the currently selected document.
 * It will be null if no document is selected.
 */
export const selectedDocIdAtom = atom<string | null>(null);

/**
 * Atom to store the set of document IDs for which detailed info (like summary)
 * has already been fetched. This helps in fetching data only once.
 */
export const fetchedDocInfoIdsAtom = atom<Set<string>>(new Set<string>());

/**
 * Atom to store fetched summaries for documents, keyed by document ID.
 * Used primarily by LeftSidebar for the '소스 가이드' summary.
 */
export const docSummariesAtom = atom<Record<string, string>>({});

/**
 * Atom to store the full fetched document details (summary and deep_summary),
 * keyed by document ID. Used by RightSidebar for '문서 상세 요약'.
 */
export const docDetailsAtom = atom<Record<string, import('../types').DocumentDetail | null>>({});

/**
 * Atom to store the set of document IDs for which the "문서 상세 요약" button
 * has been explicitly clicked by the user in the RightSidebar.
 */
export const activatedBriefingIdsAtom = atom<Set<string>>(new Set<string>());

/**
 * Atom to store the document summary data received from the processDocument API.
 * It will be null initially.
 */
export const documentSummaryAtom = atom<DocumentSummary | null>(null);

/**
 * Atom to store the ID of the document whose detail view is open in the RightSidebar.
 * It will be null if no detail view is open.
 */
export const rightSidebarDetailDocIdAtom = atom<string | null>(null);
