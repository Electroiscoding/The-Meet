<template>
  <div class="poll-display bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Poll</h2>
      
      <button 
        v-if="isCreator && poll.active"
        @click="endPoll"
        class="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        title="End poll"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
    
    <div class="p-4">
      <div class="mb-4">
        <h3 class="text-md font-medium text-gray-900 dark:text-white">{{ poll.question }}</h3>
      </div>
      
      <div v-if="!hasVoted && poll.active">
        <div 
          v-for="(option, index) in poll.options" 
          :key="index"
          class="mb-2"
        >
          <button 
            @click="vote(index)"
            class="w-full p-3 text-left rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {{ option.text }}
          </button>
        </div>
      </div>
      
      <div v-else>
        <div 
          v-for="(option, index) in poll.options" 
          :key="index"
          class="mb-3"
        >
          <div class="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-1">
            <span>{{ option.text }}</span>
            <span>{{ option.votes }} vote{{ option.votes !== 1 ? 's' : '' }}</span>
          </div>
          
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div 
              class="bg-primary h-2.5 rounded-full" 
              :style="{ width: `${calculatePercentage(option.votes)}%` }"
            ></div>
          </div>
        </div>
        
        <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p>Total votes: {{ totalVotes }}</p>
          <p v-if="!poll.active" class="mt-1 text-red-500 dark:text-red-400">This poll has ended</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { voteInPoll, endPoll as endPollFunction } from '../utils/meetingFeatures'

const props = defineProps({
  poll: {
    type: Object,
    required: true
  },
  meetingId: {
    type: String,
    required: true
  },
  userId: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['ended'])

// Computed properties
const isCreator = computed(() => {
  return props.poll.creatorId === props.userId
})

const hasVoted = computed(() => {
  return props.poll.voters && props.poll.voters.includes(props.userId)
})

const totalVotes = computed(() => {
  return props.poll.options.reduce((total, option) => total + option.votes, 0)
})

// Calculate percentage for progress bar
const calculatePercentage = (votes) => {
  if (totalVotes.value === 0) return 0
  return (votes / totalVotes.value) * 100
}

// Vote in the poll
const vote = async (optionIndex) => {
  try {
    await voteInPoll(
      props.meetingId,
      props.poll.id,
      props.userId,
      optionIndex
    )
  } catch (error) {
    console.error('Error voting in poll:', error)
  }
}

// End the poll
const endPoll = async () => {
  try {
    await endPollFunction(props.meetingId, props.poll.id)
    emit('ended', props.poll.id)
  } catch (error) {
    console.error('Error ending poll:', error)
  }
}
</script>
