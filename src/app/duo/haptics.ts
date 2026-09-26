let selection: UISelectionFeedbackGenerator | null = null;
let impact: UIImpactFeedbackGenerator | null = null;

/** Tactile feedback; the simulator produces none. */
export const haptics = {
  tick(): void {
    if (__APPLE__) {
      (selection ??= UISelectionFeedbackGenerator.new()).selectionChanged();
    }
  },
  tap(): void {
    if (__APPLE__) {
      (impact ??= UIImpactFeedbackGenerator.alloc().initWithStyle(UIImpactFeedbackStyle.Light)).impactOccurred();
    }
  },
};
