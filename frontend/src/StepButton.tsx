interface StepButtonProps {
  actionable: boolean;
  isDone: boolean;
  current: boolean;
  text: string;
  onClick: (ev: any) => void;
}

function StepButton({ actionable, isDone, current, text, onClick }: StepButtonProps) {
  let classes = ['text-white', 'font-bold', 'py-2', 'px-4', 'rounded', 'min-w-[128px]', 'min-h-[56px]', 'border'];
  let disabled = null;

  if (isDone) {
    // Disabled + green
    classes.push('bg-[#50a060]');
    disabled = true;
  } else if (actionable) {
    // Enabled + blue
    classes.push('border-blue-700', 'bg-blue-500', 'hover:bg-blue-700');
    disabled = false;
  } else {
    // Disabled + blue
    classes.push('border-blue-700', 'bg-blue-500', 'cursor-not-allowed');
    disabled = true;
  }

  if (!current) {
    classes.push('opacity-70');
  }

  return (
    <button onClick={onClick} className={classes.join(' ')} disabled={disabled}>
      {text}
    </button>
  )
}

export {StepButton};