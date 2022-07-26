export const truncate = (
  str: string,
  clipLength: number,
  useWordBoundary: boolean
) => {
  if (str.length <= clipLength) {
    return str;
  }
  const subString = str.slice(0, clipLength - 1); // the original check
  return (
    (useWordBoundary
      ? subString.slice(0, subString.lastIndexOf(' '))
      : subString) + '…'
  );
};
