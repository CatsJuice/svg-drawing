<script setup lang="ts">
import { useLayers } from '../composables/layers'
import type { ImageLayer } from '../composables/layers'

const {
  layers,
  selectedLayerId,
  isDialogOpen,
  addLayer,
  removeLayer,
  updateLayer,
  selectLayer,
  reorderLayers,
  setDialogOpen,
} = useLayers()

const open = ref(false)
const expandedLayerId = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Drag state for reordering
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

// Transform state for selected layer
const isDragging = ref(false)
const isResizing = ref(false)
const isRotating = ref(false)
const startPos = ref({ x: 0, y: 0 })
const startLayerState = ref({ x: 0, y: 0, scale: 1, rotation: 0, width: 0, height: 0 })
const startDistance = ref(0)

// Sync open state with global isDialogOpen
watch(open, (val) => {
  setDialogOpen(val)
})

// Sorted layers by zIndex (reversed for display - top layer first)
const sortedLayers = computed(() =>
  [...layers.value].sort((a, b) => b.zIndex - a.zIndex),
)

function toggleExpand(id: string) {
  expandedLayerId.value = expandedLayerId.value === id ? null : id
}

function onAddImage() {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    await addLayer(file)
    input.value = ''
  }
}

// Drag and drop for reordering
function onDragStart(index: number) {
  draggedIndex.value = index
}

function onDragOver(e: DragEvent, index: number) {
  e.preventDefault()
  dragOverIndex.value = index
}

function onDragEnd() {
  if (draggedIndex.value !== null && dragOverIndex.value !== null && draggedIndex.value !== dragOverIndex.value) {
    const newOrder = [...sortedLayers.value]
    const [removed] = newOrder.splice(draggedIndex.value, 1)
    newOrder.splice(dragOverIndex.value, 0, removed)
    // Reverse back and update zIndex
    reorderLayers(newOrder.reverse())
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

// Layer interaction handlers
function onLayerMouseDown(e: MouseEvent, layer: ImageLayer) {
  if (!isDialogOpen.value)
    return

  e.preventDefault()
  e.stopPropagation()
  selectLayer(layer.id)
  isDragging.value = true
  startPos.value = { x: e.clientX, y: e.clientY }
  startLayerState.value = {
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    width: layer.width,
    height: layer.height,
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onResizeMouseDown(e: MouseEvent, layer: ImageLayer) {
  e.preventDefault()
  e.stopPropagation()
  isResizing.value = true
  startPos.value = { x: e.clientX, y: e.clientY }
  startLayerState.value = {
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    width: layer.width,
    height: layer.height,
  }
  // Calculate initial distance from layer origin to mouse
  const dx = e.clientX - layer.x
  const dy = e.clientY - layer.y
  startDistance.value = Math.sqrt(dx * dx + dy * dy)

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onRotateMouseDown(e: MouseEvent, layer: ImageLayer) {
  e.preventDefault()
  e.stopPropagation()
  isRotating.value = true
  startPos.value = { x: e.clientX, y: e.clientY }
  startLayerState.value = {
    x: layer.x,
    y: layer.y,
    scale: layer.scale,
    rotation: layer.rotation,
    width: layer.width,
    height: layer.height,
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
}

function onMouseMove(e: MouseEvent) {
  const layer = layers.value.find(l => l.id === selectedLayerId.value)
  if (!layer)
    return

  const dx = e.clientX - startPos.value.x
  const dy = e.clientY - startPos.value.y

  if (isDragging.value) {
    updateLayer(layer.id, {
      x: startLayerState.value.x + dx,
      y: startLayerState.value.y + dy,
    })
  }
  else if (isResizing.value) {
    // Calculate current distance from layer origin to mouse
    const currentDx = e.clientX - layer.x
    const currentDy = e.clientY - layer.y
    const currentDistance = Math.sqrt(currentDx * currentDx + currentDy * currentDy)

    // Scale proportionally: new scale = initial scale * (current distance / initial distance)
    if (startDistance.value > 0) {
      const newScale = Math.max(0.05, startLayerState.value.scale * (currentDistance / startDistance.value))
      updateLayer(layer.id, { scale: newScale })
    }
  }
  else if (isRotating.value) {
    const centerX = layer.x + (layer.width * layer.scale) / 2
    const centerY = layer.y + (layer.height * layer.scale) / 2
    const startAngle = Math.atan2(startPos.value.y - centerY, startPos.value.x - centerX)
    const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX)
    const angleDelta = (currentAngle - startAngle) * (180 / Math.PI)
    updateLayer(layer.id, { rotation: startLayerState.value.rotation + angleDelta })
  }
}

function onMouseUp() {
  isDragging.value = false
  isResizing.value = false
  isRotating.value = false
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
}

function onBackgroundClick() {
  selectLayer(null)
}
</script>

<template>
  <Teleport to="body">
    <!-- Global Layer Container -->
    <div
      fixed inset-0 z-10
      :style="{ pointerEvents: isDialogOpen ? 'auto' : 'none' }"
      @click="onBackgroundClick"
    >
      <div
        v-for="layer in layers"
        :key="layer.id"
        absolute
        :style="{
          left: `${layer.x}px`,
          top: `${layer.y}px`,
          width: `${layer.width * layer.scale}px`,
          height: `${layer.height * layer.scale}px`,
          opacity: layer.opacity / 100,
          transform: `rotate(${layer.rotation}deg)`,
          zIndex: layer.zIndex,
          pointerEvents: isDialogOpen ? 'auto' : 'none',
          cursor: isDialogOpen ? 'move' : 'default',
        }"
        @mousedown="(e) => onLayerMouseDown(e, layer)"
        @click.stop
      >
        <img
          :src="layer.src"
          :alt="layer.name"
          draggable="false"
          h-full w-full select-none object-contain
        >
        <!-- Selection handles -->
        <template v-if="selectedLayerId === layer.id && isDialogOpen">
          <div
            border="2 dashed blue-500"
            pointer-events-none absolute inset-0
          />
          <!-- Resize handle -->
          <div
            absolute bottom--2 right--2 h-4 w-4 cursor-se-resize rounded-full bg-blue-500
            @mousedown="(e) => onResizeMouseDown(e, layer)"
            @click.stop
          />
          <!-- Rotate handle -->
          <div
            left="1/2"
            translate-x="-1/2"
            absolute top--6 h-4 w-4 cursor-grab rounded-full bg-green-500
            @mousedown="(e) => onRotateMouseDown(e, layer)"
            @click.stop
          />
        </template>
      </div>
    </div>

    <!-- Trigger Button -->
    <button
      fixed right-20 top-10 z-1000 rounded-2 hover:bg="gray/10" p1
      @click="open = true"
    >
      <div i-carbon:image />
    </button>
  </Teleport>

  <!-- Layer Manager Dialog -->
  <q-dialog
    v-model="open"
    position="right"

    full-height seamless maximized
    class="stroke-helper-dialog"
  >
    <div

      relative h-full min-w-280px flex flex-col bg-white shadow-xl
    >
      <!-- Header -->
      <div flex items-center justify-between p4 border-b="1 gray-200">
        <h3 text-lg font-semibold>
          Layers
        </h3>
        <button
          rounded-2 hover:bg="gray/10" p1
          @click="open = false"
        >
          <div i-carbon:close />
        </button>
      </div>

      <!-- Layer List -->
      <div flex-1 overflow-auto p2>
        <div
          v-for="(layer, index) in sortedLayers"
          :key="layer.id"
          mb2
          rounded-lg
          border="1 gray-200"
          :class="{
            'ring-2 ring-blue-500': selectedLayerId === layer.id,
            'opacity-50': draggedIndex === index,
            'border-blue-500': dragOverIndex === index,
          }"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragover="(e) => onDragOver(e, index)"
          @dragend="onDragEnd"
        >
          <!-- Layer Item Header -->
          <div
            flex cursor-pointer items-center gap-2 p2
            hover:bg="gray-100"
            @click="toggleExpand(layer.id)"
          >
            <!-- Drag Handle -->
            <div i-carbon:drag-vertical cursor-grab text-gray-400 />

            <!-- Thumbnail -->
            <div h-10 w-10 flex-shrink-0 overflow-hidden rounded bg-gray-100>
              <img
                :src="layer.src"
                :alt="layer.name"
                h-full w-full object-cover
              >
            </div>

            <!-- Layer Name -->
            <div flex-1 truncate text-sm>
              {{ layer.name }}
            </div>

            <!-- Opacity Badge -->
            <div text-xs text-gray-500>
              {{ layer.opacity }}%
            </div>

            <!-- Delete Button -->
            <button
              hover:bg="red-100"
              rounded p1 text-red-500
              @click.stop="removeLayer(layer.id)"
            >
              <div i-carbon:trash-can text-sm />
            </button>

            <!-- Expand Icon -->
            <div
              :class="expandedLayerId === layer.id ? 'rotate-180' : ''"
              transition-transform duration-200
            >
              <div i-carbon:chevron-down />
            </div>
          </div>

          <!-- Expanded Settings Panel -->
          <Transition name="slide">
            <div v-if="expandedLayerId === layer.id" p3 border-t="1 gray-200">
              <div flex items-center gap-2>
                <span w-20 text-sm text-gray-600>Opacity</span>
                <q-slider
                  :model-value="layer.opacity"
                  :min="0"
                  :max="100"
                  :step="1"
                  label
                  class="flex-1"
                  @update:model-value="(val) => updateLayer(layer.id, { opacity: val as number })"
                />
                <span w-10 text-right text-sm text-gray-500>{{ layer.opacity }}%</span>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Empty State -->
        <div
          v-if="layers.length === 0"
          flex="~ col center" gap-2 py-8 text-gray-400
        >
          <div i-carbon:image text-4xl />
          <span text-sm>No layers yet</span>
        </div>
      </div>

      <!-- Footer -->
      <div p4 border-t="1 gray-200">
        <button

          w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600
          @click="onAddImage"
        >
          <div i-carbon:add />
          <span>Add Image</span>
        </button>
        <input
          ref="fileInputRef"
          type="file"
          accept="image/*"
          hidden
          @change="onFileChange"
        >
      </div>
    </div>
  </q-dialog>
</template>

<style lang="scss">
.stroke-helper-dialog {
  .q-dialog__backdrop {
    background: transparent !important;
  }
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 100px;
}
</style>
