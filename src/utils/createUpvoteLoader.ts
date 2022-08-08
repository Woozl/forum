import DataLoader from 'dataloader';
import { Upvote } from '../entities/Upvote';

export const createUpvoteLoader = () =>
  new DataLoader<{ postId: number; userId: number }, Upvote | null>(
    async (keys) => {
      const upvotes = await Upvote.findByIds(keys as any);

      // create an intermediary map to match upvoteId <-> upvote,
      // ensuring accurate ordering for return Upvote array
      const upvoteIdToUpvote = new Map<string, Upvote>();
      upvotes.forEach((upvote) =>
        upvoteIdToUpvote.set(`${upvote.userId}|${upvote.postId}`, upvote)
      );

      return keys.map(
        (key) => upvoteIdToUpvote.get(`${key.userId}|${key.postId}`)!
      );
    }
  );
