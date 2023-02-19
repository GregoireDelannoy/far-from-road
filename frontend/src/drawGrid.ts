import { PNG } from 'pngjs/browser';
import { Grid } from './searchFarthestPoint.worker';

enum Color {
    BLACK,
    BLUE,
    RED,
}

function getColors(color: Color): [number, number, number] {
    switch (color) {
        case Color.BLACK:
            return [0, 0, 0];
        case Color.BLUE:
            return [0, 0, 255];
        case Color.RED:
            return [255, 0, 0];
        default:
            return [0, 0, 0];
    }
}

function paintPoint(data: Buffer, x: number, i: number, j: number, color: Color) {
    const colorRgb = getColors(color);
    const idx = (j * x + i) << 2;
    data[idx] = colorRgb[0];
    data[idx + 1] = colorRgb[1];
    data[idx + 2] = colorRgb[2];
    data[idx + 3] = 196;
}

function gridToPng(grid: Grid) {
    const png = new PNG({
        colorType: 0,
        width: grid.dimensions.x,
        height: grid.dimensions.y,
        filterType: -1
    });

    for (let i = 0; i < grid.dimensions.x; i++) {
        for (let j = 0; j < grid.dimensions.y; j++) {
            if (grid.data[i][j].hasRoad > 0) {
                paintPoint(png.data, grid.dimensions.x, i, j, Color.BLACK);
            } else if (!grid.data[i][j].isLand) {
                paintPoint(png.data, grid.dimensions.x, i, j, Color.BLUE);
            } else if (!grid.data[i][j].withinBounds) {
                paintPoint(png.data, grid.dimensions.x, i, j, Color.RED);
            }
        }
    }

    return PNG.sync.write(png);
}

export { gridToPng };