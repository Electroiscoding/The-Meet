<template>
  <div class="reaction-display">
    <transition-group name="reaction" tag="div" class="reactions-container">
      <div 
        v-for="reaction in visibleReactions" 
        :key="reaction.id"
        class="reaction-item"
        :style="{ 
          left: `${reaction.position}%`,
          animationDuration: `${reaction.duration}s`
        }"
      >
        <span class="reaction-emoji">{{ reaction.emoji }}</span>
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore'
import { db } from '../firebase/config'
import { reactions } from '../utils/meetingFeatures'

const props = defineProps({
  meetingId: {
    type: String,
    required: true
  }
})

// State
const visibleReactions = ref([])
let reactionCounter = 0
let reactionsUnsubscribe = null

// Listen for reactions
onMounted(() => {
  const reactionsQuery = query(
    collection(db, 'meetings', props.meetingId, 'reactions'),
    orderBy('timestamp', 'desc'),
    limit(10)
  )
  
  reactionsUnsubscribe = onSnapshot(reactionsQuery, (snapshot) => {
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        const reactionData = change.doc.data()
        
        // Add the reaction to the display
        addReaction(reactionData)
      }
    })
  })
})

// Clean up
onUnmounted(() => {
  if (reactionsUnsubscribe) {
    reactionsUnsubscribe()
  }
})

// Add a reaction to the display
const addReaction = (reactionData) => {
  const reaction = {
    id: `reaction-${reactionCounter++}`,
    emoji: reactionData.emoji,
    position: Math.random() * 80 + 10, // Random position between 10% and 90%
    duration: Math.random() * 2 + 3, // Random duration between 3 and 5 seconds
    timestamp: Date.now()
  }
  
  visibleReactions.value.push(reaction)
  
  // Remove the reaction after it's done animating
  setTimeout(() => {
    visibleReactions.value = visibleReactions.value.filter(r => r.id !== reaction.id)
  }, reaction.duration * 1000)
}

// Add a reaction directly (for local testing)
const addLocalReaction = (reactionId) => {
  const reaction = reactions.find(r => r.id === reactionId)
  if (!reaction) return
  
  addReaction({
    emoji: reaction.emoji,
    timestamp: new Date()
  })
}

// Expose methods
defineExpose({
  addLocalReaction
})
</script>

<style scoped>
.reactions-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.reaction-item {
  position: absolute;
  bottom: 0;
  animation: float-up linear forwards;
  opacity: 0;
}

.reaction-emoji {
  font-size: 2rem;
  display: inline-block;
}

@keyframes float-up {
  0% {
    bottom: 0;
    opacity: 0;
    transform: scale(0.5);
  }
  10% {
    opacity: 1;
    transform: scale(1);
  }
  90% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    bottom: 80%;
    opacity: 0;
    transform: scale(0.5);
  }
}

.reaction-enter-active {
  transition: all 0.3s ease-out;
}

.reaction-leave-active {
  transition: all 0.3s ease-in;
}

.reaction-enter-from,
.reaction-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>
