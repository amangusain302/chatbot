import {
  MinChatUiProvider,
  MainContainer,
  MessageInput,
  MessageContainer,
  MessageList,
  MessageHeader
} from "@minchat/react-chat-ui";
import { useEffect, useState, useRef } from "react";
import socketIO from 'socket.io-client';
import axios from "axios";
const baseUrl = "http://localhost:5000"
const socket = socketIO.connect(baseUrl);

function App() {
  const [messages, setMessage] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messageListRef = useRef(null);

  const getChatList = async () => {
    try {
      setIsLoading(true)
      const { data } = await axios.get(`${baseUrl}/api/v1/message/history`)
      console.log(data.data);
      const messages = data.data.map(ele => {
        return {
          text: ele.message,
          user: {
            id: ele.senderType,
            name: (ele.senderType == "bot") ? "Bot" : "User",
          },
        }
      })

      setMessage(messages);
      setIsLoading(false);
    }
    catch (err) {
      console.log(err.message)
    }
  }

  const onSendMessage = async (message) => {
    setMessage([...messages, {
      text: message,
      user: {
        id: "user",
        name: "User",
      },
    }]);

    socket.emit("Send-Message", {
      "roomId": "12345",
      "message": message
    })

    setIsTyping(true)
  }

  const joinChatRoom = async (roomId) => {
    socket.removeEventListener("Room-Join-Status")
    socket.emit("Join-Chat-Room", { roomId });
    socket.on("Room-Join-Status", (message) => {
      console.log(message)
    })
    newMessageListener()
  }

  const newMessageListener = async () => {
    socket.removeEventListener("New-Message")
    socket.on("New-Message", (data) => {

      setMessage((preMsg) => {
        console.log(preMsg, "PRE MESSGE ");
        return [...preMsg, {
          text: data.message,
          user: {
            id: data.senderType,
            name: (data.senderType == "bot") ? "bot" : "user",
          },
        }]
      })

      setIsTyping(false)
    })

  }

  const scrollToBottom = () => {
    if (messageListRef.current) {
      // Manually set scrollTop to the maximum value
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    getChatList();
    console.log((socket.connected) ? "Socket connected" : "Socket Not connected")
    joinChatRoom("12345");
  }, [])

  useEffect(() => {
    scrollToBottom(); // Ensure we scroll to the bottom whenever messages change
  }, [messages]);

  return (
    <MinChatUiProvider theme="#6ea9d7">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100vw" }}>
        <MainContainer style={{ height: '90vh', width: "50vw" }}>
          <MessageContainer>
            <MessageHeader />
            <div
              ref={messageListRef}
              style={{ overflowY: "auto", height: "100vh" }} // Scrollable div
            >
              <MessageList
              showTypingIndicator = {isTyping}
                currentUserId='user'
                messages={messages}
                loading={isLoading}
              />
            </div>
            <MessageInput showAttachButton={false} placeholder="Type message here" onSendMessage={onSendMessage} />
          </MessageContainer>
        </MainContainer>
      </div>
    </MinChatUiProvider>
  )
}

export default App
