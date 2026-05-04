export interface GenerateSummaryRequest {
  scope: 'portfolio' | 'project'
  projectId?: string
}

export interface GenerateSummaryResponse {
  content: string
  id: string
}
