<template>
  <div class="whiteboard-container bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="whiteboard-toolbar p-2 bg-gray-100 dark:bg-gray-700 flex items-center space-x-2">
      <div class="tool-group flex items-center space-x-1">
        <button 
          v-for="tool in tools" 
          :key="tool.name"
          @click="setTool(tool.name)"
          class="p-2 rounded-md"
          :class="{ 
            'bg-primary-light text-white': currentTool === tool.name,
            'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600': currentTool !== tool.name
          }"
          :title="tool.title"
        >
          <component :is="tool.icon" class="h-5 w-5" />
        </button>
      </div>
      
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
      
      <div class="size-group flex items-center space-x-1">
        <button 
          v-for="size in sizes" 
          :key="size.value"
          @click="setSize(size.value)"
          class="p-2 rounded-md"
          :class="{ 
            'bg-primary-light text-white': currentSize === size.value,
            'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600': currentSize !== size.value
          }"
          :title="size.name"
        >
          <div 
            class="rounded-full bg-current" 
            :style="{ width: `${size.value}px`, height: `${size.value}px` }"
          ></div>
        </button>
      </div>
      
      <div class="divider h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>
      
      <div class="action-group flex items-center space-x-1">
        <button 
          @click="clearCanvas"
          class="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          title="Clear whiteboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <button 
          @click="saveCanvas"
          class="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
          title="Save whiteboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </button>
      </div>
    </div>
    
    <div class="whiteboard-canvas-container relative" ref="canvasContainer">
      <canvas 
        ref="canvas" 
        class="whiteboard-canvas absolute top-0 left-0 w-full h-full cursor-crosshair"
        @mousedown="startDrawing"
        @mousemove="draw"
        @mouseup="stopDrawing"
        @mouseleave="stopDrawing"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      ></canvas>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { saveWhiteboardData } from '../utils/meetingFeatures'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  },
  readOnly: {
    type: Boolean,
    default: false
  },
  initialData: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['update:data'])

// Canvas refs
const canvas = ref(null)
const canvasContainer = ref(null)
const ctx = ref(null)

// Drawing state
const isDrawing = ref(false)
const lastX = ref(0)
const lastY = ref(0)

// Tool settings
const currentTool = ref('pen')
const currentColor = ref('#000000')
const currentSize = ref(3)

// Available tools
const tools = [
  { name: 'pen', title: 'Pen', icon: 'PenIcon' },
  { name: 'line', title: 'Line', icon: 'LineIcon' },
  { name: 'rectangle', title: 'Rectangle', icon: 'RectangleIcon' },
  { name: 'circle', title: 'Circle', icon: 'CircleIcon' },
  { name: 'eraser', title: 'Eraser', icon: 'EraserIcon' },
  { name: 'text', title: 'Text', icon: 'TextIcon' },
]

// Available colors
const colors = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Yellow', value: '#FFFF00' },
]

// Available sizes
const sizes = [
  { name: 'Small', value: 2 },
  { name: 'Medium', value: 5 },
  { name: 'Large', value: 10 },
]

// Initialize canvas
onMounted(() => {
  if (!canvas.value) return
  
  ctx.value = canvas.value.getContext('2d')
  
  // Set canvas size to match container
  resizeCanvas()
  
  // Listen for window resize
  window.addEventListener('resize', resizeCanvas)
  
  // Load initial data if provided
  if (props.initialData) {
    loadCanvasData(props.initialData)
  }
})

// Clean up event listeners
onUnmounted(() => {
  window.removeEventListener('resize', resizeCanvas)
})

// Resize canvas to match container
const resizeCanvas = () => {
  if (!canvas.value || !canvasContainer.value) return
  
  const { width, height } = canvasContainer.value.getBoundingClientRect()
  
  canvas.value.width = width
  canvas.value.height = height
}

// Set the current tool
const setTool = (tool) => {
  currentTool.value = tool
}

// Set the current color
const setColor = (color) => {
  currentColor.value = color
}

// Set the current size
const setSize = (size) => {
  currentSize.value = size
}

// Start drawing
const startDrawing = (e) => {
  if (props.readOnly) return
  
  isDrawing.value = true
  
  const { offsetX, offsetY } = e
  lastX.value = offsetX
  lastY.value = offsetY
  
  // For shapes, we'll start a new path
  if (['line', 'rectangle', 'circle'].includes(currentTool.value)) {
    // Save the canvas state for shape preview
    ctx.value.save()
  }
}

// Draw on the canvas
const draw = (e) => {
  if (!isDrawing.value || props.readOnly) return
  
  const { offsetX, offsetY } = e
  
  ctx.value.lineJoin = 'round'
  ctx.value.lineCap = 'round'
  ctx.value.lineWidth = currentSize.value
  
  if (currentTool.value === 'eraser') {
    ctx.value.strokeStyle = '#FFFFFF'
    ctx.value.globalCompositeOperation = 'destination-out'
  } else {
    ctx.value.strokeStyle = currentColor.value
    ctx.value.globalCompositeOperation = 'source-over'
  }
  
  if (currentTool.value === 'pen' || currentTool.value === 'eraser') {
    ctx.value.beginPath()
    ctx.value.moveTo(lastX.value, lastY.value)
    ctx.value.lineTo(offsetX, offsetY)
    ctx.value.stroke()
    
    lastX.value = offsetX
    lastY.value = offsetY
  } else if (['line', 'rectangle', 'circle'].includes(currentTool.value)) {
    // For shapes, we'll preview by redrawing on each move
    // Restore to the saved state (clear the preview)
    ctx.value.restore()
    ctx.value.save()
    
    // Draw the shape preview
    ctx.value.beginPath()
    
    if (currentTool.value === 'line') {
      ctx.value.moveTo(lastX.value, lastY.value)
      ctx.value.lineTo(offsetX, offsetY)
    } else if (currentTool.value === 'rectangle') {
      const width = offsetX - lastX.value
      const height = offsetY - lastY.value
      ctx.value.rect(lastX.value, lastY.value, width, height)
    } else if (currentTool.value === 'circle') {
      const radius = Math.sqrt(
        Math.pow(offsetX - lastX.value, 2) + Math.pow(offsetY - lastY.value, 2)
      )
      ctx.value.arc(lastX.value, lastY.value, radius, 0, Math.PI * 2)
    }
    
    ctx.value.stroke()
  }
}

// Stop drawing
const stopDrawing = () => {
  if (!isDrawing.value) return
  
  isDrawing.value = false
  
  // For shapes, we need to finalize the drawing
  if (['line', 'rectangle', 'circle'].includes(currentTool.value)) {
    // Restore to the saved state (clear the preview)
    ctx.value.restore()
    
    // Draw the final shape
    ctx.value.beginPath()
    ctx.value.lineWidth = currentSize.value
    ctx.value.strokeStyle = currentColor.value
    
    if (currentTool.value === 'line') {
      ctx.value.moveTo(lastX.value, lastY.value)
      ctx.value.lineTo(lastX.value, lastY.value) // This will be updated in the next draw call
    } else if (currentTool.value === 'rectangle') {
      ctx.value.rect(lastX.value, lastY.value, 0, 0) // This will be updated in the next draw call
    } else if (currentTool.value === 'circle') {
      ctx.value.arc(lastX.value, lastY.value, 0, 0, Math.PI * 2) // This will be updated in the next draw call
    }
    
    ctx.value.stroke()
  }
  
  // Save the canvas data
  saveCanvasData()
}

// Handle touch events
const handleTouchStart = (e) => {
  if (props.readOnly) return
  
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvas.value.dispatchEvent(mouseEvent)
}

const handleTouchMove = (e) => {
  if (props.readOnly) return
  
  const touch = e.touches[0]
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  })
  canvas.value.dispatchEvent(mouseEvent)
}

const handleTouchEnd = () => {
  if (props.readOnly) return
  
  const mouseEvent = new MouseEvent('mouseup', {})
  canvas.value.dispatchEvent(mouseEvent)
}

// Clear the canvas
const clearCanvas = () => {
  if (props.readOnly) return
  
  ctx.value.clearRect(0, 0, canvas.value.width, canvas.value.height)
  saveCanvasData()
}

// Save the canvas data
const saveCanvas = () => {
  if (!canvas.value) return
  
  // Create a download link
  const link = document.createElement('a')
  link.download = `whiteboard-${new Date().toISOString()}.png`
  link.href = canvas.value.toDataURL('image/png')
  link.click()
}

// Save canvas data to Firebase
const saveCanvasData = () => {
  if (!canvas.value || props.readOnly) return
  
  const data = canvas.value.toDataURL()
  emit('update:data', data)
  
  // Save to Firebase if meeting ID is provided
  if (props.meetingId) {
    saveWhiteboardData(props.meetingId, data)
  }
}

// Load canvas data
const loadCanvasData = (data) => {
  if (!canvas.value || !ctx.value) return
  
  const img = new Image()
  img.onload = () => {
    ctx.value.drawImage(img, 0, 0)
  }
  img.src = data
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

const EraserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

const TextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
  </svg>
)
</script>

<style scoped>
.whiteboard-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.whiteboard-canvas-container {
  flex: 1;
  min-height: 300px;
  position: relative;
  background-color: white;
}
</style>
