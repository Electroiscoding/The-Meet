<template>
  <div class="recording-controls">
    <button 
      v-if="!isRecording"
      @click="startRecording"
      class="btn flex items-center space-x-2"
      :class="{ 'btn-primary': !isRecording, 'btn-danger': isRecording }"
      :disabled="isLoading"
    >
      <span v-if="isLoading">Starting...</span>
      <template v-else>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="2" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
        <span>Start Recording</span>
      </template>
    </button>
    
    <button 
      v-else
      @click="stopRecording"
      class="btn btn-danger flex items-center space-x-2"
      :disabled="isLoading"
    >
      <span v-if="isLoading">Stopping...</span>
      <template v-else>
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="6" y="6" width="12" height="12" rx="1" fill="currentColor" />
        </svg>
        <span>Stop Recording</span>
      </template>
    </button>
    
    <div v-if="isRecording" class="recording-indicator flex items-center mt-2">
      <span class="recording-dot mr-2"></span>
      <span class="text-sm text-red-600 dark:text-red-400">Recording: {{ formattedDuration }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { startRecording as startRec, stopRecording as stopRec } from '../utils/meetingFeatures'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
})

// State
const isRecording = ref(false)
const isLoading = ref(false)
const recordingStartTime = ref(null)
const recordingDuration = ref(0)
const recordingInterval = ref(null)
let recordingUnsubscribe = null

// Computed properties
const formattedDuration = computed(() => {
  const totalSeconds = Math.floor(recordingDuration.value / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
})

// Listen for recording status
onMounted(() => {
  const recordingRef = doc(db, 'meetings', props.meetingId, 'recordings', 'current')
  
  recordingUnsubscribe = onSnapshot(recordingRef, (doc) => {
    if (doc.exists() && doc.data().active) {
      isRecording.value = true
      recordingStartTime.value = doc.data().startedAt?.toDate() || new Date()
      
      // Start the timer
      startTimer()
    } else {
      isRecording.value = false
      stopTimer()
    }
  })
})

// Clean up
onUnmounted(() => {
  if (recordingUnsubscribe) {
    recordingUnsubscribe()
  }
  
  stopTimer()
})

// Start the recording
const startRecording = async () => {
  if (isLoading.value || isRecording.value) return
  
  try {
    isLoading.value = true
    await startRec(props.meetingId, props.userId)
  } catch (error) {
    console.error('Error starting recording:', error)
  } finally {
    isLoading.value = false
  }
}

// Stop the recording
const stopRecording = async () => {
  if (isLoading.value || !isRecording.value) return
  
  try {
    isLoading.value = true
    await stopRec(props.meetingId, props.userId)
  } catch (error) {
    console.error('Error stopping recording:', error)
  } finally {
    isLoading.value = false
  }
}

// Start the timer
const startTimer = () => {
  // Clear any existing interval
  stopTimer()
  
  // Update duration immediately
  updateDuration()
  
  // Start interval to update duration every second
  recordingInterval.value = setInterval(updateDuration, 1000)
}

// Stop the timer
const stopTimer = () => {
  if (recordingInterval.value) {
    clearInterval(recordingInterval.value)
    recordingInterval.value = null
  }
}

// Update the recording duration
const updateDuration = () => {
  if (!recordingStartTime.value) return
  
  recordingDuration.value = Date.now() - recordingStartTime.value.getTime()
}
</script>

<style scoped>
.recording-dot {
  width: 10px;
  height: 10px;
  background-color: #ef4444;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 1;
  }
}
</style>
