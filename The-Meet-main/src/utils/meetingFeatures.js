import { db } from '../firebase/config'
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'

// Virtual background options
export const virtualBackgrounds = [
  { id: 'none', name: 'None', url: null },
  { id: 'blur', name: 'Blur', url: 'blur' },
  { id: 'office', name: 'Office', url: '/public/assets/backgrounds/office.jpg' },
  { id: 'beach', name: 'Beach', url: '/public/assets/backgrounds/beach.jpg' },
  { id: 'forest', name: 'Forest', url: '/public/assets/backgrounds/forest.jpg' },
  { id: 'space', name: 'Space', url: '/public/assets/backgrounds/space.jpg' },
]

// Reaction options
export const reactions = [
  { id: 'thumbs-up', emoji: '👍', name: 'Thumbs Up' },
  { id: 'clap', emoji: '👏', name: 'Clap' },
  { id: 'heart', emoji: '❤️', name: 'Heart' },
  { id: 'laugh', emoji: '😂', name: 'Laugh' },
  { id: 'surprised', emoji: '😮', name: 'Surprised' },
  { id: 'thinking', emoji: '🤔', name: 'Thinking' },
]

// Send a reaction
export const sendReaction = async (meetingId, userId, userName, reactionId) => {
  try {
    const reaction = reactions.find(r => r.id === reactionId)
    if (!reaction) return
    
    await setDoc(doc(collection(db, 'meetings', meetingId, 'reactions')), {
      userId,
      userName,
      reactionId,
      emoji: reaction.emoji,
      timestamp: serverTimestamp()
    })
    
    // Auto-remove reaction after 5 seconds
    setTimeout(async () => {
      // This would be better handled by a cloud function in production
      // For now, we'll just let reactions expire naturally
    }, 5000)
  } catch (error) {
    console.error('Error sending reaction:', error)
  }
}

// Toggle hand raise
export const toggleHandRaise = async (meetingId, userId, userName, isRaised) => {
  try {
    await updateDoc(doc(db, 'meetings', meetingId, 'participants', userId), {
      handRaised: isRaised,
      handRaisedAt: isRaised ? serverTimestamp() : null
    })
  } catch (error) {
    console.error('Error toggling hand raise:', error)
  }
}

// Create a poll
export const createPoll = async (meetingId, creatorId, question, options) => {
  try {
    const pollRef = doc(collection(db, 'meetings', meetingId, 'polls'))
    
    await setDoc(pollRef, {
      creatorId,
      question,
      options: options.map(option => ({ text: option, votes: 0 })),
      voters: [],
      createdAt: serverTimestamp(),
      active: true
    })
    
    return pollRef.id
  } catch (error) {
    console.error('Error creating poll:', error)
    throw error
  }
}

// Vote in a poll
export const voteInPoll = async (meetingId, pollId, userId, optionIndex) => {
  try {
    // Get the current poll data
    const pollDoc = await getDoc(doc(db, 'meetings', meetingId, 'polls', pollId))
    
    if (!pollDoc.exists() || !pollDoc.data().active) {
      throw new Error('Poll not found or inactive')
    }
    
    const pollData = pollDoc.data()
    
    // Check if user has already voted
    if (pollData.voters.includes(userId)) {
      throw new Error('You have already voted in this poll')
    }
    
    // Update the poll with the new vote
    const options = [...pollData.options]
    options[optionIndex].votes += 1
    
    await updateDoc(doc(db, 'meetings', meetingId, 'polls', pollId), {
      options,
      voters: arrayUnion(userId)
    })
  } catch (error) {
    console.error('Error voting in poll:', error)
    throw error
  }
}

// End a poll
export const endPoll = async (meetingId, pollId) => {
  try {
    await updateDoc(doc(db, 'meetings', meetingId, 'polls', pollId), {
      active: false,
      endedAt: serverTimestamp()
    })
  } catch (error) {
    console.error('Error ending poll:', error)
    throw error
  }
}

// Create a breakout room
export const createBreakoutRoom = async (meetingId, name, participantIds) => {
  try {
    const roomRef = doc(collection(db, 'meetings', meetingId, 'breakoutRooms'))
    
    await setDoc(roomRef, {
      name,
      participantIds,
      createdAt: serverTimestamp(),
      active: true
    })
    
    return roomRef.id
  } catch (error) {
    console.error('Error creating breakout room:', error)
    throw error
  }
}

// Join a breakout room
export const joinBreakoutRoom = async (meetingId, roomId, userId) => {
  try {
    await updateDoc(doc(db, 'meetings', meetingId, 'breakoutRooms', roomId), {
      participantIds: arrayUnion(userId)
    })
    
    // Update user's current room
    await updateDoc(doc(db, 'meetings', meetingId, 'participants', userId), {
      currentBreakoutRoom: roomId
    })
  } catch (error) {
    console.error('Error joining breakout room:', error)
    throw error
  }
}

// Leave a breakout room
export const leaveBreakoutRoom = async (meetingId, roomId, userId) => {
  try {
    const roomDoc = await getDoc(doc(db, 'meetings', meetingId, 'breakoutRooms', roomId))
    
    if (!roomDoc.exists()) {
      throw new Error('Breakout room not found')
    }
    
    const roomData = roomDoc.data()
    
    // Remove user from room
    await updateDoc(doc(db, 'meetings', meetingId, 'breakoutRooms', roomId), {
      participantIds: roomData.participantIds.filter(id => id !== userId)
    })
    
    // Update user's current room
    await updateDoc(doc(db, 'meetings', meetingId, 'participants', userId), {
      currentBreakoutRoom: null
    })
  } catch (error) {
    console.error('Error leaving breakout room:', error)
    throw error
  }
}

// End all breakout rooms
export const endAllBreakoutRooms = async (meetingId) => {
  try {
    const roomsRef = collection(db, 'meetings', meetingId, 'breakoutRooms')
    const roomsSnapshot = await getDocs(roomsRef)
    
    const batch = writeBatch(db)
    
    roomsSnapshot.forEach(doc => {
      batch.update(doc.ref, {
        active: false,
        endedAt: serverTimestamp()
      })
    })
    
    await batch.commit()
  } catch (error) {
    console.error('Error ending breakout rooms:', error)
    throw error
  }
}

// Save whiteboard data
export const saveWhiteboardData = async (meetingId, data) => {
  try {
    await setDoc(doc(db, 'meetings', meetingId, 'whiteboard', 'data'), {
      content: data,
      updatedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Error saving whiteboard data:', error)
    throw error
  }
}

// Start recording
export const startRecording = async (meetingId, userId) => {
  try {
    await setDoc(doc(db, 'meetings', meetingId, 'recordings', 'current'), {
      startedBy: userId,
      startedAt: serverTimestamp(),
      active: true
    })
  } catch (error) {
    console.error('Error starting recording:', error)
    throw error
  }
}

// Stop recording
export const stopRecording = async (meetingId, userId) => {
  try {
    await updateDoc(doc(db, 'meetings', meetingId, 'recordings', 'current'), {
      stoppedBy: userId,
      stoppedAt: serverTimestamp(),
      active: false
    })
  } catch (error) {
    console.error('Error stopping recording:', error)
    throw error
  }
}
