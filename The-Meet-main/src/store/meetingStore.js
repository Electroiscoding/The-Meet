import { defineStore } from 'pinia'

export const useMeetingStore = defineStore('meeting', {
  state: () => ({
    meetingId: null,
    localStream: null,
    remoteStreams: {},
    isMicMuted: false,
    isCameraOff: false,
    isScreenSharing: false,
    participants: [],
    messages: [],
    connectionStatus: 'disconnected', // disconnected, connecting, connected
  }),
  
  actions: {
    setMeetingId(id) {
      this.meetingId = id
    },
    
    setLocalStream(stream) {
      this.localStream = stream
    },
    
    addRemoteStream(peerId, stream) {
      this.remoteStreams[peerId] = stream
    },
    
    removeRemoteStream(peerId) {
      delete this.remoteStreams[peerId]
    },
    
    toggleMic() {
      this.isMicMuted = !this.isMicMuted
      if (this.localStream) {
        this.localStream.getAudioTracks().forEach(track => {
          track.enabled = !this.isMicMuted
        })
      }
    },
    
    toggleCamera() {
      this.isCameraOff = !this.isCameraOff
      if (this.localStream) {
        this.localStream.getVideoTracks().forEach(track => {
          track.enabled = !this.isCameraOff
        })
      }
    },
    
    toggleScreenSharing() {
      this.isScreenSharing = !this.isScreenSharing
    },
    
    addParticipant(participant) {
      this.participants.push(participant)
    },
    
    removeParticipant(participantId) {
      this.participants = this.participants.filter(p => p.id !== participantId)
    },
    
    addMessage(message) {
      this.messages.push(message)
    },
    
    setConnectionStatus(status) {
      this.connectionStatus = status
    },
    
    reset() {
      this.meetingId = null
      this.localStream = null
      this.remoteStreams = {}
      this.isMicMuted = false
      this.isCameraOff = false
      this.isScreenSharing = false
      this.participants = []
      this.messages = []
      this.connectionStatus = 'disconnected'
    }
  }
})
