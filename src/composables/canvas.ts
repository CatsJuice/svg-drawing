export const canvasWidth = ref(800)
export const canvasHeight = ref(600)

export function useCanvas() {
  return {
    width: canvasWidth,
    height: canvasHeight,
  }
}
