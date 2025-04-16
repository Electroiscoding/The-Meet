<template>
  <div class="reaction-selector">
    <div class="flex items-center space-x-2 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <button 
        v-for="reaction in reactions" 
        :key="reaction.id"
        @click="sendReaction(reaction.id)"
        class="reaction-button p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform transform hover:scale-110"
        :title="reaction.name"
      >
        <span class="text-2xl">{{ reaction.emoji }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactions, sendReaction as sendReactionFunction } from '../utils/meetingFeatures'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['reaction-sent'])

// Send a reaction
const sendReaction = async (reactionId) => {
  try {
    await sendReactionFunction(
      props.meetingId,
      props.userId,
      props.userName,
      reactionId
    )
    
    emit('reaction-sent', reactionId)
  } catch (error) {
    console.error('Error sending reaction:', error)
  }
}
</script>

<style scoped>
.reaction-button {
  cursor: pointer;
  transition: transform 0.1s ease-in-out;
}

.reaction-button:hover {
  transform: scale(1.2);
}
</style>
