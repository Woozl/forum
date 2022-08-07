import DataLoader from 'dataloader';
import { User } from '../entities/User';

export const createUserLoader = () =>
  new DataLoader<number, User>(async (userIds) => {
    const users = await User.findByIds(userIds as number[]);

    // create an intermediary map to match id <-> user, ensuring
    // accurate ordering for return user array
    const userIdToUser = new Map<number, User>();
    users.forEach((user) => userIdToUser.set(user.id, user));

    return userIds.map((userId) => userIdToUser.get(userId)!);
  });
