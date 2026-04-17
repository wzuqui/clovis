export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  email: string | null;
  is_approved: boolean;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  profiles: Profile;
  likes: { count: number }[];
  comments: { count: number }[];
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: Profile;
}
