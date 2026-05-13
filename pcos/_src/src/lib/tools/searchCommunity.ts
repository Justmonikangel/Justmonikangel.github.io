import communitySeed from '@/mocks/community.json';

export function searchCommunity(query: string) {
  return (communitySeed as Array<{ title: string; body: string }>).filter(
    (post) => post.title.includes(query) || post.body.includes(query),
  );
}
