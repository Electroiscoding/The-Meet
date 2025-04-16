<template>
  <div class="poll-creator bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Create a Poll</h2>
    </div>
    
    <div class="p-4">
      <div class="mb-4">
        <label for="pollQuestion" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Question
        </label>
        <input
          id="pollQuestion"
          v-model="question"
          type="text"
          placeholder="What's your question?"
          class="input w-full"
          required
        />
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Options
        </label>
        
        <div 
          v-for="(option, index) in options" 
          :key="index"
          class="flex items-center mb-2"
        >
          <input
            v-model="options[index]"
            type="text"
            :placeholder="`Option ${index + 1}`"
            class="input flex-1 mr-2"
          />
          
          <button 
            v-if="options.length > 2"
            @click="removeOption(index)"
            class="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
            title="Remove option"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        
        <button 
          @click="addOption"
          class="mt-2 text-primary dark:text-primary-light hover:text-primary-dark dark:hover:text-primary flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Option
        </button>
      </div>
    </div>
    
    <div class="p-4 bg-gray-50 dark:bg-gray-700 flex justify-end">
      <button 
        @click="$emit('cancel')"
        class="btn btn-outline mr-2"
      >
        Cancel
      </button>
      
      <button 
        @click="createPoll"
        class="btn btn-primary"
        :disabled="!isValid || isCreating"
      >
        <span v-if="isCreating">Creating...</span>
        <span v-else>Create Poll</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { createPoll } from '../utils/meetingFeatures'

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

const emit = defineEmits(['created', 'cancel'])

// Poll data
const question = ref('')
const options = ref(['', ''])
const isCreating = ref(false)

// Computed properties
const isValid = computed(() => {
  return (
    question.value.trim() !== '' &&
    options.value.length >= 2 &&
    options.value.every(option => option.trim() !== '')
  )
})

// Add a new option
const addOption = () => {
  options.value.push('')
}

// Remove an option
const removeOption = (index) => {
  options.value.splice(index, 1)
}

// Create the poll
const createPoll = async () => {
  if (!isValid.value) return
  
  try {
    isCreating.value = true
    
    const pollId = await createPoll(
      props.meetingId,
      props.userId,
      question.value,
      options.value
    )
    
    emit('created', { id: pollId, question: question.value, options: options.value })
    
    // Reset form
    question.value = ''
    options.value = ['', '']
  } catch (error) {
    console.error('Error creating poll:', error)
  } finally {
    isCreating.value = false
  }
}
</script>
