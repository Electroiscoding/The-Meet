<template>
  <div 
    class="relative bg-black rounded-lg overflow-hidden shadow-lg"
    :class="{ 'aspect-video': aspectRatio === 'video' }"
  >
    <video
      ref="videoElement"
      :muted="muted"
      autoplay
      playsinline
      class="w-full h-full object-cover"
    ></video>
    
    <div v-if="showControls" class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <button 
            v-if="!isAudioMuted && !muted"
            @click="$emit('mute-audio')"
            class="text-white p-1 rounded hover:bg-gray-700 hover:bg-opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          
          <button 
            v-else
            @click="$emit('unmute-audio')"
            class="text-red-400 p-1 rounded hover:bg-gray-700 hover:bg-opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
            </svg>
          </button>
          
          <button 
            v-if="!isVideoOff"
            @click="$emit('disable-video')"
            class="text-white p-1 rounded hover:bg-gray-700 hover:bg-opacity-50 ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button 
            v-else
            @click="$emit('enable-video')"
            class="text-red-400 p-1 rounded hover:bg-gray-700 hover:bg-opacity-50 ml-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
            </svg>
          </button>
        </div>
        
        <div v-if="isScreenShare" class="text-white text-xs bg-gray-800 bg-opacity-75 px-2 py-1 rounded">
          Screen Share
        </div>
      </div>
    </div>
    
    <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
      {{ displayName }}{{ isAudioMuted ? ' (muted)' : '' }}
    </div>
    
    <div v-if="!hasVideo" class="absolute inset-0 flex items-center justify-center bg-gray-800">
      <div class="text-center">
        <div class="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
          <span class="text-2xl font-semibold text-white">{{ getInitials(displayName) }}</span>
        </div>
        <div class="mt-2 text-white">{{ displayName }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  stream: {
    type: MediaStream,
    default: null
  },
  displayName: {
    type: String,
    default: 'User'
  },
  muted: {
    type: Boolean,
    default: false
  },
  isAudioMuted: {
    type: Boolean,
    default: false
  },
  isVideoOff: {
    type: Boolean,
    default: false
  },
  isScreenShare: {
    type: Boolean,
    default: false
  },
  showControls: {
    type: Boolean,
    default: false
  },
  aspectRatio: {
    type: String,
    default: 'video', // 'video', 'square', etc.
  }
})

const emit = defineEmits(['mute-audio', 'unmute-audio', 'disable-video', 'enable-video'])

const videoElement = ref(null)
const hasVideo = ref(true)

// Set the stream to the video element
onMounted(() => {
  if (props.stream && videoElement.value) {
    videoElement.value.srcObject = props.stream
    checkVideoTracks()
  }
})

// Watch for stream changes
watch(() => props.stream, (newStream) => {
  if (newStream && videoElement.value) {
    videoElement.value.srcObject = newStream
    checkVideoTracks()
  } else {
    hasVideo.value = false
  }
})

// Check if the stream has video tracks
const checkVideoTracks = () => {
  if (props.stream) {
    const videoTracks = props.stream.getVideoTracks()
    hasVideo.value = videoTracks.length > 0 && videoTracks[0].enabled
  } else {
    hasVideo.value = false
  }
}

// Watch for video off state changes
watch(() => props.isVideoOff, (isOff) => {
  hasVideo.value = !isOff
})

// Get initials from name
const getInitials = (name) => {
  if (!name) return '?'
  
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2)
}
</script>
