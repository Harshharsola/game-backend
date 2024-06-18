export interface questionsDto {
  question: string;
  options: { optionText: string; isCorrect: boolean }[];
}
