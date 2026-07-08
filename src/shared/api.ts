export type InitResponse = {
  type: 'init';
  postId: string;
  username: string;
  highScore: number;
};

export type SubmitScoreResponse = {
  type: 'submit-score';
  postId: string;
  score: number;
  highScore: number;
};

export type SubmitScoreRequest = {
  score: number;
};
