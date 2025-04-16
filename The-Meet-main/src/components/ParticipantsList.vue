<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="p-3 border-b border-gray-200 dark:border-gray-700">
      <h2 class="font-semibold text-gray-900 dark:text-white">
        Participants ({{ participants.length }})
      </h2>
    </div>
    
    <div class="p-3 max-h-60 overflow-y-auto">
      <ul class="divide-y divide-gray-200 dark:divide-gray-700">
        <li 
          v-for="participant in participants" 
          :key="participant.id"
          class="py-2 flex items-center justify-between"
        >
          <div class="flex items-center">
            <div class="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ getInitials(participant.userName || 'User') }}
              </span>
            </div>
            <span class="text-sm text-gray-900 dark:text-white">
              {{ participant.userName || 'Anonymous' }}
              <span v-if="participant.id === currentUserId" class="text-xs text-gray-500 dark:text-gray-400">
                (You)
              </span>
            </span>
          </div>
          
          <div class="flex items-center">
            <span v-if="participant.isMuted" class="text-red-500 mr-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </span>
            
            <span v-if="participant.isVideoOff" class="text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
              </svg>
            </span>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
defineProps({
  participants: {
    type: Array,
    default: () => []
  },
  currentUserId: {
    type: String,
    required: true
  }
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
