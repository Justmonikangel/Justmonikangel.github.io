export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  authorName: string;
  createdAt: string;
  tags: string[];
  commentCount: number;
}

export interface CommunityComment {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  createdAt: string;
}
