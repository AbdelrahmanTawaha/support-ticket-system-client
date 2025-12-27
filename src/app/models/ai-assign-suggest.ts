export interface AiAssignSuggestResponseDto {
  suggestedEmployeeId: number | null;
  suggestedEmployeeName: string | null;
  confidence: number;
  reason: string;
  isFallback: boolean;
  warning: string | null;
}
