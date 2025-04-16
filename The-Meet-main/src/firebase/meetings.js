import { db } from './config'
import { collection, doc, setDoc, getDoc, addDoc, serverTimestamp, query, orderBy, onSnapshot } from 'firebase/firestore'
import { nanoid } from 'nanoid'

// Create a new meeting
export const createMeeting = async (userId, meetingName = '') => {
  try {
    // Generate a unique meeting ID
    const meetingId = nanoid(10)
    
    // Create the meeting document
    await setDoc(doc(db, 'meetings', meetingId), {
      createdBy: userId,
      createdAt: serverTimestamp(),
      meetingName: meetingName || `Meeting ${meetingId}`,
      active: true
    })
    
    return meetingId
  } catch (error) {
    console.error('Error creating meeting:', error)
    throw error
  }
}

// Check if a meeting exists
export const checkMeeting = async (meetingId) => {
  try {
    const meetingDoc = await getDoc(doc(db, 'meetings', meetingId))
    return meetingDoc.exists() && meetingDoc.data().active
  } catch (error) {
    console.error('Error checking meeting:', error)
    return false
  }
}

// Send a chat message
export const sendMessage = async (meetingId, userId, userName, message) => {
  try {
    await addDoc(collection(db, 'meetings', meetingId, 'messages'), {
      userId,
      userName,
      message,
      timestamp: serverTimestamp()
    })
  } catch (error) {
    console.error('Error sending message:', error)
    throw error
  }
}

// Listen for chat messages
export const listenForMessages = (meetingId, callback) => {
  const messagesQuery = query(
    collection(db, 'meetings', meetingId, 'messages'),
    orderBy('timestamp', 'asc')
  )
  
  return onSnapshot(messagesQuery, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    callback(messages)
  })
}

// Listen for participants
export const listenForParticipants = (meetingId, callback) => {
  const participantsRef = collection(db, 'meetings', meetingId, 'participants')
  
  return onSnapshot(participantsRef, (snapshot) => {
    const participants = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    callback(participants)
  })
}

// End a meeting
export const endMeeting = async (meetingId) => {
  try {
    await setDoc(doc(db, 'meetings', meetingId), {
      active: false,
      endedAt: serverTimestamp()
    }, { merge: true })
  } catch (error) {
    console.error('Error ending meeting:', error)
    throw error
  }
}
