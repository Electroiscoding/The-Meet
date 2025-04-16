<template>
  <div class="breakout-rooms bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Breakout Rooms</h2>
    </div>
    
    <div v-if="isHost" class="p-4">
      <div v-if="!rooms.length">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Create breakout rooms to split participants into smaller groups.
        </p>
        
        <div class="mb-4">
          <label for="roomCount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Number of Rooms
          </label>
          <input
            id="roomCount"
            v-model.number="roomCount"
            type="number"
            min="2"
            max="10"
            class="input w-full"
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Assignment
          </label>
          <div class="flex items-center space-x-4">
            <label class="flex items-center">
              <input
                v-model="assignmentType"
                type="radio"
                value="automatic"
                class="mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Automatic</span>
            </label>
            
            <label class="flex items-center">
              <input
                v-model="assignmentType"
                type="radio"
                value="manual"
                class="mr-2"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Manual</span>
            </label>
          </div>
        </div>
        
        <button 
          @click="createRooms"
          class="btn btn-primary w-full"
          :disabled="isCreating"
        >
          <span v-if="isCreating">Creating...</span>
          <span v-else>Create Rooms</span>
        </button>
      </div>
      
      <div v-else>
        <div class="mb-4">
          <div 
            v-for="room in rooms" 
            :key="room.id"
            class="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
          >
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium text-gray-900 dark:text-white">{{ room.name }}</h3>
              <span class="text-sm text-gray-600 dark:text-gray-400">
                {{ room.participantIds.length }} participant{{ room.participantIds.length !== 1 ? 's' : '' }}
              </span>
            </div>
            
            <div class="text-sm text-gray-700 dark:text-gray-300">
              <div 
                v-for="participantId in room.participantIds" 
                :key="participantId"
                class="mb-1"
              >
                {{ getParticipantName(participantId) }}
              </div>
            </div>
          </div>
        </div>
        
        <div class="flex justify-between">
          <button 
            @click="broadcastMessage"
            class="btn btn-outline"
          >
            Broadcast Message
          </button>
          
          <button 
            @click="endBreakoutRooms"
            class="btn btn-primary"
            :disabled="isEnding"
          >
            <span v-if="isEnding">Ending...</span>
            <span v-else>End All Rooms</span>
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="p-4">
      <div v-if="currentRoom">
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          You are currently in <strong>{{ currentRoom.name }}</strong>.
        </p>
        
        <div class="mb-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Participants in this room:</h3>
          <ul class="text-sm text-gray-600 dark:text-gray-400">
            <li 
              v-for="participantId in currentRoom.participantIds" 
              :key="participantId"
              class="mb-1"
            >
              {{ getParticipantName(participantId) }}
              <span v-if="participantId === userId">(You)</span>
            </li>
          </ul>
        </div>
        
        <button 
          @click="leaveRoom"
          class="btn btn-outline"
          :disabled="isLeaving"
        >
          <span v-if="isLeaving">Leaving...</span>
          <span v-else>Return to Main Room</span>
        </button>
      </div>
      
      <div v-else>
        <p class="text-gray-700 dark:text-gray-300 mb-4">
          You are in the main room. The host may assign you to a breakout room.
        </p>
        
        <div v-if="rooms.length" class="mb-4">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Available rooms:</h3>
          <div 
            v-for="room in rooms" 
            :key="room.id"
            class="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center"
          >
            <span class="text-gray-700 dark:text-gray-300">{{ room.name }}</span>
            <button 
              @click="joinRoom(room.id)"
              class="btn btn-sm btn-outline"
              :disabled="isJoining"
            >
              Join
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { collection, onSnapshot, query } from 'firebase/firestore'
import { db } from '../firebase/config'
import { 
  createBreakoutRoom, 
  joinBreakoutRoom, 
  leaveBreakoutRoom, 
  endAllBreakoutRooms as endAllRooms 
} from '../utils/meetingFeatures'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  isHost: {
    type: Boolean,
    default: false
  },
  participants: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close'])

// State
const rooms = ref([])
const roomCount = ref(2)
const assignmentType = ref('automatic')
const isCreating = ref(false)
const isJoining = ref(false)
const isLeaving = ref(false)
const isEnding = ref(false)
let roomsUnsubscribe = null

// Computed properties
const currentRoom = computed(() => {
  return rooms.value.find(room => 
    room.participantIds.includes(props.userId)
  )
})

// Listen for breakout rooms
onMounted(() => {
  const roomsQuery = query(
    collection(db, 'meetings', props.meetingId, 'breakoutRooms')
  )
  
  roomsUnsubscribe = onSnapshot(roomsQuery, (snapshot) => {
    const roomsList = []
    
    snapshot.forEach(doc => {
      const roomData = doc.data()
      
      if (roomData.active) {
        roomsList.push({
          id: doc.id,
          ...roomData
        })
      }
    })
    
    rooms.value = roomsList
  })
})

// Clean up
onUnmounted(() => {
  if (roomsUnsubscribe) {
    roomsUnsubscribe()
  }
})

// Get participant name
const getParticipantName = (participantId) => {
  const participant = props.participants.find(p => p.id === participantId)
  return participant?.userName || 'Unknown'
}

// Create breakout rooms
const createRooms = async () => {
  if (isCreating.value) return
  
  try {
    isCreating.value = true
    
    // Create the rooms
    for (let i = 0; i < roomCount.value; i++) {
      const roomName = `Room ${i + 1}`
      let participantIds = []
      
      // Assign participants if automatic
      if (assignmentType.value === 'automatic') {
        // Distribute participants evenly
        participantIds = props.participants
          .filter(p => p.id !== props.userId) // Exclude host
          .filter((_, index) => index % roomCount.value === i)
          .map(p => p.id)
      }
      
      await createBreakoutRoom(props.meetingId, roomName, participantIds)
    }
  } catch (error) {
    console.error('Error creating breakout rooms:', error)
  } finally {
    isCreating.value = false
  }
}

// Join a breakout room
const joinRoom = async (roomId) => {
  if (isJoining.value) return
  
  try {
    isJoining.value = true
    await joinBreakoutRoom(props.meetingId, roomId, props.userId)
  } catch (error) {
    console.error('Error joining breakout room:', error)
  } finally {
    isJoining.value = false
  }
}

// Leave the current room
const leaveRoom = async () => {
  if (!currentRoom.value || isLeaving.value) return
  
  try {
    isLeaving.value = true
    await leaveBreakoutRoom(props.meetingId, currentRoom.value.id, props.userId)
  } catch (error) {
    console.error('Error leaving breakout room:', error)
  } finally {
    isLeaving.value = false
  }
}

// Broadcast a message to all rooms
const broadcastMessage = () => {
  // This would typically show a dialog to enter a message
  const message = prompt('Enter a message to broadcast to all rooms:')
  
  if (!message) return
  
  // In a real app, you would send this message to all rooms
  alert(`Message broadcast: ${message}`)
}

// End all breakout rooms
const endBreakoutRooms = async () => {
  if (isEnding.value) return
  
  try {
    isEnding.value = true
    await endAllRooms(props.meetingId)
  } catch (error) {
    console.error('Error ending breakout rooms:', error)
  } finally {
    isEnding.value = false
  }
}
</script>
