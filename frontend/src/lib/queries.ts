'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api';
import { useRequireAuth } from './auth';
import type { AiSuggestion, DocumentDetail, DocumentSummary, Profile } from './types';

export const queryKeys = {
  profile: ['profile'] as const,
  documents: ['documents'] as const,
  document: (id: string) => ['documents', id] as const,
  skillSuggestions: ['skill-suggestions'] as const,
};

export function useProfile() {
  const ready = useRequireAuth();
  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: () => apiFetch<Profile>('/profile'),
    enabled: ready,
  });
}

export function useDocuments() {
  const ready = useRequireAuth();
  return useQuery({
    queryKey: queryKeys.documents,
    queryFn: () => apiFetch<DocumentSummary[]>('/documents'),
    enabled: ready,
  });
}

export function useDocument(id: string) {
  const ready = useRequireAuth();
  return useQuery({
    queryKey: queryKeys.document(id),
    queryFn: () => apiFetch<DocumentDetail>(`/documents/${id}`),
    enabled: ready && !!id,
  });
}

export function useSkillSuggestions() {
  const ready = useRequireAuth();
  return useQuery({
    queryKey: queryKeys.skillSuggestions,
    queryFn: () => apiFetch<AiSuggestion[]>('/profile/skills/suggested'),
    enabled: ready,
  });
}
