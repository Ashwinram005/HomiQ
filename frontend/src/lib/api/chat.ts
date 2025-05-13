// src/lib/api/chat.js
const BASE_URL = "http://localhost:5000/api"; // adjust if different

// 1. Create or get chat room
export async function createChatRoom(user1Id, user2Id) {
  const res = await fetch(`${BASE_URL}/chatroom/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user1: user1Id, user2: user2Id }),
  });
  return res.json();
}

// 2. Get chat rooms for a user
export async function getUserChatRooms(userId) {
  const res = await fetch(`${BASE_URL}/chatroom/${userId}`);
  return res.json();
}

// 3. Send a message
export async function sendMessage({ chatRoomId, senderId, content }) {
  const res = await fetch(`${BASE_URL}/messages/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chatRoomId, senderId, content }),
  });
  return res.json();
}

// 4. Get messages for a room
export async function getMessagesForChatRoom(chatRoomId) {
  const res = await fetch(`${BASE_URL}/messages/${chatRoomId}`);
  return res.json();
}
