export interface ImageLayer {
  id: string
  name: string
  src: string
  opacity: number
  x: number
  y: number
  width: number
  height: number
  rotation: number
  scale: number
  zIndex: number
}

const layers = ref<ImageLayer[]>([])
const selectedLayerId = ref<string | null>(null)
const isDialogOpen = ref(false)

export function useLayers() {
  const selectedLayer = computed(() =>
    layers.value.find(l => l.id === selectedLayerId.value) || null,
  )

  function addLayer(file: File): Promise<ImageLayer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const src = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          const layer: ImageLayer = {
            id: `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            name: file.name,
            src,
            opacity: 50,
            x: 100,
            y: 100,
            width: img.width,
            height: img.height,
            rotation: 0,
            scale: 1,
            zIndex: layers.value.length,
          }
          layers.value.push(layer)
          resolve(layer)
        }
        img.onerror = reject
        img.src = src
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function removeLayer(id: string) {
    const index = layers.value.findIndex(l => l.id === id)
    if (index !== -1) {
      layers.value.splice(index, 1)
      if (selectedLayerId.value === id)
        selectedLayerId.value = null
      // Recompute zIndex
      layers.value.forEach((l, i) => l.zIndex = i)
    }
  }

  function updateLayer(id: string, updates: Partial<ImageLayer>) {
    const layer = layers.value.find(l => l.id === id)
    if (layer)
      Object.assign(layer, updates)
  }

  function selectLayer(id: string | null) {
    selectedLayerId.value = id
  }

  function reorderLayers(newOrder: ImageLayer[]) {
    layers.value = newOrder.map((l, i) => ({ ...l, zIndex: i }))
  }

  function setDialogOpen(open: boolean) {
    isDialogOpen.value = open
    if (!open)
      selectedLayerId.value = null
  }

  return {
    layers,
    selectedLayerId,
    selectedLayer,
    isDialogOpen,
    addLayer,
    removeLayer,
    updateLayer,
    selectLayer,
    reorderLayers,
    setDialogOpen,
  }
}
