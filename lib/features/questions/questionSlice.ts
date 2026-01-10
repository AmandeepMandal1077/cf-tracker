import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { UserQuestion } from "@/types";

interface QuestionState {
  questions: UserQuestion[];
  deletingQuestionIds: string[];
}

const initialState: QuestionState = {
  questions: [],
  deletingQuestionIds: [],
};

const questionSlice = createSlice({
  name: "questions",
  initialState,
  reducers: {
    setQuestionsInStore(state, action: PayloadAction<UserQuestion[]>) {
      state.questions = action.payload;
    },
    addQuestionToStoreBack(state, action: PayloadAction<UserQuestion>) {
      state.questions.push(action.payload);
    },
    addQuestionToStoreFront(state, action: PayloadAction<UserQuestion>) {
      state.questions.unshift(action.payload);
    },
    markQuestionAsDeleting(state, action: PayloadAction<string>) {
      if (!state.deletingQuestionIds.includes(action.payload)) {
        state.deletingQuestionIds.push(action.payload);
      }
    },
    removeQuestionFromStore(state, action: PayloadAction<string>) {
      state.questions = state.questions.filter(
        (q) => q.questionId !== action.payload
      );
      state.deletingQuestionIds = state.deletingQuestionIds.filter(
        (id) => id !== action.payload
      );
    },
    toggleBookmarkInQuestion(state, action: PayloadAction<string>) {
      const question = state.questions.find(
        (q) => q.questionId === action.payload
      );

      if (question) {
        question.bookmarked = !question.bookmarked;
      }
    },
  },
});

export const {
  setQuestionsInStore,
  addQuestionToStoreBack,
  addQuestionToStoreFront,
  markQuestionAsDeleting,
  removeQuestionFromStore,
  toggleBookmarkInQuestion,
} = questionSlice.actions;
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
export const selectIsQuestionDeleting = (
  state: { questions: QuestionState },
  questionId: string
) => state.questions.deletingQuestionIds.includes(questionId);
