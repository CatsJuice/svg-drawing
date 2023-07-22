export const canvasWidth = ref(800)
export const canvasHeight = ref(600)

export function updateCanvasWidth(w: number | any) {
  const min = 10
  const max = window.innerWidth - 20
  canvasWidth.value = Math.min(Math.max(w, min), max)
}

export function updateCanvasHeight(h: number | any) {
  const min = 10
  const max = window.innerHeight - 20
  canvasHeight.value = Math.min(Math.max(h, min), max)
}
export function useCanvas() {
  return {
    updateCanvasWidth,
    updateCanvasHeight,
    width: canvasWidth,
    height: canvasHeight,
  }
}
