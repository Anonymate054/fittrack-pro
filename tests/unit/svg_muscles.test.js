import { describe, expect, it } from 'vitest';
import { renderMuscleSVG } from '../../src/components/svg_muscles.js';

const HIGHLIGHT = '#00e676';
const countHighlights = (svg) => svg.split(HIGHLIGHT).length - 1;

describe('renderMuscleSVG', () => {
  it('no resalta nada sin grupo muscular', () => {
    expect(countHighlights(renderMuscleSVG())).toBe(0);
  });

  it.each([
    ['PECHO', 1],
    ['Espalda (dorsal)', 2],
    ['BÍCEPS', 2],
    ['Tríceps', 2],
    ['Glúteo y pierna', 4]
  ])('resalta "%s" ignorando acentos y mayúsculas', (group, expected) => {
    expect(countHighlights(renderMuscleSVG(group))).toBe(expected);
  });
});
