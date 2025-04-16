<template>
  <div 
    class="annotation-tools"
    :class="{ 'active': isAnnotating }"
  >
    <div class="annotation-toolbar bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center space-x-2">
      <button 
        v-for="tool in tools" 
        :key="tool.name"
        @click="selectTool(tool.name)"
        class="p-2 rounded-md"
        :class="{ 
          'bg-primary-light text-white': currentTool === tool.name,
          'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600': currentTool !== tool.name
        }"
        :title="tool.title"
      >
        <component :is="tool.icon" class="h-5 w-5" />
      </button>
      
      <div class="divider h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
      
      <div class="color-group flex items-center space-x-1">
        <button 
          v-for="color in colors" 
          :key="color.value"
          @click="setColor(color.value)"
          class="w-6 h-6 rounded-full border-2"
          :class="{ 
            'border-primary-dark': currentColor === color.value,
            'border-transparent': currentColor !== color.value
          }"
          :style="{ backgroundColor: color.value }"
          :title="color.name"
        ></button>
      </div>
      
      <div class="divider h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
      
      <button 
        @click="clearAnnotations"
        class="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
        title="Clear annotations"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
      
      <button 
        @click="toggleAnnotation"
        class="p-2 rounded-md"
        :class="{ 
          'bg-red-500 text-white': isAnnotating,
          'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600': !isAnnotating
        }"
        :title="isAnnotating ? 'Stop annotating' : 'Start annotating'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <canvas 
      v-show="isAnnotating"
      ref="canvas" 
      class="annotation-canvas"
      @mousedown="startDrawing"
      @mousemove="draw"
      @mouseup="stopDrawing"
      @mouseleave="stopDrawing"
      @touchstart="handleTouchStart"
      @touchmove="handleTouchMove"
      @touchend="handleTouchEnd"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  targetElement: {
    type: HTMLElement,
    required: true
  }
})

const emit = defineEmits(['toggle'])

// Canvas refs
const canvas = ref(null)
const ctx = ref(null)

// Annotation state
const isAnnotating = ref(false)
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// Tool settings
const currentTool = ref('pen')
const currentColor = ref('#FF0000')
const currentSize = ref(3)

// Available tools
const tools = [
  { name: 'pen', title: 'Pen', icon: 'PenIcon' },
  { name: 'line', title: 'Line', icon: 'LineIcon' },
  { name: 'rectangle', title: 'Rectangle', icon: 'RectangleIcon' },
  { name: 'circle', title: 'Circle', icon: 'CircleIcon' },
  { name: 'arrow', title: 'Arrow', icon: 'ArrowIcon' },
  { name: 'text', title: 'Text', icon: 'TextIcon' },
]

// Available colors
const colors = [
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
]

// Initialize canvas
onMounted(() => {
  if (!canvas.value) return
  
  ctx.value = canvas.value.getContext('2d')
  
  // Set initial canvas size
  updateCanvasSize()
  
  // Listen for window resize
  window.addEventListener('resize', updateCanvasSize)
})

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', updateCanvasSize)
})

// Watch for annotation state changes
watch(isAnnotating, (value) => {
  emit('toggle', value)
  
  if (value) {
    updateCanvasSize()
  }
})

// Update canvas size to match target element
const updateCanvasSize = () => {
  if (!canvas.value || !props.targetElement) return
  
  const { width, height, top, left } = props.targetElement.getBoundingClientRect()
  
  canvas.value.width = width
  canvas.value.height = height
  canvas.value.style.top = `${top}px`
  canvas.value.style.left = `${left}px`
}

// Toggle annotation mode
const toggleAnnotation = () => {
  isAnnotating.value = !isAnnotating.value
}

// Select a tool
const selectTool = (tool) => {
  currentTool.value = tool
}

// Set the current color
const setColor = (color) => {
  currentColor.value = color
}

// Start drawing
const startDrawing = (e) => {
  isDrawing.value = true
  
  const { offsetX, offsetY } = e
  lastX.value = offsetX
  lastY.value = offsetY
  
  // For shapes, we'll start a new path
  if (['line', 'rectangle', 'circle', 'arrow'].includes(currentTool.value)) {
    // Save the canvas state for shape preview
    ctx.value.save()
  }
}

// Draw on the canvas
const draw = (e) => {
  if (!isDrawing.value) return
  
  const { offsetX, offsetY } = e
  
  ctx.value.lineJoin = 'round'
  ctx.value.lineCap = 'round'
  ctx.value.lineWidth = currentSize.value
  ctx.value.strokeStyle = currentColor.value
  
  if (currentTool.value === 'pen') {
    ctx.value.beginPath()
    ctx.value.moveTo(lastX.value, lastY.value)
    ctx.value.lineTo(offsetX, offsetY)
    ctx.value.stroke()
    
    lastX.value = offsetX
    lastY.value = offsetY
  } else if (['line', 'rectangle', 'circle', 'arrow'].includes(currentTool.value)) {
    // For shapes, we'll preview by redrawing on each move
    // Restore to the saved state (clear the preview)
    ctx.value.restore()
    ctx.value.save()
    
    // Draw the shape preview
    ctx.value.beginPath()
    
    if (currentTool.value === 'line') {
      ctx.value.moveTo(lastX.value, lastY.value)
      ctx.value.lineTo(offsetX, offsetY)
      ctx.value.stroke()
    } else if (currentTool.value === 'rectangle') {
      const width = offsetX - lastX.value
      const height = offsetY - lastY.value
      ctx.value.strokeRect(lastX.value, lastY.value, width, height)
    } else if (currentTool.value === 'circle') {
      const radius = Math.sqrt(
        Math.pow(offsetX - lastX.value, 2) + Math.pow(offsetY - lastY.value, 2)
      )
      ctx.value.arc(lastX.value, lastY.value, radius, 0, Math.PI * 2)
      ctx.value.stroke()
    } else if (currentTool.value === 'arrow') {
      drawArrow(lastX.value, lastY.value, offsetX, offsetY)
    }
  }
}

// Draw an arrow
const drawArrow = (fromX, fromY, toX, toY) => {
  const headLength = 15
  const angle = Math.atan2(toY - fromY, toX - fromX)
  
  // Draw the line
  ctx.value.beginPath()
  ctx.value.moveTo(fromX, fromY)
  ctx.value.lineTo(toX, toY)
  ctx.value.stroke()
  
  // Draw the arrow head
  ctx.value.beginPath()
  ctx.value.moveTo(toX, toY)
  ctx.value.lineTo(
    toX - headLength * Math.cos(angle - Math.PI / 6),
    toY - headLength * Math.sin(angle - Math.PI / 6)
  )
  ctx.value.lineTo(
    toX - headLength * Math.cos(angle + Math.PI / 6),
    toY - headLength * Math.sin(angle + Math.PI / 6)
  )
  ctx.value.closePath()
  ctx.value.fillStyle = currentColor.value
  ctx.value.fill()
}

// Stop drawing
const stopDrawing = () => {
  if (!isDrawing.value) return
  
  isDrawing.value = false
  
  // For shapes, we need to finalize the drawing
  if (['line', 'rectangle', 'circle', 'arrow'].includes(currentTool.value)) {
    // Restore to the saved state (clear the preview)
    ctx.value.restore()
  }
}

// Handle touch events
const handleTouchStart = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvas.value.dispatchEvent(mouseEvent)
}

const handleTouchMove = (e) => {
  e.preventDefault()
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvas.value.dispatchEvent(mouseEvent)
}

const handleTouchEnd = (e) => {
  e.preventDefault()
  const mouseEvent = new MouseEvent('mouseup', {})
  canvas.value.dispatchEvent(mouseEvent)
}

// Clear all annotations
const clearAnnotations = () => {
  if (!canvas.value || !ctx.value) return
  
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

// Icons for tools
const PenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
)

const LineIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 20L20 4" />
  </svg>
)

const RectangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="1" stroke-width="2" />
  </svg>
)

const CircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <circle cx="12" cy="12" r="8" stroke-width="2" />
  </svg>
)

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
)

const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
)
</script>

<style scoped>
.annotation-tools {
  position: relative;
}

.annotation-toolbar {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
}

.annotation-canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 999;
  pointer-events: all;
}
</style>
