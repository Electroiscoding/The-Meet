import { db } from '../firebase/config'
import { collection, doc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import 'webrtc-adapter'

// ICE servers configuration for STUN/TURN
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ]
}

// Class to handle WebRTC connections
export class WebRTCHandler {
  constructor(meetingId, userId, onRemoteStreamAdded, onRemoteStreamRemoved, onParticipantJoined, onParticipantLeft) {
    this.meetingId = meetingId
    this.userId = userId
    this.peerConnections = {}
    this.localStream = null
    this.onRemoteStreamAdded = onRemoteStreamAdded
    this.onRemoteStreamRemoved = onRemoteStreamRemoved
    this.onParticipantJoined = onParticipantJoined
    this.onParticipantLeft = onParticipantLeft
  }

  // Initialize local media stream
  async initLocalStream(audioEnabled = true, videoEnabled = true) {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled
      })
      return this.localStream
    } catch (error) {
      console.error('Error accessing media devices:', error)
      throw error
    }
  }

  // Join a meeting
  async joinMeeting() {
    // Create a reference to the meeting in Firestore
    const meetingRef = collection(db, 'meetings', this.meetingId, 'participants')
    
    // Add the current user to the meeting
    await setDoc(doc(meetingRef, this.userId), {
      joined: new Date().toISOString(),
      userId: this.userId
    })
    
    // Listen for new participants
    this.participantsUnsubscribe = onSnapshot(meetingRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const participant = change.doc.data()
        const participantId = change.doc.id
        
        // Skip if it's the current user
        if (participantId === this.userId) return
        
        if (change.type === 'added') {
          // New participant joined
          this.onParticipantJoined(participant)
          this.createPeerConnection(participantId)
          this.createOffer(participantId)
        }
        
        if (change.type === 'removed') {
          // Participant left
          this.onParticipantLeft(participantId)
          this.closePeerConnection(participantId)
        }
      })
    })
    
    // Listen for WebRTC signaling
    this.signalingUnsubscribe = onSnapshot(
      collection(db, 'meetings', this.meetingId, 'signaling'),
      (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          const signal = change.doc.data()
          
          // Skip signals created by the current user
          if (signal.from === this.userId) return
          
          // Handle different signal types
          if (signal.type === 'offer' && signal.to === this.userId) {
            this.handleOffer(signal)
          } else if (signal.type === 'answer' && signal.to === this.userId) {
            this.handleAnswer(signal)
          } else if (signal.type === 'ice-candidate' && signal.to === this.userId) {
            this.handleIceCandidate(signal)
          }
        })
      }
    )
  }

  // Create a peer connection for a participant
  createPeerConnection(participantId) {
    // Create a new RTCPeerConnection
    const peerConnection = new RTCPeerConnection(iceServers)
    
    // Add local stream tracks to the connection
    this.localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, this.localStream)
    })
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal({
          type: 'ice-candidate',
          from: this.userId,
          to: participantId,
          candidate: event.candidate.toJSON()
        })
      }
    }
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = (event) => {
      console.log(`Connection state change: ${peerConnection.connectionState}`)
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      this.onRemoteStreamAdded(participantId, event.streams[0])
    }
    
    // Store the peer connection
    this.peerConnections[participantId] = peerConnection
    
    return peerConnection
  }

  // Create and send an offer to a participant
  async createOffer(participantId) {
    try {
      const peerConnection = this.peerConnections[participantId]
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)
      
      this.sendSignal({
        type: 'offer',
        from: this.userId,
        to: participantId,
        sdp: peerConnection.localDescription.toJSON()
      })
    } catch (error) {
      console.error('Error creating offer:', error)
    }
  }

  // Handle an offer from a participant
  async handleOffer(signal) {
    try {
      const participantId = signal.from
      
      // Create peer connection if it doesn't exist
      if (!this.peerConnections[participantId]) {
        this.createPeerConnection(participantId)
      }
      
      const peerConnection = this.peerConnections[participantId]
      
      // Set remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
      
      // Create answer
      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)
      
      // Send answer
      this.sendSignal({
        type: 'answer',
        from: this.userId,
        to: participantId,
        sdp: peerConnection.localDescription.toJSON()
      })
    } catch (error) {
      console.error('Error handling offer:', error)
    }
  }

  // Handle an answer from a participant
  async handleAnswer(signal) {
    try {
      const participantId = signal.from
      const peerConnection = this.peerConnections[participantId]
      
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp))
      }
    } catch (error) {
      console.error('Error handling answer:', error)
    }
  }

  // Handle an ICE candidate from a participant
  async handleIceCandidate(signal) {
    try {
      const participantId = signal.from
      const peerConnection = this.peerConnections[participantId]
      
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate))
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error)
    }
  }

  // Send a signaling message
  async sendSignal(signal) {
    try {
      const signalingRef = collection(db, 'meetings', this.meetingId, 'signaling')
      await setDoc(doc(signalingRef), {
        ...signal,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error sending signal:', error)
    }
  }

  // Close a peer connection
  closePeerConnection(participantId) {
    const peerConnection = this.peerConnections[participantId]
    
    if (peerConnection) {
      peerConnection.close()
      delete this.peerConnections[participantId]
      this.onRemoteStreamRemoved(participantId)
    }
  }

  // Leave the meeting
  async leaveMeeting() {
    // Close all peer connections
    Object.keys(this.peerConnections).forEach(participantId => {
      this.closePeerConnection(participantId)
    })
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
    }
    
    // Remove the user from the meeting
    try {
      await deleteDoc(doc(db, 'meetings', this.meetingId, 'participants', this.userId))
    } catch (error) {
      console.error('Error leaving meeting:', error)
    }
    
    // Unsubscribe from Firestore listeners
    if (this.participantsUnsubscribe) {
      this.participantsUnsubscribe()
    }
    
    if (this.signalingUnsubscribe) {
      this.signalingUnsubscribe()
    }
  }

  // Toggle screen sharing
  async toggleScreenSharing(enabled) {
    if (enabled) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        })
        
        // Replace video track in all peer connections
        const videoTrack = screenStream.getVideoTracks()[0]
        
        Object.values(this.peerConnections).forEach(peerConnection => {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          )
          
          if (sender) {
            sender.replaceTrack(videoTrack)
          }
        })
        
        // Store the screen sharing track
        this.screenTrack = videoTrack
        
        // Listen for the end of screen sharing
        this.screenTrack.onended = () => {
          this.toggleScreenSharing(false)
        }
        
        return screenStream
      } catch (error) {
        console.error('Error starting screen sharing:', error)
        throw error
      }
    } else {
      // Revert to camera video
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0]
        
        if (videoTrack) {
          Object.values(this.peerConnections).forEach(peerConnection => {
            const sender = peerConnection.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            )
            
            if (sender) {
              sender.replaceTrack(videoTrack)
            }
          })
        }
      }
      
      // Stop screen sharing track
      if (this.screenTrack) {
        this.screenTrack.stop()
        this.screenTrack = null
      }
    }
  }
}
