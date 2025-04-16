<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-md mx-auto">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Join Meeting</h1>
        
        <div class="mb-4">
          <label for="meetingId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Meeting ID
          </label>
          <input
            id="meetingId"
            v-model="meetingId"
            type="text"
            placeholder="Enter meeting ID"
            class="input"
            required
          />
        </div>
        
        <div class="mb-4">
          <label for="userName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Name
          </label>
          <input
            id="userName"
            v-model="userName"
            type="text"
            placeholder="John Doe"
            class="input"
            required
          />
        </div>
        
        <div class="mb-6">
          <div class="flex items-center">
            <input
              id="audioEnabled"
              v-model="audioEnabled"
              type="checkbox"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label for="audioEnabled" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Enable microphone
            </label>
          </div>
          
          <div class="flex items-center mt-2">
            <input
              id="videoEnabled"
              v-model="videoEnabled"
              type="checkbox"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label for="videoEnabled" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Enable camera
            </label>
          </div>
        </div>
        
        <div class="flex justify-between">
          <button 
            @click="$router.push('/')" 
            class="btn btn-outline"
          >
            Cancel
          </button>
          
          <button 
            @click="joinMeeting" 
            class="btn btn-primary"
            :disabled="!meetingId.trim() || !userName.trim() || isJoining"
          >
            <span v-if="isJoining">Joining...</span>
            <span v-else>Join Meeting</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkMeeting } from '../firebase/meetings'
import { nanoid } from 'nanoid'

const router = useRouter()

// Form data
const meetingId = ref('')
const userName = ref(localStorage.getItem('userName') || '')
const audioEnabled = ref(true)
const videoEnabled = ref(true)
const isJoining = ref(false)

// Join the meeting
const joinMeeting = async () => {
  if (!meetingId.value.trim() || !userName.value.trim()) return
  
  try {
    isJoining.value = true
    
    // Check if the meeting exists
    const meetingExists = await checkMeeting(meetingId.value)
    
    if (!meetingExists) {
      alert('Meeting not found or has ended.')
      isJoining.value = false
      return
    }
    
    // Generate a user ID if not authenticated
    const userId = nanoid()
    
    // Save user name and preferences to local storage
    localStorage.setItem('userName', userName.value)
    localStorage.setItem('userId', userId)
    localStorage.setItem('audioEnabled', audioEnabled.value)
    localStorage.setItem('videoEnabled', videoEnabled.value)
    
    // Navigate to the meeting room
    router.push(`/meeting/${meetingId.value}`)
  } catch (error) {
    console.error('Error joining meeting:', error)
    alert('Failed to join meeting. Please try again.')
    isJoining.value = false
  }
}
</script>
