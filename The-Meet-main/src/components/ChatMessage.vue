<template>
  <div class="mb-3">
    <div class="flex items-start">
      <div 
        class="flex-1 rounded-lg px-3 py-2 text-sm"
        :class="{ 
          'bg-primary-light text-white': isFromCurrentUser,
          'bg-gray-100 dark:bg-gray-700 dark:text-white': !isFromCurrentUser,
          'ml-auto': isFromCurrentUser
        }"
      >
        <div class="font-semibold mb-1">
          {{ isFromCurrentUser ? 'You' : message.userName }}
        </div>
        <div>{{ message.message }}</div>
      </div>
    </div>
    <div 
      class="text-xs text-gray-500 dark:text-gray-400 mt-1"
      :class="{ 'text-right': isFromCurrentUser }"
    >
      {{ formatTime(message.timestamp) }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  currentUserId: {
    type: String,
    required: true
  }
})

// Check if the message is from the current user
const isFromCurrentUser = computed(() => {
  return props.message.userId === props.currentUserId
})

// Format timestamp
const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>
