<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-3xl mx-auto">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">Welcome to TheMeet</h1>
        <p class="text-xl text-gray-600 dark:text-gray-300">
          A modern web app for hosting seamless video meetings
        </p>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Start a New Meeting</h2>
        <div class="mb-4">
          <label for="meetingName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Meeting Name (optional)
          </label>
          <input
            id="meetingName"
            v-model="meetingName"
            type="text"
            placeholder="My Awesome Meeting"
            class="input"
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
        <button 
          @click="createNewMeeting" 
          class="btn btn-primary w-full"
          :disabled="!userName.trim()"
        >
          <span v-if="isCreating">Creating...</span>
          <span v-else>Start Meeting Now</span>
        </button>
      </div>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Join a Meeting</h2>
        <div class="mb-4">
          <label for="meetingId" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Meeting ID
          </label>
          <input
            id="meetingId"
            v-model="joinMeetingId"
            type="text"
            placeholder="Enter meeting ID"
            class="input"
            required
          />
        </div>
        <div class="mb-4">
          <label for="joinUserName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your Name
          </label>
          <input
            id="joinUserName"
            v-model="userName"
            type="text"
            placeholder="John Doe"
            class="input"
            required
          />
        </div>
        <button 
          @click="joinExistingMeeting" 
          class="btn btn-secondary w-full"
          :disabled="!joinMeetingId.trim() || !userName.trim()"
        >
          <span v-if="isJoining">Joining...</span>
          <span v-else>Join Meeting</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { createMeeting, checkMeeting } from '../firebase/meetings'
import { nanoid } from 'nanoid'

const router = useRouter()

// Form data
const meetingName = ref('')
const userName = ref('')
const joinMeetingId = ref('')

// Loading states
const isCreating = ref(false)
const isJoining = ref(false)

// Create a new meeting
const createNewMeeting = async () => {
  if (!userName.value.trim()) return
  
  try {
    isCreating.value = true
    
    // Generate a user ID if not authenticated
    const userId = nanoid()
    
    // Save user name to local storage
    localStorage.setItem('userName', userName.value)
    localStorage.setItem('userId', userId)
    
    // Create a new meeting
    const meetingId = await createMeeting(userId, meetingName.value)
    
    // Navigate to the meeting room
    router.push(`/meeting/${meetingId}`)
  } catch (error) {
    console.error('Error creating meeting:', error)
    alert('Failed to create meeting. Please try again.')
  } finally {
    isCreating.value = false
  }
}

// Join an existing meeting
const joinExistingMeeting = async () => {
  if (!joinMeetingId.value.trim() || !userName.value.trim()) return
  
  try {
    isJoining.value = true
    
    // Check if the meeting exists
    const meetingExists = await checkMeeting(joinMeetingId.value)
    
    if (!meetingExists) {
      alert('Meeting not found or has ended.')
      return
    }
    
    // Generate a user ID if not authenticated
    const userId = nanoid()
    
    // Save user name to local storage
    localStorage.setItem('userName', userName.value)
    localStorage.setItem('userId', userId)
    
    // Navigate to the meeting room
    router.push(`/meeting/${joinMeetingId.value}`)
  } catch (error) {
    console.error('Error joining meeting:', error)
    alert('Failed to join meeting. Please try again.')
  } finally {
    isJoining.value = false
  }
}
</script>
