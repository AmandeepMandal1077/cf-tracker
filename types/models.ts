// Types inferred from prisma/schema.prisma

export interface User {
  id: string;
  email: string;
  userHandle?: string | null;
  isSubscribed: boolean;
  subscriptionEnds?: string | Date | null;
}

export interface Questions {
  id: string;
  platform: string;
  name: string;
  link: string;
  rating?: number | null;
  tags: string[];
}

export interface UserQuestion {
  userId: string;
  questionId: string;
  verdict: string;
  bookmarked: boolean;
  createdAt: string | Date;
  // optional relation fields for convenience
  question?: Question;
}

export interface Question {
  id?: string;
  platform: string;
  name: string;
  link: string;
  rating?: string;
  tags?: string[];
  verdict: string;
  createdAt: string | Date;
  userId: string;
  bookmarked?: boolean;
  questionId?: string;
}
