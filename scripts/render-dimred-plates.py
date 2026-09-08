#!/usr/bin/env python3
"""Render the dimensional-reduction gallery covers without an artificial seam.

The left half is the central-plane odometer of the three-dimensional sandpile;
the right half is the independently computed two-dimensional odometer. Both
start at their critical height on a reflected orthant, with a sink at its outer
boundary. Their equality is checked before either cover is written.

Requires NumPy and Pillow. Run from any directory:
    python3 scripts/render-dimred-plates.py
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image


def stabilize(dimension, side):
    """Return the exact final odometer using only the current parallel round."""
    shape = (side,) * dimension
    heights = np.full(shape, 2 * dimension, dtype=np.int32)
    odometer = np.zeros(shape, dtype=np.int32)
    rounds = 0
    while True:
        firing = (heights >= 2 * dimension).astype(np.int32)
        if not firing.any():
            return odometer, rounds
        odometer += firing
        heights -= 2 * dimension * firing
        for axis in range(dimension):
            low = [slice(None)] * dimension
            high = [slice(None)] * dimension
            edge = [slice(None)] * dimension
            low[axis] = slice(None, -1)
            high[axis] = slice(1, None)
            edge[axis] = 0
            heights[tuple(low)] += firing[tuple(high)]
            heights[tuple(high)] += firing[tuple(low)]
            # A neighbor across the central plane is the site's reflection.
            heights[tuple(edge)] += firing[tuple(edge)]
        rounds += 1


def ramp(stops):
    """The gallery's original 256-entry, piecewise-linear color palette."""
    colors = np.array(
        [[int(color[i:i + 2], 16) for i in (1, 3, 5)] for color in stops],
        dtype=float,
    )
    positions = np.linspace(0, len(colors) - 1, 256)
    low = np.floor(positions).astype(int)
    high = np.minimum(low + 1, len(colors) - 1)
    weight = (positions - low)[:, None]
    return (colors[low] * (1 - weight) + colors[high] * weight).round().astype(np.uint8)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--side', type=int, default=64, help='Orthant side length.')
    parser.add_argument('--block', type=int, default=12, help='Pixels per lattice site.')
    args = parser.parse_args()
    if args.side < 2 or args.block < 1:
        parser.error('side must be at least 2 and block must be positive')

    cube, cube_rounds = stabilize(3, args.side)
    square, square_rounds = stabilize(2, args.side)
    central_plane = cube[:, :, 0]
    if not np.array_equal(central_plane, square):
        raise RuntimeError('Central-plane and square odometers differ.')
    print(f'Exact odometer equality: {square.size:,} sites; '
          f'{cube_rounds:,} cube rounds, {square_rounds:,} square rounds.')

    middle = args.side // 2
    joined = np.concatenate([central_plane[:, :middle], square[:, middle:]], axis=1)
    indices = (np.power(joined / joined.max(), 2.2) * 255).astype(np.uint8)
    palettes = {
        'paper': ['#F2EDE2', '#C9BFA8', '#A8D8E8', '#8E4257', '#15131A'],
        'void': ['#15131A', '#2E2436', '#4A4A5E', '#8E4257', '#C9BFA8', '#F6F1E6'],
    }
    output = Path(__file__).resolve().parents[1] / 'gallery' / 'plates'
    for name, stops in palettes.items():
        # No divider is painted: every pixel comes from the computed odometer.
        picture = Image.fromarray(ramp(stops)[indices], mode='RGB')
        size = args.side * args.block
        picture = picture.resize((size, size), Image.NEAREST)
        destination = output / f'p-dimred-wall-{name}.png'
        picture.save(destination, optimize=True)
        print(f'Wrote {destination.relative_to(output.parent.parent)} ({size} × {size}).')


if __name__ == '__main__':
    main()
