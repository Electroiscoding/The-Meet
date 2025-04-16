<template>
  <div class="h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
    <!-- Meeting header -->
    <div class="bg-white dark:bg-gray-800 shadow px-4 py-2 flex justify-between items-center">
      <div class="flex items-center">
        <h1 class="text-xl font-semibold text-gray-900 dark:text-white">{{ meetingName }}</h1>
        <div class="ml-4 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
          {{ meetingId }}
          <button 
            @click="copyMeetingId" 
            class="ml-1 text-primary hover:text-primary-dark"
            title="Copy meeting ID"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>
      <div class="flex items-center">
        <span class="text-sm text-gray-600 dark:text-gray-300 mr-2">
          {{ participants.length }} participant{{ participants.length !== 1 ? 's' : '' }}
        </span>
        <button 
          @click="leaveMeeting" 
          class="btn btn-outline text-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:text-red-400"
        >
          Leave
        </button>
      </div>
    </div>
    
    <!-- Meeting content -->
    <div class="flex-1 flex overflow-hidden">
      <!-- Video grid -->
      <div class="flex-1 p-4 overflow-auto">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Local video -->
          <div class="relative bg-black rounded-lg overflow-hidden shadow-lg aspect-video">
            <video
              ref="localVideo"
              :muted="true"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            ></video>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              You{{ isMicMuted ? ' (muted)' : '' }}
            </div>
          </div>
          
          <!-- Remote videos -->
          <div 
            v-for="(stream, peerId) in remoteStreams" 
            :key="peerId"
            class="relative bg-black rounded-lg overflow-hidden shadow-lg aspect-video"
          >
            <video
              :ref="el => { if (el) remoteVideoRefs[peerId] = el }"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            ></video>
            <div class="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {{ getParticipantName(peerId) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Chat panel -->
      <div 
        v-if="isChatOpen" 
        class="w-80 bg-white dark:bg-gray-800 shadow-lg flex flex-col border-l border-gray-200 dark:border-gray-700"
      >
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 class="font-semibold text-gray-900 dark:text-white">Chat</h2>
          <button 
            @click="isChatOpen = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="flex-1 p-3 overflow-y-auto" ref="chatMessages">
          <div 
            v-for="message in messages" 
            :key="message.id"
            class="mb-3"
          >
            <div class="flex items-start">
              <div 
                class="flex-1 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 text-sm"
                :class="{ 
                  'bg-primary-light text-white': message.userId === userId,
                  'ml-auto': message.userId === userId
                }"
              >
                <div class="font-semibold mb-1">
                  {{ message.userId === userId ? 'You' : message.userName }}
                </div>
                <div>{{ message.message }}</div>
              </div>
            </div>
            <div 
              class="text-xs text-gray-500 dark:text-gray-400 mt-1"
              :class="{ 'text-right': message.userId === userId }"
            >
              {{ formatTime(message.timestamp) }}
            </div>
          </div>
        </div>
        
        <div class="p-3 border-t border-gray-200 dark:border-gray-700">
          <form @submit.prevent="sendChatMessage" class="flex">
            <input
              v-model="chatMessage"
              type="text"
              placeholder="Type a message..."
              class="input flex-1 mr-2"
            />
            <button 
              type="submit"
              class="btn btn-primary"
              :disabled="!chatMessage.trim()"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
    
    <!-- Meeting controls -->
    <div class="bg-white dark:bg-gray-800 shadow-lg px-4 py-3 flex justify-center items-center space-x-4">
      <button 
        @click="toggleMic"
        class="p-3 rounded-full"
        :class="isMicMuted ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
      >
        <svg v-if="isMicMuted" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
      
      <button 
        @click="toggleCamera"
        class="p-3 rounded-full"
        :class="isCameraOff ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
      >
        <svg v-if="isCameraOff" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
        </svg>
        <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
      
      <button 
        @click="toggleScreenSharing"
        class="p-3 rounded-full"
        :class="isScreenSharing ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </button>
      
      <button 
        @click="isChatOpen = !isChatOpen"
        class="p-3 rounded-full"
        :class="isChatOpen ? 'bg-primary-light text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMeetingStore } from '../store/meetingStore'
import { WebRTCHandler } from '../utils/webrtc'
import { checkMeeting, sendMessage, listenForMessages, listenForParticipants } from '../firebase/meetings'

const route = useRoute()
const router = useRouter()
const meetingStore = useMeetingStore()

// Meeting info
const meetingId = ref(route.params.id)
const meetingName = ref('TheMeet Meeting')
const userId = ref(localStorage.getItem('userId') || '')
const userName = ref(localStorage.getItem('userName') || 'Anonymous')

// Video elements
const localVideo = ref(null)
const remoteVideoRefs = ref({})

// WebRTC
const webrtcHandler = ref(null)
const localStream = ref(null)
const remoteStreams = ref({})

// UI state
const isMicMuted = ref(false)
const isCameraOff = ref(false)
const isScreenSharing = ref(false)
const isChatOpen = ref(false)
const participants = ref([])
const messages = ref([])
const chatMessage = ref('')
const chatMessages = ref(null)

// Unsubscribe functions
let messagesUnsubscribe = null
let participantsUnsubscribe = null

// Initialize the meeting
onMounted(async () => {
  try {
    // Check if the meeting exists
    const meetingExists = await checkMeeting(meetingId.value)
    
    if (!meetingExists) {
      alert('Meeting not found or has ended.')
      router.push('/')
      return
    }
    
    // Initialize WebRTC
    webrtcHandler.value = new WebRTCHandler(
      meetingId.value,
      userId.value,
      handleRemoteStreamAdded,
      handleRemoteStreamRemoved,
      handleParticipantJoined,
      handleParticipantLeft
    )
    
    // Initialize local stream
    localStream.value = await webrtcHandler.value.initLocalStream()
    
    // Display local video
    if (localVideo.value) {
      localVideo.value.srcObject = localStream.value
    }
    
    // Join the meeting
    await webrtcHandler.value.joinMeeting()
    
    // Listen for messages
    messagesUnsubscribe = listenForMessages(meetingId.value, (newMessages) => {
      messages.value = newMessages
      scrollChatToBottom()
    })
    
    // Listen for participants
    participantsUnsubscribe = listenForParticipants(meetingId.value, (newParticipants) => {
      participants.value = newParticipants
    })
  } catch (error) {
    console.error('Error initializing meeting:', error)
    alert('Failed to join the meeting. Please try again.')
    router.push('/')
  }
})

// Clean up when leaving
onBeforeUnmount(() => {
  // Leave the meeting
  if (webrtcHandler.value) {
    webrtcHandler.value.leaveMeeting()
  }
  
  // Stop local stream
  if (localStream.value) {
    localStream.value.getTracks().forEach(track => track.stop())
  }
  
  // Unsubscribe from listeners
  if (messagesUnsubscribe) {
    messagesUnsubscribe()
  }
  
  if (participantsUnsubscribe) {
    participantsUnsubscribe()
  }
})

// Handle remote stream added
const handleRemoteStreamAdded = (peerId, stream) => {
  remoteStreams.value[peerId] = stream
  
  // Attach stream to video element in the next tick
  nextTick(() => {
    if (remoteVideoRefs.value[peerId]) {
      remoteVideoRefs.value[peerId].srcObject = stream
    }
  })
}

// Handle remote stream removed
const handleRemoteStreamRemoved = (peerId) => {
  delete remoteStreams.value[peerId]
}

// Handle participant joined
const handleParticipantJoined = (participant) => {
  console.log('Participant joined:', participant)
}

// Handle participant left
const handleParticipantLeft = (participantId) => {
  console.log('Participant left:', participantId)
}

// Toggle microphone
const toggleMic = () => {
  isMicMuted.value = !isMicMuted.value
  
  if (localStream.value) {
    localStream.value.getAudioTracks().forEach(track => {
      track.enabled = !isMicMuted.value
    })
  }
}

// Toggle camera
const toggleCamera = () => {
  isCameraOff.value = !isCameraOff.value
  
  if (localStream.value) {
    localStream.value.getVideoTracks().forEach(track => {
      track.enabled = !isCameraOff.value
    })
  }
}

// Toggle screen sharing
const toggleScreenSharing = async () => {
  try {
    isScreenSharing.value = !isScreenSharing.value
    
    if (webrtcHandler.value) {
      await webrtcHandler.value.toggleScreenSharing(isScreenSharing.value)
    }
  } catch (error) {
    console.error('Error toggling screen sharing:', error)
    isScreenSharing.value = false
  }
}

// Send a chat message
const sendChatMessage = async () => {
  if (!chatMessage.value.trim()) return
  
  try {
    await sendMessage(
      meetingId.value,
      userId.value,
      userName.value,
      chatMessage.value
    )
    
    chatMessage.value = ''
  } catch (error) {
    console.error('Error sending message:', error)
  }
}

// Copy meeting ID to clipboard
const copyMeetingId = () => {
  navigator.clipboard.writeText(meetingId.value)
    .then(() => {
      alert('Meeting ID copied to clipboard')
    })
    .catch(err => {
      console.error('Failed to copy meeting ID:', err)
    })
}

// Leave the meeting
const leaveMeeting = () => {
  router.push('/')
}

// Get participant name
const getParticipantName = (participantId) => {
  const participant = participants.value.find(p => p.id === participantId)
  return participant?.userName || 'Participant'
}

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

// Scroll chat to bottom
const scrollChatToBottom = () => {
  nextTick(() => {
    if (chatMessages.value) {
      chatMessages.value.scrollTop = chatMessages.value.scrollHeight
    }
  })
}

// Watch for new messages and scroll to bottom
watch(messages, () => {
  scrollChatToBottom()
})
</script>
