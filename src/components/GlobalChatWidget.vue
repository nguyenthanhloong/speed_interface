<template>
  <div class="global-chat-wrapper">
    <transition name="slide-fade">
      <div v-if="isOpen" class="chat-window shadow-lg">
        <div class="chat-header">
          <div class="header-info">
            <h6 class="header-title">Kênh Điều Phối Chung</h6>
            <small class="header-subtitle">Hệ thống liên lạc nội bộ</small>
          </div>
          <button class="btn-close-chat" @click="toggleChat" title="Thu gọn">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="2.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M20 12H4"
              />
            </svg>
          </button>
        </div>

        <div class="chat-body" ref="chatBodyRef">
          <div class="time-divider">
            <span class="time-badge">Hôm nay</span>
          </div>

          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-row"
            :class="msg.isMine ? 'my-message' : 'other-message'"
          >
            <div class="message-meta">
              <template v-if="!msg.isMine">
                <span class="sender-info">
                  <span class="kho-badge">{{ msg.kho }}</span>
                  <strong class="sender-name">{{ msg.sender }}</strong>
                </span>
                <span class="msg-time">{{ msg.time }}</span>
              </template>

              <template v-else>
                <span class="msg-time">{{ msg.time }}</span>
                <span class="sender-info my-sender-name">
                  <strong>Bạn</strong>
                </span>
              </template>
            </div>

            <div
              class="message-bubble"
              :class="msg.isMine ? 'bubble-mine' : 'bubble-other'"
            >
              {{ msg.text }}
            </div>
          </div>
        </div>

        <div class="chat-footer">
          <div v-if="showEmoji" class="emoji-picker-container">
            <EmojiPicker @select="onSelectEmoji" />
          </div>

          <form @submit.prevent="sendMessage" class="chat-form">
            <button
              type="button"
              class="btn-emoji"
              @click="showEmoji = !showEmoji"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>

            <input
              type="text"
              class="chat-input"
              placeholder="Nhập tin nhắn..."
              :value="newMessage"
              @input="newMessage = $event.target.value"
              @focus="showEmoji = false"
            />

            <button
              type="submit"
              class="btn-send"
              :disabled="!newMessage.trim()"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"
                />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </transition>

    <button v-if="!isOpen" class="chat-fab shadow-lg" @click="toggleChat">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span v-if="unreadCount > 0" class="unread-badge">
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, nextTick, onUnmounted, computed, watch } from 'vue';
import { useAuthStore } from '../stores/auth';
import { chatService } from '../services/chat';
import apiClient from '../utils/axios';

import EmojiPicker from 'vue3-emoji-picker';
import 'vue3-emoji-picker/css';

const authStore = useAuthStore();
const currentUser = computed(() => authStore.user);

const isOpen = ref(false);
const newMessage = ref('');
const chatBodyRef = ref(null);
const messages = ref([]);

const showEmoji = ref(false);
const unreadCount = ref(0);
let socket = null;

const toggleChat = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    unreadCount.value = 0;
    showEmoji.value = false;
    setTimeout(scrollToBottom, 100);
  }
};

const onSelectEmoji = (emoji) => {
  newMessage.value += emoji.i;
};

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value) {
      chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight;
    }
  });
};

const initChat = async () => {
  if (socket) return;

  try {
    const res = await chatService.getHistory();
    if (res.data && res.data.data) {
      messages.value = res.data.data.map((msg) => ({
        id: msg.id,
        isMine: msg.user_id === currentUser.value?.id,
        kho: msg.kho,
        sender: msg.sender_name,
        time: msg.time,
        text: msg.content,
      }));
    }
  } catch (error) {
    console.error('Lỗi tải lịch sử chat:', error);
  }

  const baseURL = apiClient.defaults.baseURL || window.location.origin;
  console.log('Base URL:', baseURL);
  const wsBaseURL = baseURL.replace(/^http/, 'ws');
  console.log('WebSocket URL:', wsBaseURL);
  const token =
    authStore.token || authStore.accessToken || localStorage.getItem('token');

  if (!token) return;

  const wsUrl = `${wsBaseURL}/ws/chat?token=${token}`;

  socket = new WebSocket(wsUrl);
  socket.onmessage = (event) => {
    const incomingData = JSON.parse(event.data);

    messages.value.push({
      id: incomingData.id,
      isMine: incomingData.user_id === currentUser.value?.id,
      kho: incomingData.kho,
      sender: incomingData.sender_name,
      time: incomingData.time,
      text: incomingData.content,
    });

    if (isOpen.value) {
      scrollToBottom();
    } else {
      unreadCount.value++;
    }
  };
};

watch(
  currentUser,
  (newUser) => {
    if (newUser) {
      initChat();
    } else {
      if (socket) {
        socket.close();
        socket = null;
        messages.value = [];
      }
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  if (socket) {
    socket.close();
  }
});

const sendMessage = () => {
  if (!newMessage.value.trim() || !socket) return;
  socket.send(newMessage.value.trim());
  newMessage.value = '';
  showEmoji.value = false;
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.global-chat-wrapper {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-family: system-ui, -apple-system, sans-serif;
}

/* NÚT BONG BÓNG */
.chat-fab {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #0f3d26; /* Màu xanh của SpeedLight Group */
  color: white;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  transition: transform 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.chat-fab:hover {
  transform: scale(1.05);
}

.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background-color: #ef4444;
  color: white;
  font-size: 12px;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 12px;
  border: 2px solid white;
}

/* KHUNG CHAT */
.chat-window {
  width: 350px;
  height: 500px;
  background: white;
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  margin-bottom: 16px;
}

/* HEADER */
.chat-header {
  background-color: #0f3d26;
  color: white;
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}
.header-subtitle {
  font-size: 12px;
  opacity: 0.8;
}
.btn-close-chat {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  opacity: 0.8;
}
.btn-close-chat:hover {
  opacity: 1;
}

/* BODY */
.chat-body {
  flex: 1;
  overflow-y: auto;
  background-color: #f8fafc;
  padding: 16px;
}
.chat-body::-webkit-scrollbar {
  width: 6px;
}
.chat-body::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}

.time-divider {
  text-align: center;
  margin-bottom: 16px;
}
.time-badge {
  background: #e2e8f0;
  color: #475569;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
}

.message-row {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}
.my-message {
  align-items: flex-end;
}
.other-message {
  align-items: flex-start;
}

.message-meta {
  display: flex;
  align-items: flex-end;
  margin-bottom: 4px;
  font-size: 12px;
  color: #64748b;
}
.kho-badge {
  background: #e2e8f0;
  padding: 2px 6px;
  border-radius: 4px;
  margin-right: 6px;
  font-size: 10px;
  font-weight: bold;
}
.sender-name {
  font-weight: 600;
  color: #334155;
  margin-right: 8px;
}
.my-sender-name {
  color: #0f3d26;
  font-weight: bold;
  margin-left: 8px;
}
.msg-time {
  font-size: 11px;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.4;
  max-width: 85%;
  word-wrap: break-word;
}
.bubble-mine {
  background-color: #0f3d26;
  color: white;
  border-bottom-right-radius: 4px;
}
.bubble-other {
  background-color: white;
  color: #1e293b;
  border: 1px solid #e2e8f0;
  border-bottom-left-radius: 4px;
}

/* FOOTER */
.chat-footer {
  padding: 10px;
  background: white;
  border-top: 1px solid #e2e8f0;
  position: relative;
}
.chat-form {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-emoji {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
}
.btn-emoji:hover {
  color: #0f3d26;
}

.chat-input {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 8px 16px;
  font-size: 14px;
  outline: none;
}
.chat-input:focus {
  border-color: #0f3d26;
}

.btn-send {
  background-color: #0f3d26;
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}
.btn-send:disabled {
  background-color: #94a3b8;
  cursor: not-allowed;
}

/* EMOJI PICKER */
.emoji-picker-container {
  position: absolute;
  bottom: 100%;
  left: 10px;
  margin-bottom: 10px;
  z-index: 1000;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  background: white;
}

/* ANIMATION */
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(20px);
  opacity: 0;
}
</style>
