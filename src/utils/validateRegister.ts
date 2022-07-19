import { UserInputData } from '../resolvers/UserInputData';
import isValidEmail from './isValidEmail';

export default (options: UserInputData) => {
  if (!isValidEmail(options.email))
    return [
      {
        field: 'email',
        message: 'Invalid email.'
      }
    ];

  if (options.username.length <= 2)
    return [
      {
        field: 'username',
        message: 'Username must be 3 characters or greater.'
      }
    ];

  if (options.username.includes('@'))
    return [
      {
        field: 'username',
        message: "Username cannot include an '@' sign."
      }
    ];

  if (options.password.length <= 2)
    return [
      {
        field: 'password',
        message: 'Password must be 3 characters or greater.'
      }
    ];

  return null;
};
