import { BoundingBox } from "./WorkerMessages";

interface Grid {
    dimensions: {
        x: number;
        y: number;
        increment: number;
    };
    data: { 
        hasRoad: number;
        isLand: boolean;
    }[][];
    furthestAway: null | { x: number; y: number; };
    bbox: BoundingBox;
    countRoadElements: number;
};

export { Grid }