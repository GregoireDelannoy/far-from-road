import { useRef } from "react";

import { AppState } from "./App";
import { StepButton, StepButtonProps } from "./StepButton";

interface ButtonSectionProps {
    onClickLoadFeatures: (ev: any) => void;
    onClickSearch: (ev: any) => void;
    appState: AppState;
}

function ButtonSection({ onClickLoadFeatures, onClickSearch, appState }: ButtonSectionProps) {
    const shapesButtonState = useRef<StepButtonProps>({actionable: false, isDone: false, current: true, text: '1-Draw on map', onClick: () => { } });
    const loadButtonState = useRef<StepButtonProps>({ actionable: false, isDone: false, current: false, text: '2-Load geo-features', onClick: onClickLoadFeatures });
    const searchButtonState = useRef<StepButtonProps>({ actionable: false, isDone: false, current: false, text: '3-Search!', onClick: onClickSearch });


    switch(appState) {
        case AppState.SelectShapes:
            shapesButtonState.current = { ...shapesButtonState.current, actionable: false, isDone: false, current: true }
            loadButtonState.current = { ...loadButtonState.current, actionable: false, isDone: false, current: false };
            searchButtonState.current = { ...searchButtonState.current, actionable: false, isDone: false, current: false };
            break;
        case AppState.LoadFeatures:
            shapesButtonState.current = { ...shapesButtonState.current, actionable: false, isDone: true, current: false };
            loadButtonState.current = { ...loadButtonState.current, actionable: true, isDone: false, current: true };
            searchButtonState.current = { ...searchButtonState.current, actionable: false, isDone: false, current: false };
            break;
        case AppState.WaitFeatures:
            shapesButtonState.current = { ...shapesButtonState.current, actionable: false, isDone: true, current: false };
            loadButtonState.current = { ...loadButtonState.current, actionable: false, isDone: false, current: true };
            searchButtonState.current = { ...searchButtonState.current, actionable: false, isDone: false, current: false };
            break;
        case AppState.Search:
            shapesButtonState.current = { ...shapesButtonState.current, actionable: false, isDone: true, current: false };
            loadButtonState.current = { ...loadButtonState.current, actionable: false, isDone: true, current: false };
            searchButtonState.current = { ...searchButtonState.current, actionable: true, isDone: false, current: true };
            break;
        case AppState.WaitSearch:
            shapesButtonState.current = { ...shapesButtonState.current, actionable: false, isDone: true, current: false };
            loadButtonState.current = { ...loadButtonState.current, actionable: false, isDone: true, current: false };
            searchButtonState.current = { ...searchButtonState.current, actionable: false, isDone: false, current: true };
            break;
    }

    return (
        <>
            <StepButton {...shapesButtonState.current} />
            <StepButton {...loadButtonState.current} />
            <StepButton {...searchButtonState.current} />
        </>
    );
}

export default ButtonSection;