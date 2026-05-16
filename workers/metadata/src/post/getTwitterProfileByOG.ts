export function extractTwitterProfileByOpengraphTitle(title: string) {
    const [displayName, handle] = title.split(' ') as [string, string | undefined];
    const regex = /\(@([\w_]+)\)/;
    const matched = handle?.match(regex);

    return matched
        ? {
              displayName,
              handle: matched[1],
          }
        : {
              displayName,
              handle,
          };
}
