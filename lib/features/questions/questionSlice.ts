import { createSlice } from "@reduxjs/toolkit";
import { UserQuestion } from "@/types";

interface QuestionState {
  questions: UserQuestion[];
}

const initialState: QuestionState = {
  questions: [],
};

const questionSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    setQuestions(state, action) {
      state.questions = action.payload;
    },
    addQuestion(state, action) {
      state.questions.push(action.payload);
    },
    removeQuestion(state, action) {
      state.questions = state.questions.filter(
        (q) => q.questionId !== action.payload
      );
    },
  },
});

export const { setQuestions, addQuestion, removeQuestion } =
  questionSlice.actions;
export default questionSlice.reducer;

export const selectQuestions = (state: { questions: QuestionState }) =>
  state.questions.questions;
export const selectQuestionById = (
  state: { questions: QuestionState },
  questionId: string
) => state.questions.questions.find((q) => q.questionId === questionId);
export const selectBookmarkedQuestions = (state: {
  questions: QuestionState;
}) => state.questions.questions.filter((q) => q.bookmarked);
