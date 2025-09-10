import { createCodeComponents } from './CodeComponents';
import { createHeadingComponents } from './HeadingComponents';
import { createTextComponents } from './TextComponents';
import { createListComponents } from './ListComponents';
import { createTableComponents } from './TableComponents';

export function createMarkdownComponents(codeFontFamily: string) {
  return {
    ...createCodeComponents(codeFontFamily),
    ...createHeadingComponents(),
    ...createTextComponents(),
    ...createListComponents(),
    ...createTableComponents(),
  };
}