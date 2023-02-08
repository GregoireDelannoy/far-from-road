import { PNG } from 'pngjs/browser';
import { Grid } from './WorkerInternalsInterface';

function paintPoint(data: Buffer, x: number, i: number, j: number, color: number) {
    var idx = (j * x + i) << 2
    data[idx] = color
    data[idx + 1] = color
    data[idx + 2] = color
    data[idx + 3] = 255
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
                paintPoint(png.data, grid.dimensions.x, i, j, 0)
            }
        }
    }

    return PNG.sync.write(png)
}

export { gridToPng };