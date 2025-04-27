import { ChatOpenAI } from "@langchain/openai";
import { config } from "dotenv";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import * as readline from "readline";

// Load environment variables from .env file
config();
const llm_key = process.env.MODELSTUDIO_API_KEY;

const llm = new ChatOpenAI({
  model: "qwen-plus",
  apiKey: llm_key,
  temperature: 0.7,
  configuration: {
    baseURL: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
  },
  streaming: true
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Store conversation history
const messageHistory: (HumanMessage | AIMessage)[] = [];

async function chat() {
  console.log("Welcome to the Conversational CLI. Type 'exit' to quit.");
  
  const askQuestion = () => {
    rl.question("\nYou: ", async (input) => {
      if (input.toLowerCase() === "exit") {
        console.log("Goodbye!");
        rl.close();
        return;
      }
      
      // Add user message to history
      messageHistory.push(new HumanMessage({ content: input }));
      
      // Stream the response
      process.stdout.write("AI: ");
      const stream = await llm.stream(messageHistory);
      
      let responseContent = "";
      for await (const chunk of stream) {
        if (chunk.content) {
          const content = typeof chunk.content === 'string' 
            ? chunk.content 
            : JSON.stringify(chunk.content);
          process.stdout.write(content);
          responseContent += content;
        }
      }
      console.log(); // Final newline after completion
      
      // Add AI response to history
      messageHistory.push(new AIMessage({ content: responseContent }));
      
      // Ask the next question
      askQuestion();
    });
  };
  
  askQuestion();
}

// Start the chat
chat();

export default llm;