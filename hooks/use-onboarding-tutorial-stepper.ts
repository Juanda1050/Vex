import { useMemo, useState } from "react";

interface UseOnboardingTutorialStepperArgs {
  total: number;
  onFinish: () => Promise<void>;
}

export function useOnboardingTutorialStepper({
  total,
  onFinish,
}: UseOnboardingTutorialStepperArgs) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);

  const isLast = useMemo(
    () => currentIndex === total - 1,
    [currentIndex, total],
  );

  function goPrev() {
    setCurrentIndex((idx) => Math.max(0, idx - 1));
  }

  function goNext() {
    setCurrentIndex((idx) => Math.min(total - 1, idx + 1));
  }

  function goTo(index: number) {
    setCurrentIndex(Math.min(total - 1, Math.max(0, index)));
  }

  async function finish() {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      await onFinish();
    } finally {
      setIsFinishing(false);
    }
  }

  return {
    currentIndex,
    isFinishing,
    isLast,
    goPrev,
    goNext,
    goTo,
    finish,
  };
}
