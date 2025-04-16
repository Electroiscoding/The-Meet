<template>
  <div class="virtual-background-selector bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Virtual Background</h2>
    </div>
    
    <div class="p-4">
      <div class="grid grid-cols-3 gap-3">
        <div 
          v-for="background in virtualBackgrounds" 
          :key="background.id"
          @click="selectBackground(background)"
          class="aspect-video rounded-lg overflow-hidden cursor-pointer border-2"
          :class="{ 'border-primary': selectedBackground === background.id, 'border-transparent': selectedBackground !== background.id }"
        >
          <div 
            v-if="background.id === 'none'"
            class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-700"
          >
            <span class="text-gray-700 dark:text-gray-300">None</span>
          </div>
          
          <div 
            v-else-if="background.id === 'blur'"
            class="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-600 backdrop-blur"
          >
            <span class="text-gray-700 dark:text-gray-300">Blur</span>
          </div>
          
          <img 
            v-else
            :src="background.url"
            :alt="background.name"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div class="mt-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Custom Background
        </label>
        
        <div class="flex">
          <input
            type="file"
            accept="image/*"
            @change="handleFileUpload"
            class="hidden"
            ref="fileInput"
          />
          
          <button 
            @click="$refs.fileInput.click()"
            class="btn btn-outline flex-1"
          >
            Upload Image
          </button>
        </div>
      </div>
    </div>
    
    <div class="p-4 bg-gray-50 dark:bg-gray-700 flex justify-end">
      <button 
        @click="$emit('cancel')"
        class="btn btn-outline mr-2"
      >
        Cancel
      </button>
      
      <button 
        @click="applyBackground"
        class="btn btn-primary"
      >
        Apply
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { virtualBackgrounds } from '../utils/meetingFeatures'

const props = defineProps({
  currentBackground: {
    type: String,
    default: 'none'
  }
})

const emit = defineEmits(['apply', 'cancel'])

// State
const selectedBackground = ref(props.currentBackground)
const customBackgroundUrl = ref(null)
const fileInput = ref(null)

// Set initial background
onMounted(() => {
  selectedBackground.value = props.currentBackground
})

// Select a background
const selectBackground = (background) => {
  selectedBackground.value = background.id
}

// Handle file upload
const handleFileUpload = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  // Create a URL for the uploaded file
  customBackgroundUrl.value = URL.createObjectURL(file)
  
  // Create a custom background option
  const customBackground = {
    id: 'custom',
    name: 'Custom',
    url: customBackgroundUrl.value
  }
  
  // Add to backgrounds if not already present
  if (!virtualBackgrounds.find(bg => bg.id === 'custom')) {
    virtualBackgrounds.push(customBackground)
  } else {
    // Update existing custom background
    const index = virtualBackgrounds.findIndex(bg => bg.id === 'custom')
    virtualBackgrounds[index] = customBackground
  }
  
  // Select the custom background
  selectedBackground.value = 'custom'
}

// Apply the selected background
const applyBackground = () => {
  const background = virtualBackgrounds.find(bg => bg.id === selectedBackground.value)
  
  if (!background) return
  
  emit('apply', {
    id: background.id,
    url: background.url
  })
}
</script>
