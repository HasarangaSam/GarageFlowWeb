import { api } from "./api";

export interface AIChatResponse {
  success: boolean;
  data: {
    answer: string;
  };
}

export const chatWithGarageFlowAI = async (
  message: string,
): Promise<string> => {
  const response = await api.post<AIChatResponse>("/ai/chat", {
    message,
  });

  return response.data.data.answer;
};
